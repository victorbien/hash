create or replace function public.cms_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.is_cms_publisher()
returns boolean
language sql
stable
as $$
  select public.cms_role() in ('admin', 'publisher');
$$;

create or replace function public.can_manage_cms_type(content_kind text)
returns boolean
language sql
stable
as $$
  select public.cms_role() in ('admin', 'publisher', 'editor')
    or (public.cms_role() = 'volunteer_coordinator' and content_kind = 'volunteer');
$$;

create table public.cms_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('about', 'service', 'resource', 'volunteer', 'home')),
  title text not null check (length(trim(title)) between 1 and 180),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 180),
  summary text not null default '' check (length(summary) <= 500),
  body text not null default '' check (length(body) <= 20000),
  category text check (category is null or length(category) <= 100),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  display_order integer not null default 0,
  image_path text,
  image_alt text,
  seo_title text check (seo_title is null or length(seo_title) <= 180),
  meta_description text check (meta_description is null or length(meta_description) <= 320),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  unique (content_type, slug),
  check (image_alt is null or length(image_alt) <= 500),
  check (image_path is null or length(image_path) <= 1024)
);

create index cms_content_public_listing_idx
  on public.cms_content (content_type, status, display_order, updated_at desc);

create table public.cms_content_revisions (
  id bigint generated always as identity primary key,
  content_id uuid not null references public.cms_content(id) on delete cascade,
  content_snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cms_audit_log (
  id bigint generated always as identity primary key,
  content_id uuid,
  content_type text not null,
  action text not null check (action in ('created', 'updated', 'published', 'unpublished', 'archived', 'deleted')),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.cms_content enable row level security;
alter table public.cms_content_revisions enable row level security;
alter table public.cms_audit_log enable row level security;

grant select on public.cms_content to anon, authenticated;
grant insert, update, delete on public.cms_content to authenticated;
grant select on public.cms_content_revisions, public.cms_audit_log to authenticated;

create policy "Public and authorised staff read CMS content" on public.cms_content
  for select to anon, authenticated
  using (status = 'published' or public.can_manage_cms_type(content_type));

create policy "Editors create CMS drafts" on public.cms_content
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (public.is_cms_publisher())
      or (public.can_manage_cms_type(content_type) and status = 'draft')
    )
  );

create policy "Editors update drafts and publishers manage content" on public.cms_content
  for update to authenticated
  using (
    public.is_cms_publisher()
    or (status = 'draft' and public.can_manage_cms_type(content_type))
  )
  with check (
    updated_by = (select auth.uid())
    and (
      public.is_cms_publisher()
      or (status = 'draft' and public.can_manage_cms_type(content_type))
    )
  );

create policy "Publishers delete CMS content" on public.cms_content
  for delete to authenticated
  using (public.is_cms_publisher());

create policy "CMS staff read content revisions" on public.cms_content_revisions
  for select to authenticated
  using (
    exists (
      select 1 from public.cms_content content
      where content.id = content_id
        and public.can_manage_cms_type(content.content_type)
    )
  );

create policy "Administrators read CMS audit log" on public.cms_audit_log
  for select to authenticated
  using (public.cms_role() = 'admin');

create or replace function public.prepare_cms_content_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.created_by := auth.uid();
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();

  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at := now();
    elsif old.status <> 'published' then
      new.published_at := now();
    end if;
  else
    new.published_at := null;
  end if;

  if new.status = 'archived' then
    if tg_op = 'INSERT' then
      new.archived_at := now();
    elsif old.status <> 'archived' then
      new.archived_at := now();
    end if;
  else
    new.archived_at := null;
  end if;
  return new;
end;
$$;

create trigger cms_content_prepare_change
  before insert or update on public.cms_content
  for each row execute function public.prepare_cms_content_change();

create or replace function public.record_cms_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_status text;
  next_status text;
  change_action text;
