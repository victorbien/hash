create or replace function public.is_hash_scheduler()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false)
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'scheduling_access' = 'true', false);
$$;

create table public.scheduling_settings (
  id boolean primary key default true check (id),
  timezone text not null default 'Asia/Manila',
  default_duration_minutes integer not null default 30
    check (default_duration_minutes between 15 and 240),
  advance_booking_days integer not null default 90
    check (advance_booking_days between 1 and 365),
  working_hours jsonb not null default '{
    "monday": {"start": "09:00", "end": "17:00"},
    "tuesday": {"start": "09:00", "end": "17:00"},
    "wednesday": {"start": "09:00", "end": "17:00"},
    "thursday": {"start": "09:00", "end": "17:00"},
    "friday": {"start": "09:00", "end": "17:00"}
  }'::jsonb check (jsonb_typeof(working_hours) = 'object'),
  public_booking_enabled boolean not null default false,
  google_calendar_enabled boolean not null default false,
  email_notifications_enabled boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.scheduling_settings (id) values (true)
on conflict (id) do nothing;

create table public.scheduling_notification_recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(email) <= 320 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  enabled boolean not null default true,
  is_primary boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (email)
);

create unique index scheduling_notification_single_primary
  on public.scheduling_notification_recipients (is_primary)
  where (is_primary);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_reference text not null unique default (
    'HASH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  client_first_name text not null check (length(trim(client_first_name)) between 1 and 120),
  client_last_name text not null check (length(trim(client_last_name)) between 1 and 120),
  client_email text check (client_email is null or (length(client_email) <= 320 and client_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  client_phone text check (client_phone is null or length(client_phone) <= 80),
  appointment_type text not null check (
    appointment_type in ('PrEP', 'ePrEP', 'HIV Testing', 'Laboratory Tests', 'Self-Test Kit (STK)')
  ),
  venue text not null check (venue in ('HASH Clinic', 'ACHIEVE', 'Online')),
  start_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 15 and 240),
  timezone text not null default 'Asia/Manila',
  status text not null default 'scheduled' check (
    status in ('scheduled', 'confirmed', 'rescheduling_required', 'cancelled', 'completed', 'no_show')
  ),
  internal_notes text check (internal_notes is null or length(internal_notes) <= 4000),
  client_instructions text check (client_instructions is null or length(client_instructions) <= 2000),
  cancellation_reason text check (cancellation_reason is null or length(cancellation_reason) <= 1000),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  cancelled_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (venue <> 'Online' or appointment_type in ('ePrEP', 'Self-Test Kit (STK)')),
  check (status <> 'cancelled' or cancellation_reason is not null)
);

create index appointments_start_at_idx on public.appointments (start_at);
create index appointments_status_start_idx on public.appointments (status, start_at);
create index appointments_type_venue_idx on public.appointments (appointment_type, venue);

create table public.appointment_blocks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 180),
  scope text not null check (scope in ('all_venues', 'venue')),
  venue text check (venue is null or venue in ('HASH Clinic', 'ACHIEVE', 'Online')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_all_day boolean not null default false,
  reason text check (reason is null or length(reason) <= 1000),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check ((scope = 'all_venues' and venue is null) or (scope = 'venue' and venue is not null))
);

create index appointment_blocks_range_idx on public.appointment_blocks using gist (tstzrange(start_at, end_at, '[)'));
create index appointment_blocks_venue_idx on public.appointment_blocks (venue, start_at);

create table public.scheduling_audit_log (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('appointment', 'block', 'settings', 'recipient')),
  entity_id text not null,
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

alter table public.scheduling_settings enable row level security;
alter table public.scheduling_notification_recipients enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_blocks enable row level security;
alter table public.scheduling_audit_log enable row level security;

grant select, insert, update on public.scheduling_settings to authenticated;
revoke delete on public.scheduling_settings from authenticated;
grant select, insert, update, delete on public.scheduling_notification_recipients to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select, insert, update, delete on public.appointment_blocks to authenticated;
grant select on public.scheduling_audit_log to authenticated;
grant usage, select on sequence public.scheduling_audit_log_id_seq to authenticated;

create policy "Scheduling staff manage settings" on public.scheduling_settings
  for all to authenticated
  using (public.is_hash_scheduler())
  with check (public.is_hash_scheduler());

create policy "Scheduling staff manage notification recipients" on public.scheduling_notification_recipients
  for all to authenticated
  using (public.is_hash_scheduler())
  with check (public.is_hash_scheduler());

create policy "Scheduling staff manage appointments" on public.appointments
  for all to authenticated
  using (public.is_hash_scheduler())
  with check (public.is_hash_scheduler());

create policy "Scheduling staff manage blocked periods" on public.appointment_blocks
  for all to authenticated
  using (public.is_hash_scheduler())
  with check (public.is_hash_scheduler());

create policy "Scheduling staff read audit history" on public.scheduling_audit_log
  for select to authenticated
  using (public.is_hash_scheduler());

create or replace function public.prepare_scheduling_record()
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
  return new;
end;
$$;

create trigger appointments_prepare_record
  before insert or update on public.appointments
  for each row execute function public.prepare_scheduling_record();

create trigger appointment_blocks_prepare_record
  before insert or update on public.appointment_blocks
  for each row execute function public.prepare_scheduling_record();

create or replace function public.prevent_blocked_appointment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  appointment_end timestamptz;
  schedule_timezone text;
  booking_window integer;
  business_hours jsonb;
  local_start timestamp;
  local_end timestamp;
  weekday_name text;
  day_hours jsonb;
