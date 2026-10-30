alter table public.volunteer_interest_signups
  add column if not exists policies_acknowledged boolean not null default false;

create or replace function public.set_volunteer_interest_signup_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.privacy_acknowledged is distinct from true then
    raise exception 'Privacy acknowledgement is required';
  end if;
  if new.policies_acknowledged is distinct from true then
    raise exception 'Privacy Notice and Code of Conduct acknowledgement is required';
  end if;
  new.id = gen_random_uuid();
  new.created_at = now();
  new.expires_at = now() + interval '14 days';
  return new;
end;
$$;

drop policy if exists "Public can submit volunteer interest" on public.volunteer_interest_signups;
create policy "Public can submit volunteer interest"
  on public.volunteer_interest_signups
  for insert
  to anon, authenticated
  with check (privacy_acknowledged and policies_acknowledged);

grant insert (
  first_name,
  last_name,
  pronouns,
  contact_number,
  email,
  preferred_contact_method,
  privacy_acknowledged,
  policies_acknowledged
) on public.volunteer_interest_signups to anon, authenticated;
