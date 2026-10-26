create or replace function public.is_hash_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  phone text,
  preferred_contact_method text,
  location text,
  preferred_language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(first_name) between 1 and 120),
  check (length(last_name) between 1 and 120),
  check (preferred_name is null or length(preferred_name) <= 120),
  check (phone is null or length(phone) <= 80),
  check (location is null or length(location) <= 160),
  check (preferred_language is null or length(preferred_language) <= 80)
);

create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending_review'
    check (status in ('draft', 'submitted', 'pending_review', 'approved', 'additional_information_required', 'not_approved', 'inactive', 'suspended')),
  interests text[] not null default '{}',
  availability jsonb not null default '{}'::jsonb,
  skills text,
  experience text,
  motivation text,
  additional_information text,
  consent_acknowledgements jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(interests) <= 30),
  check (length(availability::text) <= 8192),
  check (jsonb_typeof(consent_acknowledgements) = 'object'),
  check (skills is null or length(skills) <= 2000),
  check (experience is null or length(experience) <= 2000),
  check (motivation is null or length(motivation) <= 2000),
  check (additional_information is null or length(additional_information) <= 2000)
);

create table if not exists public.application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.volunteer_applications(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  review_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  deadline timestamptz,
  expected_commitment text,
  required_skills text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or start_at is null or end_at >= start_at)
);

create table if not exists public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  volunteer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, volunteer_id)
);

create table if not exists public.volunteer_training_progress (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references auth.users(id) on delete cascade,
  training_resource_id uuid not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (volunteer_id, training_resource_id)
);

create table if not exists public.training_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  resource_url text,
  resource_path text,
  required boolean not null default false,
  approval_required boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (resource_url is null or resource_path is null)
);

alter table public.volunteer_training_progress
  add constraint volunteer_training_progress_resource_fk
  foreign key (training_resource_id) references public.training_resources(id) on delete cascade;