begin
  if tg_op = 'UPDATE' then
    insert into public.cms_content_revisions (content_id, content_snapshot, changed_by)
    values (old.id, to_jsonb(old), auth.uid());
    previous_status := old.status;
  end if;

  if tg_op = 'DELETE' then
    insert into public.cms_audit_log (content_id, content_type, action, actor_id)
    values (old.id, old.content_type, 'deleted', auth.uid());
    return old;
  end if;

  if tg_op = 'INSERT' then
    change_action := case when new.status = 'published' then 'published' else 'created' end;
  else
    next_status := new.status;
    change_action := case
      when previous_status <> next_status and next_status = 'published' then 'published'
      when previous_status <> next_status and next_status = 'archived' then 'archived'
      when previous_status = 'published' and next_status <> 'published' then 'unpublished'
      else 'updated'
    end;
  end if;

  insert into public.cms_audit_log (content_id, content_type, action, actor_id)
  values (new.id, new.content_type, change_action, auth.uid());
  return new;
end;
$$;

create trigger cms_content_change_record
  after insert or update or delete on public.cms_content
  for each row execute function public.record_cms_content_change();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public may read published CMS media" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'cms-media'
    and (
      exists (
        select 1 from public.cms_content content
        where content.image_path = name and content.status = 'published'
      )
      or exists (
        select 1 from public.cms_content content
        where content.image_path = name
          and public.can_manage_cms_type(content.content_type)
      )
    )
  );

create policy "CMS staff upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cms-media'
    and (
      public.can_manage_cms_type('about')
      or public.can_manage_cms_type('service')
      or public.can_manage_cms_type('resource')
      or public.can_manage_cms_type('volunteer')
      or public.can_manage_cms_type('home')
    )
  );

create policy "CMS staff update media" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cms-media'
    and (
      public.can_manage_cms_type('about')
      or public.can_manage_cms_type('service')
      or public.can_manage_cms_type('resource')
      or public.can_manage_cms_type('volunteer')
      or public.can_manage_cms_type('home')
    )
  )
  with check (
    bucket_id = 'cms-media'
    and (
      public.can_manage_cms_type('about')
      or public.can_manage_cms_type('service')
      or public.can_manage_cms_type('resource')
      or public.can_manage_cms_type('volunteer')
      or public.can_manage_cms_type('home')
    )
  );

create policy "CMS publishers delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cms-media' and public.is_cms_publisher());

