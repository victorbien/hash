create or replace function public.get_public_scheduling_info()
returns table (
  timezone text,
  advance_booking_days integer,
  default_duration_minutes integer,
  booking_enabled boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select settings.timezone, settings.advance_booking_days, settings.default_duration_minutes,
    settings.public_booking_enabled
  from public.scheduling_settings settings
  where settings.id = true;
$$;

create or replace function public.get_public_appointment_slots(
  p_date date,
  p_appointment_type text,
  p_venue text
)
returns table (
  slot_start timestamptz,
  duration_minutes integer,
  timezone text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  settings record;
  day_key text;
  day_hours jsonb;
  local_open timestamp;
  local_close timestamp;
begin
  if p_date is null or p_appointment_type is null or p_venue is null
    or p_appointment_type not in ('PrEP', 'ePrEP', 'HIV Testing', 'Laboratory Tests', 'Self-Test Kit (STK)')
    or p_venue not in ('HASH Clinic', 'ACHIEVE', 'Online')
    or (p_venue = 'Online' and p_appointment_type not in ('ePrEP', 'Self-Test Kit (STK)')) then
    raise exception 'Choose a supported service and venue.';
  end if;

  select configured.timezone, configured.default_duration_minutes,
    configured.advance_booking_days, configured.working_hours,
    configured.public_booking_enabled
    into settings
    from public.scheduling_settings configured
    where configured.id = true;
  if not found then
    raise exception 'Scheduling availability is not configured.';
  end if;
  if not settings.public_booking_enabled then return; end if;

  if p_date < (now() at time zone settings.timezone)::date
    or p_date > (now() at time zone settings.timezone)::date + settings.advance_booking_days then
    return;
  end if;

  day_key := case extract(isodow from p_date)
    when 1 then 'monday'
    when 2 then 'tuesday'
    when 3 then 'wednesday'
    when 4 then 'thursday'
    when 5 then 'friday'
    when 6 then 'saturday'
    else 'sunday'
  end;
  day_hours := settings.working_hours -> day_key;
  if day_hours is null then return; end if;

  local_open := p_date + (day_hours ->> 'start')::time;
  local_close := p_date + (day_hours ->> 'end')::time;

  return query
  select (candidate.local_time at time zone settings.timezone),
    settings.default_duration_minutes,
    settings.timezone
  from pg_catalog.generate_series(
    local_open,
    local_close - make_interval(mins => settings.default_duration_minutes),
    interval '15 minutes'
  ) as candidate(local_time)
  where (candidate.local_time at time zone settings.timezone) > now()
    and ((candidate.local_time at time zone settings.timezone) at time zone settings.timezone) = candidate.local_time
    and not exists (
      select 1 from public.appointment_blocks block
      where block.start_at < (candidate.local_time at time zone settings.timezone)
          + make_interval(mins => settings.default_duration_minutes)
        and block.end_at > (candidate.local_time at time zone settings.timezone)
        and (block.scope = 'all_venues' or block.venue = p_venue)
    )
    and not exists (
      select 1 from public.appointments appointment
      where appointment.status <> 'cancelled'
        and appointment.venue = p_venue
        and appointment.start_at < (candidate.local_time at time zone settings.timezone)
          + make_interval(mins => settings.default_duration_minutes)
        and appointment.start_at + make_interval(mins => appointment.duration_minutes)
          > (candidate.local_time at time zone settings.timezone)
    )
  order by candidate.local_time;
end;
$$;

create or replace function public.create_public_appointment(
  p_client_first_name text,
  p_client_last_name text,
  p_client_email text,
  p_client_phone text,
  p_appointment_type text,
  p_venue text,
  p_start_at timestamptz,
  p_honeypot text default ''
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured record;
  new_reference text;
  appointment_duration integer;
begin
  if coalesce(p_honeypot, '') <> '' then
    raise exception 'Unable to submit the appointment request.';
  end if;

  if p_client_first_name is null or length(trim(p_client_first_name)) not between 1 and 120
    or p_client_last_name is null or length(trim(p_client_last_name)) not between 1 and 120 then
    raise exception 'Enter a first and last name.';
  end if;

  if p_start_at is null
    or p_appointment_type is null
    or p_venue is null
    or p_appointment_type not in ('PrEP', 'ePrEP', 'HIV Testing', 'Laboratory Tests', 'Self-Test Kit (STK)')
    or p_venue not in ('HASH Clinic', 'ACHIEVE', 'Online')
    or (p_venue = 'Online' and p_appointment_type not in ('ePrEP', 'Self-Test Kit (STK)')) then
    raise exception 'Choose a supported service and venue.';
  end if;

  select settings.timezone, settings.default_duration_minutes, settings.advance_booking_days,
    settings.working_hours, settings.public_booking_enabled
    into configured
    from public.scheduling_settings settings
    where settings.id = true;
  if not found then
    raise exception 'Scheduling availability is not configured.';
  end if;
  if not configured.public_booking_enabled then
    raise exception 'Online booking is temporarily unavailable. Please contact HASH.';
  end if;
  appointment_duration := configured.default_duration_minutes;

  perform pg_advisory_xact_lock(hashtextextended('hash-scheduling-blocks', 0));

  if not exists (
    select 1
    from public.get_public_appointment_slots(
      (p_start_at at time zone configured.timezone)::date,
      p_appointment_type,
      p_venue
    ) available
    where available.slot_start = p_start_at
  ) then
    raise exception 'That time is no longer available. Choose another available time.';
  end if;

  insert into public.appointments (
    client_first_name,
    client_last_name,
    client_email,
    client_phone,
    appointment_type,
    venue,
    start_at,
    duration_minutes,
    timezone,
    status
  )
  values (
    trim(p_client_first_name),
    trim(p_client_last_name),
    nullif(trim(coalesce(p_client_email, '')), ''),
    nullif(trim(coalesce(p_client_phone, '')), ''),
    p_appointment_type,
    p_venue,
    p_start_at,
    appointment_duration,
    configured.timezone,
    'confirmed'
  )
  returning appointment_reference into new_reference;

  return new_reference;
end;
$$;

revoke all on function public.get_public_appointment_slots(date, text, text) from public;
revoke all on function public.create_public_appointment(text, text, text, text, text, text, timestamptz, text) from public;
revoke all on function public.get_public_scheduling_info() from public;
grant execute on function public.get_public_appointment_slots(date, text, text) to anon, authenticated;
grant execute on function public.create_public_appointment(text, text, text, text, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.get_public_scheduling_info() to anon, authenticated;