create table if not exists public.volunteer_activity (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  activity_type text not null,
  activity_date timestamptz not null,
  hours numeric(6, 2) check (hours is null or hours >= 0),
  status text not null default 'recorded' check (status in ('planned', 'completed', 'cancelled', 'recorded')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists volunteer_applications_user_id_idx on public.volunteer_applications(user_id);
create index if not exists opportunities_published_start_idx on public.opportunities(status, start_at);
create index if not exists volunteer_activity_owner_date_idx on public.volunteer_activity(volunteer_id, activity_date desc);
create index if not exists announcements_published_idx on public.announcements(status, published_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_volunteer_application()
returns trigger
language plpgsql
as $$
begin
  if not public.is_hash_admin() then
    if tg_op = 'INSERT' then
      if new.user_id <> auth.uid() then
        raise exception 'Application owner must match the authenticated user';
      end if;
      new.id = gen_random_uuid();
      new.status = 'pending_review';
      new.submitted_at = now();
      new.created_at = now();
    elsif new.id <> old.id
      or new.user_id <> old.user_id
      or new.created_at <> old.created_at
      or new.status <> old.status
      or new.submitted_at <> old.submitted_at
      or new.consent_acknowledgements is distinct from old.consent_acknowledgements then
      raise exception 'Application status and ownership are managed by HASH';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_training_progress()
returns trigger
language plpgsql
as $$
begin
  if not public.is_hash_admin() then
    if new.volunteer_id <> auth.uid() or new.status = 'completed'
      or (tg_op = 'UPDATE' and old.status = 'completed') then
      raise exception 'Training completion is managed by HASH';
    end if;
    new.completed_at = null;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_opportunity_application()
returns trigger
language plpgsql
as $$
begin
  if not public.is_hash_admin() then
    if new.volunteer_id <> auth.uid() then
      raise exception 'Opportunity application owner must match the authenticated user';
    end if;
    new.id = gen_random_uuid();
    new.status = 'pending';
    new.submitted_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_volunteer_account_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
begin
  if nullif(metadata ->> 'first_name', '') is null
    or nullif(metadata ->> 'last_name', '') is null
    or metadata -> 'consent_acknowledgements' ->> 'code_of_conduct' is distinct from 'true'
    or metadata -> 'consent_acknowledgements' ->> 'privacy_notice' is distinct from 'true'
    or metadata -> 'consent_acknowledgements' ->> 'application_communications' is distinct from 'true'
    or nullif(metadata -> 'consent_acknowledgements' ->> 'code_of_conduct_url', '') is null
    or nullif(metadata -> 'consent_acknowledgements' ->> 'privacy_notice_url', '') is null then
    raise exception 'Required volunteer profile details and acknowledgements are missing';
  end if;

  insert into public.profiles (id, first_name, last_name, preferred_name, phone, preferred_contact_method, location, preferred_language)
  values (
    new.id,
    coalesce(metadata ->> 'first_name', ''),
    coalesce(metadata ->> 'last_name', ''),
    nullif(metadata ->> 'preferred_name', ''),
    nullif(metadata ->> 'phone', ''),
    nullif(metadata ->> 'preferred_contact_method', ''),
    nullif(metadata ->> 'location', ''),
    nullif(metadata ->> 'preferred_language', '')
  );

  insert into public.volunteer_applications (
    user_id, interests, availability, skills, experience, motivation, additional_information, consent_acknowledgements
  )
  values (
    new.id,
    coalesce(array(select jsonb_array_elements_text(coalesce(metadata -> 'interests', '[]'::jsonb))), '{}'),
    coalesce(metadata -> 'availability', '{}'::jsonb),
    nullif(metadata ->> 'skills', ''),
    nullif(metadata ->> 'experience', ''),
    nullif(metadata ->> 'motivation', ''),
    nullif(metadata ->> 'additional_information', ''),
    jsonb_build_object(
      'code_of_conduct', true,
      'code_of_conduct_url', metadata -> 'consent_acknowledgements' ->> 'code_of_conduct_url',
      'privacy_notice', true,
      'privacy_notice_url', metadata -> 'consent_acknowledgements' ->> 'privacy_notice_url',
      'application_communications', true,
      'acknowledged_at', now()
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_volunteer on auth.users;
create trigger on_auth_user_created_volunteer
  after insert on auth.users
  for each row execute function public.create_volunteer_account_records();

drop trigger if exists protect_volunteer_application_update on public.volunteer_applications;
create trigger protect_volunteer_application_update
  before insert or update on public.volunteer_applications
  for each row execute function public.protect_volunteer_application();

drop trigger if exists protect_training_progress_update on public.volunteer_training_progress;
create trigger protect_training_progress_update
  before insert or update on public.volunteer_training_progress
  for each row execute function public.protect_training_progress();

drop trigger if exists protect_opportunity_application_update on public.opportunity_applications;
create trigger protect_opportunity_application_update
  before insert or update on public.opportunity_applications
  for each row execute function public.protect_opportunity_application();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'volunteer_applications',
    'application_reviews',
    'opportunities',
    'opportunity_applications',
    'volunteer_training_progress',
    'training_resources',
    'volunteer_activity',
    'announcements'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    if table_name <> 'application_reviews' and table_name <> 'volunteer_activity' then
      execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
    end if;
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.application_reviews enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_applications enable row level security;
alter table public.volunteer_training_progress enable row level security;
alter table public.training_resources enable row level security;
alter table public.volunteer_activity enable row level security;
alter table public.announcements enable row level security;

create policy "Volunteers read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_hash_admin());
create policy "Volunteers update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()) or public.is_hash_admin())
  with check (id = (select auth.uid()) or public.is_hash_admin());
create policy "HASH admins manage profiles" on public.profiles
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "Volunteers read their own application" on public.volunteer_applications
  for select to authenticated using (user_id = (select auth.uid()) or public.is_hash_admin());
create policy "Volunteers update their permitted application details" on public.volunteer_applications
  for update to authenticated using (user_id = (select auth.uid()) or public.is_hash_admin())
  with check (user_id = (select auth.uid()) or public.is_hash_admin());
create policy "Volunteers submit their own application" on public.volunteer_applications
  for insert to authenticated with check (user_id = (select auth.uid()) or public.is_hash_admin());
create policy "HASH admins manage applications" on public.volunteer_applications
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "HASH admins read application reviews" on public.application_reviews
  for select to authenticated using (public.is_hash_admin());
create policy "HASH admins manage application reviews" on public.application_reviews
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "Volunteers read published eligible opportunities" on public.opportunities
  for select to authenticated using (
    status = 'published' and exists (
      select 1 from public.volunteer_applications application
      where application.user_id = (select auth.uid()) and application.status = 'approved'
    )
  );
create policy "HASH admins manage opportunities" on public.opportunities
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "Volunteers read their opportunity applications" on public.opportunity_applications
  for select to authenticated using (
    public.is_hash_admin()
    or (
      volunteer_id = (select auth.uid())
      and exists (
        select 1 from public.volunteer_applications application
        where application.user_id = (select auth.uid()) and application.status = 'approved'
      )
    )
  );
create policy "Approved volunteers express interest" on public.opportunity_applications
  for insert to authenticated with check (
    volunteer_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.volunteer_applications application
      where application.user_id = (select auth.uid()) and application.status = 'approved'
    )
    and exists (
      select 1 from public.opportunities opportunity
      where opportunity.id = opportunity_id and opportunity.status = 'published'
    )
  );
create policy "HASH admins manage opportunity applications" on public.opportunity_applications
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "Volunteers read their training progress" on public.volunteer_training_progress
  for select to authenticated using (
    public.is_hash_admin()
    or (
      volunteer_id = (select auth.uid())
      and exists (
        select 1
        from public.training_resources resource
        join public.volunteer_applications application on application.user_id = (select auth.uid())
        where resource.id = training_resource_id
          and resource.status = 'published'
          and (
            application.status = 'approved'
            or (
              application.status in ('draft', 'submitted', 'pending_review', 'additional_information_required')
              and not resource.approval_required
            )
          )
      )
    )
  );
create policy "Volunteers record their own training progress" on public.volunteer_training_progress
  for insert to authenticated with check (
    volunteer_id = (select auth.uid())
    and status = 'in_progress'
    and exists (
      select 1 from public.training_resources resource
      where resource.id = training_resource_id
        and resource.status = 'published'
        and (
          exists (
            select 1 from public.volunteer_applications application
            where application.user_id = (select auth.uid())
              and (
                application.status = 'approved'
                or (
                  application.status in ('draft', 'submitted', 'pending_review', 'additional_information_required')
                  and not resource.approval_required
                )
              )
          )
        )
    )
  );
create policy "Volunteers update their own training progress" on public.volunteer_training_progress
  for update to authenticated using (volunteer_id = (select auth.uid()) or public.is_hash_admin())
  with check (
    public.is_hash_admin() or (
      volunteer_id = (select auth.uid())
      and status = 'in_progress'
      and exists (
        select 1 from public.training_resources resource
        where resource.id = training_resource_id
          and resource.status = 'published'
          and (
            exists (
              select 1 from public.volunteer_applications application
              where application.user_id = (select auth.uid())
                and (
                  application.status = 'approved'
                  or (
                    application.status in ('draft', 'submitted', 'pending_review', 'additional_information_required')
                    and not resource.approval_required
                  )
                )
            )
          )
      )
    )
  );
create policy "HASH admins manage training progress" on public.volunteer_training_progress
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "Volunteers read published permitted training resources" on public.training_resources
  for select to authenticated using (
    status = 'published'
    and exists (
      select 1 from public.volunteer_applications application
      where application.user_id = (select auth.uid())
        and (
          application.status = 'approved'
          or (
            application.status in ('draft', 'submitted', 'pending_review', 'additional_information_required')
            and not approval_required
          )
        )
      )
  );
create policy "HASH admins manage training resources" on public.training_resources
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "Volunteers read their own activity" on public.volunteer_activity
  for select to authenticated using (
    public.is_hash_admin()
    or (
      volunteer_id = (select auth.uid())
      and exists (
        select 1 from public.volunteer_applications application
        where application.user_id = (select auth.uid()) and application.status = 'approved'
      )
    )
  );
create policy "HASH admins manage volunteer activity" on public.volunteer_activity
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

create policy "Approved volunteers read published announcements" on public.announcements
  for select to authenticated using (
    status = 'published' and exists (
      select 1 from public.volunteer_applications application
      where application.user_id = (select auth.uid()) and application.status = 'approved'
    )
  );
create policy "HASH admins manage announcements" on public.announcements
  for all to authenticated using (public.is_hash_admin()) with check (public.is_hash_admin());

insert into storage.buckets (id, name, public)
values ('volunteer-resources', 'volunteer-resources', false)
on conflict (id) do update set public = false;

create policy "Volunteers read permitted private volunteer resources" on storage.objects
  for select to authenticated using (
    bucket_id = 'volunteer-resources'
    and exists (
      select 1 from public.training_resources resource
      where resource.resource_path = name
        and resource.status = 'published'
        and (
          exists (
            select 1 from public.volunteer_applications application
            where application.user_id = (select auth.uid())
              and (
                application.status = 'approved'
                or (
                  application.status in ('draft', 'submitted', 'pending_review', 'additional_information_required')
                  and not resource.approval_required
                )
              )
          )
        )
    )
  );
create policy "HASH admins manage private volunteer resources" on storage.objects
  for all to authenticated using (
    bucket_id = 'volunteer-resources' and public.is_hash_admin()
  ) with check (
    bucket_id = 'volunteer-resources' and public.is_hash_admin()
  );
