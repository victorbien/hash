alter table public.scheduling_appointment_types
  add column display_order integer not null default 0,
  add column is_default boolean not null default false;

alter table public.scheduling_venues
  add column display_order integer not null default 0,
  add column is_default boolean not null default false;

with ordered as (
  select id, row_number() over (order by created_at, id) - 1 as position
  from public.scheduling_appointment_types
)
update public.scheduling_appointment_types option
set display_order = ordered.position
from ordered
where option.id = ordered.id;

with ordered as (
  select id, row_number() over (order by created_at, id) - 1 as position
  from public.scheduling_venues
)
update public.scheduling_venues option
set display_order = ordered.position
from ordered
where option.id = ordered.id;

update public.scheduling_appointment_types set is_default = true where name = 'PrEP';
update public.scheduling_venues set is_default = true where name = 'HASH Clinic';

create unique index scheduling_appointment_types_single_default
  on public.scheduling_appointment_types (is_default)
  where is_default;

create unique index scheduling_venues_single_default
  on public.scheduling_venues (is_default)
  where is_default;

create or replace function public.set_default_appointment_option(
  p_option_kind text,
  p_option_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_hash_scheduler() then
    raise exception 'Scheduling access is required to change appointment defaults.';
  end if;

  if p_option_kind = 'type' then
    update public.scheduling_appointment_types set is_default = false where is_default;
    update public.scheduling_appointment_types set is_default = true where id = p_option_id;
  elsif p_option_kind = 'venue' then
    update public.scheduling_venues set is_default = false where is_default;
    update public.scheduling_venues set is_default = true where id = p_option_id;
  else
    raise exception 'Choose a valid appointment option category.';
  end if;

  if not found then
    raise exception 'The selected appointment option no longer exists.';
  end if;
end;
$$;

create or replace function public.reorder_appointment_options(
  p_option_kind text,
  p_option_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_count integer;
begin
  if not public.is_hash_scheduler() then
    raise exception 'Scheduling access is required to reorder appointment options.';
  end if;
  if p_option_ids is null or exists (
    select 1
    from unnest(p_option_ids) requested(id)
    group by requested.id
    having count(*) > 1
  ) then
    raise exception 'The appointment option order is invalid.';
  end if;

  if p_option_kind = 'type' then
    select count(*) into expected_count from public.scheduling_appointment_types;
    if expected_count <> cardinality(p_option_ids)
      or exists (
        select 1
        from unnest(p_option_ids) requested(id)
        left join public.scheduling_appointment_types option on option.id = requested.id
        where option.id is null
      ) then
      raise exception 'The appointment type list changed. Reload and try again.';
    end if;
    update public.scheduling_appointment_types option
    set display_order = requested.position - 1
    from unnest(p_option_ids) with ordinality requested(id, position)
    where option.id = requested.id;
  elsif p_option_kind = 'venue' then
    select count(*) into expected_count from public.scheduling_venues;
    if expected_count <> cardinality(p_option_ids)
      or exists (
        select 1
        from unnest(p_option_ids) requested(id)
        left join public.scheduling_venues option on option.id = requested.id
        where option.id is null
      ) then
      raise exception 'The venue list changed. Reload and try again.';
    end if;
    update public.scheduling_venues option
    set display_order = requested.position - 1
    from unnest(p_option_ids) with ordinality requested(id, position)
    where option.id = requested.id;
  else
    raise exception 'Choose a valid appointment option category.';
  end if;
end;
$$;

revoke all on function public.set_default_appointment_option(text, uuid) from public;
revoke all on function public.reorder_appointment_options(text, uuid[]) from public;
grant execute on function public.set_default_appointment_option(text, uuid) to authenticated;
grant execute on function public.reorder_appointment_options(text, uuid[]) to authenticated;

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
        jsonb_build_object(
          'name', option.name,
          'online_eligible', option.online_eligible,
          'display_order', option.display_order,
          'is_default', option.is_default
        )
        order by option.display_order, option.created_at, option.id
      )
      from public.scheduling_appointment_types option
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'name', option.name,
          'is_online', option.is_online,
          'display_order', option.display_order,
          'is_default', option.is_default
        )
        order by option.display_order, option.created_at, option.id
      )
      from public.scheduling_venues option
    ), '[]'::jsonb);
$$;
