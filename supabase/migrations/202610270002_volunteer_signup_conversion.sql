alter table public.profiles
  add column if not exists pronouns text
    check (pronouns is null or length(pronouns) <= 80);

alter table public.volunteer_interest_signups
  add column if not exists policies_acknowledged_at timestamptz not null default now(),
  add column if not exists privacy_notice_url text not null default '/volunteer/privacy-notice',
  add column if not exists code_of_conduct_url text not null default '/volunteer/code-of-conduct',
  add column if not exists conversion_started_at timestamptz,
  add column if not exists conversion_started_by uuid references auth.users(id) on delete set null,
  add column if not exists converted_at timestamptz,
  add column if not exists converted_user_id uuid references auth.users(id) on delete set null,
  add column if not exists application_communications_acknowledged_at timestamptz,
  add column if not exists application_communications_acknowledged_by uuid references auth.users(id) on delete set null;

create index if not exists volunteer_interest_signups_conversion_idx
  on public.volunteer_interest_signups (created_at desc)
  where converted_at is null;

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
  new.policies_acknowledged_at = now();
  new.privacy_notice_url = '/volunteer/privacy-notice';
  new.code_of_conduct_url = '/volunteer/code-of-conduct';
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
  acknowledgements jsonb := metadata -> 'consent_acknowledgements';
begin
  if metadata ->> 'account_type' is distinct from 'volunteer' then
    return new;
  end if;

  if nullif(metadata ->> 'first_name', '') is null
    or nullif(metadata ->> 'last_name', '') is null
    or acknowledgements ->> 'code_of_conduct' is distinct from 'true'
    or acknowledgements ->> 'privacy_notice' is distinct from 'true'
    or acknowledgements ->> 'application_communications' is distinct from 'true'
    or nullif(acknowledgements ->> 'code_of_conduct_url', '') is null
    or nullif(acknowledgements ->> 'privacy_notice_url', '') is null
    or nullif(acknowledgements ->> 'application_communications_acknowledged_at', '') is null
    or nullif(acknowledgements ->> 'application_communications_acknowledged_by', '') is null then
    raise exception 'Required volunteer profile details and acknowledgements are missing';
  end if;

  insert into public.profiles (
    id, first_name, last_name, preferred_name, pronouns, phone,
    preferred_contact_method, location, preferred_language
  )
  values (
    new.id,
    metadata ->> 'first_name',
    metadata ->> 'last_name',
    nullif(metadata ->> 'preferred_name', ''),
    nullif(metadata ->> 'pronouns', ''),
    nullif(metadata ->> 'phone', ''),
    nullif(metadata ->> 'preferred_contact_method', ''),
    nullif(metadata ->> 'location', ''),
    nullif(metadata ->> 'preferred_language', '')
  );

  insert into public.volunteer_applications (
    user_id, interests, availability, skills, experience, motivation,
    additional_information, consent_acknowledgements
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
      'code_of_conduct_url', acknowledgements ->> 'code_of_conduct_url',
      'code_of_conduct_acknowledged_at', acknowledgements ->> 'code_of_conduct_acknowledged_at',
      'privacy_notice', true,
      'privacy_notice_url', acknowledgements ->> 'privacy_notice_url',
      'privacy_notice_acknowledged_at', acknowledgements ->> 'privacy_notice_acknowledged_at',
      'application_communications', true,
      'application_communications_acknowledged_at', acknowledgements ->> 'application_communications_acknowledged_at',
      'application_communications_acknowledged_by', acknowledgements ->> 'application_communications_acknowledged_by'
    )
  );
  return new;
end;
$$;