insert into public.cms_content (
  content_type, title, slug, summary, body, category, status, display_order, featured
)
values
  (
    'home',
    'Compassionate HIV support rooted in community care.',
    'hero',
    'HASH works to make HIV prevention, testing, treatment linkage, and support more accessible, stigma-free, and human-centered for people across the Philippines.',
    '',
    'Homepage',
    'published',
    0,
    true
  ),
  (
    'home',
    'Who we are',
    'who-we-are',
    'A community-based organisation working for better HIV outcomes.',
    'HASH brings together prevention, testing, treatment linkage, community support, and advocacy to make care more accessible and more humane.',
    'Homepage',
    'published',
    1,
    false
  ),
  (
    'home',
    'Founded',
    'founded',
    '2015',
    'Community-led response',
    'Quick fact',
    'published',
    2,
    false
  ),
  (
    'home',
    'Programs',
    'programs',
    'HIV prevention, testing & support',
    'Rooted in community care',
    'Quick fact',
    'published',
    3,
    false
  ),
  (
    'home',
    'Reach',
    'reach',
    'Philippines-wide',
    'Local and digital outreach',
    'Quick fact',
    'published',
    4,
    false
  ),
  (
    'home',
    'Approach',
    'approach',
    'Stigma-free',
    'People-centred care',
    'Quick fact',
    'published',
    5,
    false
  ),
  (
    'home',
    'Why HASH',
    'why-hash',
    'Evidence-informed, community-led, and deeply human.',
    'HASH combines grassroots trust with practical, organised care pathways to support communities affected by HIV and related health challenges.',
    'Homepage',
    'published',
    6,
    false
  ),
  (
    'home',
    'Prevention',
    'prevention',
    '',
    'HASH promotes HIV prevention through community education, prevention programmes, screening, and access to PrEP and self-testing support.',
    'Homepage',
    'published',
    7,
    false
  ),
  (
    'home',
    'Care',
    'care',
    '',
    'The organisation links people to treatment and care, while building systems that help communities navigate support more confidently.',
    'Homepage',
    'published',
    8,
    false
  ),
  (
    'home',
    'Advocacy',
    'advocacy',
    '',
    'HASH works with partners, leaders, and communities to strengthen HIV awareness, policy, and accountability across settings.',
    'Homepage',
    'published',
    9,
    false
  ),
  (
    'about',
    'Mission',
    'mission',
    '',
    'HASH works to ensure that people affected by HIV have access to quality, stigma-free, community-centered services. The organisation focuses on prevention, testing, treatment linkage, PrEP, HIV self-testing, youth engagement, workplace HIV policies, harm reduction, community-led monitoring, digital health, and advocacy.',
    'About HASH',
    'published',
    0,
    false
  ),
  (
    'about',
    'Approach',
    'approach',
    '',
    'HASH takes a community-led, people-centered approach to HIV care. It combines service delivery with education, outreach, and partnership-building to reduce barriers and strengthen trust for the people it serves.',
    'About HASH',
    'published',
    1,
    false
  ),
  (
    'about',
    'Founded in 2015',
    'founded-in-2015',
    '',
    'Founded in 2015 by community advocates committed to improving HIV response in the Philippines.',
    'Key milestones',
    'published',
    2,
    false
  ),
  (
    'about',
    'Community-based screening',
    'community-based-screening',
    '',
    'Pioneered Community-Based HIV Screening (CBS) as part of a practical, localised prevention and testing model.',
    'Key milestones',
    'published',
    3,
    false
  ),
  (
    'about',
    'Community care pathways',
    'community-care-pathways',
    '',
    'Built community case management, self-testing distribution, and PrEP support pathways.',
    'Key milestones',
    'published',
    4,
    false
  ),
  (
    'about',
    'Strategic initiatives, 2024–2027',
    'strategic-initiatives-2024-2027',
    '',
    'Continued partnerships and strategic initiatives from 2024–2027 in youth leadership, workplace HIV policy, and community-led monitoring.',
    'Key milestones',
    'published',
    5,
    false
  ),
  (
    'service',
    'Community-Based HIV Screening',
    'community-based-hiv-screening',
    'Accessible HIV screening delivered by trained community advocates and volunteers in local settings.',
    '',
    'HIV services',
    'published',
    0,
    true
  ),
  (
    'service',
    'PrEP & e-PrEP',
    'prep-e-prep',
    'Support for PrEP access, education, and community-led initiation models to reduce barriers to prevention.',
    '',
    'HIV prevention',
    'published',
    1,
    true
  ),
  (
    'service',
    'HIV Self-Testing',
    'hiv-self-testing',
    'Confidential and stigma-free self-testing distribution with linkage support for follow-up care.',
    '',
    'HIV prevention',
    'published',
    2,
    true
  ),
  (
    'service',
    'Case Management',
    'case-management',
    'Follow-up support for treatment, wellness, and connection to services for people living with HIV and those at risk.',
    '',
    'Care and support',
    'published',
    3,
    true
  ),
  (
    'resource',
    'HASH HIV 101',
    'hash-hiv-101',
    'Plain-language educational content explaining HIV basics, transmission, prevention, and common questions.',
    '',
    'Education',
    'published',
    0,
    true
  ),
  (
    'resource',
    '2025 Annual Report',
    '2025-annual-report',
    'A snapshot of HASH’s programmes, partnerships, and service delivery progress.',
    '',
    'Report',
    'draft',
    1,
    false
  ),
  (
    'resource',
    'Training Materials',
    'training-materials',
    'Resources covering community screening, motivational dialogue, and workplace HIV education.',
    '',
    'Training',
    'draft',
    2,
    false
  ),
  (
    'volunteer',
    'How volunteers contribute',
    'how-volunteers-contribute',
    'HASH describes its work as community-led, with community advocates and volunteers contributing to accessible services and education. Specific volunteer assignments and eligibility are confirmed by HASH.',
    '',
    'Volunteer information',
    'published',
    0,
    false
  ),
  (
    'home',
    'Impact figures — approval required',
    'impact-figures-review',
    'CBS Motivators trained: 1,400+; Community Case Managers trained: 500+; Key population members reached: 35,000+; Linked to treatment: 3,000+.',
    'These figures were present in the prior website content and require HASH verification before publication.',
    'Impact',
    'draft',
    10,
    false
  )
on conflict (content_type, slug) do nothing;