begin
  select settings.timezone, settings.advance_booking_days, settings.working_hours
    into schedule_timezone, booking_window, business_hours
    from public.scheduling_settings settings
    where settings.id = true;
  if schedule_timezone is null then
    raise exception 'Scheduling settings are not configured.';
  end if;
  new.timezone := schedule_timezone;

  if new.status = 'cancelled' then
    if tg_op = 'UPDATE' and old.status = 'cancelled' then
      new.cancelled_at := old.cancelled_at;
      new.cancelled_by := old.cancelled_by;
    else
      new.cancelled_at := now();
      new.cancelled_by := auth.uid();
    end if;
    return new;
  elsif new.status <> 'cancelled' then
    new.cancelled_at := null;
    new.cancelled_by := null;
  end if;

  if tg_op = 'UPDATE'
    and new.start_at = old.start_at
    and new.duration_minutes = old.duration_minutes
    and new.venue = old.venue
    and old.status <> 'cancelled' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('hash-scheduling-blocks', 0));
  appointment_end := new.start_at + make_interval(mins => new.duration_minutes);
  local_start := new.start_at at time zone schedule_timezone;
  local_end := appointment_end at time zone schedule_timezone;
  weekday_name := lower(trim(to_char(local_start::date, 'Day')));
  day_hours := business_hours -> weekday_name;

  if new.start_at <= now()
    or local_start::date > (now() at time zone schedule_timezone)::date + booking_window then
    raise exception 'Choose a time inside the configured advance-booking window.';
  end if;

  if day_hours is null
    or local_end::date <> local_start::date
    or local_start::time < (day_hours ->> 'start')::time
    or local_end::time > (day_hours ->> 'end')::time then
    raise exception 'The requested time is outside configured working hours.';
  end if;

  if exists (
    select 1
    from public.appointment_blocks block
    where block.start_at < appointment_end
      and block.end_at > new.start_at
      and (block.scope = 'all_venues' or block.venue = new.venue)
  ) then
    raise exception using
      errcode = '23P01',
      message = 'The requested time overlaps a blocked period.';
  end if;
  if exists (
    select 1
    from public.appointments appointment
    where appointment.id <> new.id
      and appointment.status <> 'cancelled'
      and appointment.venue = new.venue
      and appointment.start_at < appointment_end
      and appointment.start_at + make_interval(mins => appointment.duration_minutes) > new.start_at
  ) then
    raise exception using
      errcode = '23P01',
      message = 'The venue already has an appointment during this time.';
  end if;
  return new;
end;
$$;

create or replace function public.prepare_scheduling_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Choose a valid IANA scheduling timezone.';
  end if;
  if jsonb_typeof(new.working_hours) <> 'object' then
    raise exception 'Working hours must be a weekday object.';
  end if;
  if exists (
    select 1
    from jsonb_each(new.working_hours) hours
    where hours.key not in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
      or jsonb_typeof(hours.value) <> 'object'
      or coalesce(hours.value ->> 'start', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or coalesce(hours.value ->> 'end', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or (hours.value ->> 'start') >= (hours.value ->> 'end')
  ) then
    raise exception 'Set valid 24-hour start and end times for each configured weekday.';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger scheduling_settings_prepare_record
  before update on public.scheduling_settings
  for each row execute function public.prepare_scheduling_settings();

create trigger appointments_check_blocked_periods
  before insert or update on public.appointments
  for each row execute function public.prevent_blocked_appointment();

create or replace function public.flag_appointments_for_block()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('hash-scheduling-blocks', 0));
  update public.appointments appointment
  set status = 'rescheduling_required',
      updated_by = auth.uid(),
      updated_at = now()
  where appointment.status in ('scheduled', 'confirmed')
    and appointment.start_at < new.end_at
    and appointment.start_at + make_interval(mins => appointment.duration_minutes) > new.start_at
    and (new.scope = 'all_venues' or appointment.venue = new.venue);
  return new;
end;
$$;

create trigger appointment_blocks_flag_overlaps
  after insert or update on public.appointment_blocks
  for each row execute function public.flag_appointments_for_block();

create or replace function public.audit_scheduling_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_value jsonb;
  old_value jsonb;
  record_id text;
  action_name text;
begin
  if tg_op = 'DELETE' then
    record_value := to_jsonb(old);
    old_value := record_value;
    record_id := record_value ->> 'id';
    action_name := 'deleted';
  elsif tg_op = 'INSERT' then
    record_value := to_jsonb(new);
    record_id := coalesce(record_value ->> 'id', record_value ->> 'email', 'settings');
    action_name := 'created';
  else
    record_value := to_jsonb(new);
    old_value := to_jsonb(old);
    record_id := coalesce(record_value ->> 'id', record_value ->> 'email', 'settings');
    action_name := 'updated';
  end if;

  insert into public.scheduling_audit_log (
    entity_type, entity_id, action, actor_id, previous_values, new_values
  )
  values (
    tg_argv[0],
    record_id,
    action_name,
    auth.uid(),
    old_value,
    case when tg_op = 'DELETE' then null else record_value end
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger appointments_audit_change
  after insert or update or delete on public.appointments
  for each row execute function public.audit_scheduling_change('appointment');

create trigger appointment_blocks_audit_change
  after insert or update or delete on public.appointment_blocks
  for each row execute function public.audit_scheduling_change('block');

create trigger scheduling_settings_audit_change
  after insert or update or delete on public.scheduling_settings
  for each row execute function public.audit_scheduling_change('settings');

create trigger scheduling_recipients_audit_change
  after insert or update or delete on public.scheduling_notification_recipients
  for each row execute function public.audit_scheduling_change('recipient');
