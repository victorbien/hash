create or replace function public.create_volunteer_account_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
begin
  if metadata ->> 'account_type' is distinct from 'volunteer' then
    return new;
  end if;

  if nullif(metadata ->> 'first_name', '') is null
    or nullif(metadata ->> 'last_name', '') is null
    or metadata -> 'consent_acknowledgements' ->> 'code_of_conduct' is distinct from 'true'
    or metadata -> 'consent_acknowledgements' ->> 'privacy_notice' is distinct from 'true'
    or metadata -> 'consent_acknowledgements' ->> 'application_communications' is distinct from 'true'
    or nullif(metadata -> 'consent_acknowledgements' ->> 'code_of_conduct_url', '') is null
    or nullif(metadata -> 'consent_acknowledgements' ->> 'privacy_notice_url', '') is null then
    raise exception 'Required volunteer profile details and acknowledgements are missing';
  end if;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    preferred_name,
    phone,
    preferred_contact_method,
    location,
    preferred_language
  )
  values (
    new.id,
    metadata ->> 'first_name',
    metadata ->> 'last_name',
    nullif(metadata ->> 'preferred_name', ''),
    nullif(metadata ->> 'phone', ''),
    nullif(metadata ->> 'preferred_contact_method', ''),
    nullif(metadata ->> 'location', ''),
    nullif(metadata ->> 'preferred_language', '')
  );

  insert into public.volunteer_applications (
    user_id,
    interests,
    availability,
    skills,
    experience,
    motivation,
    additional_information,
    consent_acknowledgements
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
