create table if not exists public.volunteer_interest_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(btrim(first_name)) between 1 and 120),
  last_name text not null check (length(btrim(last_name)) between 1 and 120),
  pronouns text check (pronouns is null or length(pronouns) <= 80),
  contact_number text check (contact_number is null or length(contact_number) <= 80),
  email text not null check (
    length(email) <= 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  preferred_contact_method text not null
    check (preferred_contact_method in ('email', 'phone', 'text')),
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index if not exists volunteer_interest_signups_expires_at_idx
  on public.volunteer_interest_signups (expires_at);

create or replace function public.set_volunteer_interest_signup_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.privacy_acknowledged is distinct from true then
    raise exception 'Privacy acknowledgement is required';
  end if;
  new.id = gen_random_uuid();
  new.created_at = now();
  new.expires_at = now() + interval '14 days';
  return new;
end;
$$;

drop trigger if exists set_volunteer_interest_signup_metadata
  on public.volunteer_interest_signups;
create trigger set_volunteer_interest_signup_metadata
  before insert on public.volunteer_interest_signups
  for each row execute function public.set_volunteer_interest_signup_metadata();

alter table public.volunteer_interest_signups enable row level security;

drop policy if exists "Public can submit volunteer interest" on public.volunteer_interest_signups;
create policy "Public can submit volunteer interest"
  on public.volunteer_interest_signups
  for insert
  to anon, authenticated
  with check (privacy_acknowledged);

drop policy if exists "HASH admins read volunteer interest signups" on public.volunteer_interest_signups;
create policy "HASH admins read volunteer interest signups"
  on public.volunteer_interest_signups
  for select
  to authenticated
  using (public.is_hash_admin() and expires_at > now());

drop policy if exists "HASH admins delete volunteer interest signups" on public.volunteer_interest_signups;
create policy "HASH admins delete volunteer interest signups"
  on public.volunteer_interest_signups
  for delete
  to authenticated
  using (public.is_hash_admin());

revoke all on public.volunteer_interest_signups from anon, authenticated;
grant insert (
  first_name,
  last_name,
  pronouns,
  contact_number,
  email,
  preferred_contact_method,
  privacy_acknowledged
) on public.volunteer_interest_signups to anon, authenticated;
grant select, delete on public.volunteer_interest_signups to authenticated;

create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-expired-volunteer-interest-signups';

select cron.schedule(
  'purge-expired-volunteer-interest-signups',
  '0 * * * *',
  $cron$delete from public.volunteer_interest_signups where expires_at <= now()$cron$
);
