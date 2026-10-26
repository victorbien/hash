-- The project owner confirmed that all current appointment rows are test data.
-- Clear those rows and their appointment audit records once before enabling configurable labels.
delete from public.appointments;
delete from public.scheduling_audit_log where entity_type = 'appointment';

alter table public.appointments
  drop constraint appointments_appointment_type_check,
  drop constraint appointments_venue_check,
  drop constraint appointments_check;

alter table public.appointments
  add constraint appointments_type_nonempty check (length(trim(appointment_type)) between 1 and 120),
  add constraint appointments_venue_nonempty check (length(trim(venue)) between 1 and 120);

alter table public.appointment_blocks
  drop constraint appointment_blocks_venue_check;

alter table public.appointment_blocks
  add constraint appointment_blocks_venue_nonempty
    check (venue is null or length(trim(venue)) between 1 and 120);

alter table public.scheduling_audit_log
  drop constraint scheduling_audit_log_entity_type_check;

alter table public.scheduling_audit_log
  add constraint scheduling_audit_log_entity_type_check
    check (entity_type in ('appointment', 'block', 'settings', 'recipient', 'appointment_type', 'venue'));

create table public.scheduling_appointment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  online_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index scheduling_appointment_types_name_unique
  on public.scheduling_appointment_types (lower(trim(name)));

create table public.scheduling_venues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index scheduling_venues_name_unique
  on public.scheduling_venues (lower(trim(name)));

create unique index scheduling_venues_single_online
  on public.scheduling_venues (is_online)
  where is_online;

insert into public.scheduling_appointment_types (name, online_eligible) values
  ('PrEP', false),
  ('ePrEP', true),
  ('HIV Testing', false),
  ('Laboratory Tests', false),
  ('Self-Test Kit (STK)', true);

insert into public.scheduling_venues (name, is_online) values
  ('HASH Clinic', false),
  ('ACHIEVE', false),
  ('Online', true);

alter table public.scheduling_appointment_types enable row level security;
alter table public.scheduling_venues enable row level security;

grant select, insert, update, delete on public.scheduling_appointment_types to authenticated;
grant select, insert, update, delete on public.scheduling_venues to authenticated;

create policy "Scheduling staff manage appointment types" on public.scheduling_appointment_types
  for all to authenticated
  using (public.is_hash_scheduler())
  with check (public.is_hash_scheduler());

create policy "Scheduling staff manage venues" on public.scheduling_venues
  for all to authenticated
  using (public.is_hash_scheduler())
  with check (public.is_hash_scheduler());

create trigger scheduling_appointment_types_audit_change
  after insert or update or delete on public.scheduling_appointment_types
  for each row execute function public.audit_scheduling_change('appointment_type');

create trigger scheduling_venues_audit_change
  after insert or update or delete on public.scheduling_venues
  for each row execute function public.audit_scheduling_change('venue');

create or replace function public.prepare_scheduling_option()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := trim(new.name);
  new.updated_at := now();
  return new;
end;
$$;

create trigger scheduling_appointment_types_prepare
  before insert or update on public.scheduling_appointment_types
  for each row execute function public.prepare_scheduling_option();

create trigger scheduling_venues_prepare
  before insert or update on public.scheduling_venues
  for each row execute function public.prepare_scheduling_option();

create or replace function public.validate_appointment_options()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  type_allows_online boolean;
  venue_is_online boolean;
begin
  if tg_op = 'UPDATE'
    and new.appointment_type is not distinct from old.appointment_type
    and new.venue is not distinct from old.venue then
    return new;
  end if;

  select option.online_eligible into type_allows_online
  from public.scheduling_appointment_types option
  where option.name = new.appointment_type;
  if not found then
    raise exception 'Choose an active appointment type.';
  end if;

  select option.is_online into venue_is_online
  from public.scheduling_venues option
  where option.name = new.venue;
  if not found then
    raise exception 'Choose an active venue.';
  end if;

  if venue_is_online and not type_allows_online then
    raise exception 'This appointment type is not enabled for the online venue.';
  end if;
  return new;
end;
$$;

create trigger appointments_validate_options
  before insert or update of appointment_type, venue on public.appointments
  for each row execute function public.validate_appointment_options();

create or replace function public.validate_appointment_block_venue()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.venue is not distinct from old.venue then
    return new;
  end if;
  if new.scope = 'venue' and not exists (
    select 1 from public.scheduling_venues option where option.name = new.venue
  ) then
    raise exception 'Choose an active venue for this blocked period.';
  end if;
  return new;
end;
$$;

create trigger appointment_blocks_validate_venue
  before insert or update of venue, scope on public.appointment_blocks
  for each row execute function public.validate_appointment_block_venue();

create or replace function public.get_public_appointment_options()
returns table (types jsonb, venues jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((
      select jsonb_agg(
        jsonb_build_object('name', option.name, 'online_eligible', option.online_eligible)
        order by option.created_at, option.id
      )
      from public.scheduling_appointment_types option
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object('name', option.name, 'is_online', option.is_online)
        order by option.created_at, option.id
      )
      from public.scheduling_venues option
    ), '[]'::jsonb);
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
  type_allows_online boolean;
  venue_is_online boolean;
begin
  if p_date is null or p_appointment_type is null or p_venue is null then
    raise exception 'Choose a supported service and venue.';
  end if;

  select option.online_eligible into type_allows_online
  from public.scheduling_appointment_types option
  where option.name = p_appointment_type;
  if not found then
    raise exception 'Choose an active appointment type.';
  end if;

  select option.is_online into venue_is_online
  from public.scheduling_venues option
  where option.name = p_venue;
  if not found then
    raise exception 'Choose an active venue.';
  end if;
  if venue_is_online and not type_allows_online then
    raise exception 'This appointment type is not enabled for the online venue.';
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
  type_allows_online boolean;
  venue_is_online boolean;
begin
  if coalesce(p_honeypot, '') <> '' then
    raise exception 'Unable to submit the appointment request.';
  end if;

  if p_client_first_name is null or length(trim(p_client_first_name)) not between 1 and 120
    or p_client_last_name is null or length(trim(p_client_last_name)) not between 1 and 120 then
    raise exception 'Enter a first and last name.';
  end if;

  if p_start_at is null or p_appointment_type is null or p_venue is null then
    raise exception 'Choose a supported service and venue.';
  end if;

  select option.online_eligible into type_allows_online
  from public.scheduling_appointment_types option
  where option.name = p_appointment_type;
  if not found then
    raise exception 'Choose an active appointment type.';
  end if;

  select option.is_online into venue_is_online
  from public.scheduling_venues option
  where option.name = p_venue;
  if not found then
    raise exception 'Choose an active venue.';
  end if;
  if venue_is_online and not type_allows_online then
    raise exception 'This appointment type is not enabled for the online venue.';
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

revoke all on function public.get_public_appointment_options() from public;
revoke all on function public.get_public_appointment_slots(date, text, text) from public;
revoke all on function public.create_public_appointment(text, text, text, text, text, text, timestamptz, text) from public;
grant execute on function public.get_public_appointment_options() to anon, authenticated;
grant execute on function public.get_public_appointment_slots(date, text, text) to anon, authenticated;
grant execute on function public.create_public_appointment(text, text, text, text, text, text, timestamptz, text) to anon, authenticated;
