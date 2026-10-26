create table if not exists public.general_preferences (
  id smallint primary key default 1 check (id = 1),
  inactivity_timeout_minutes integer not null default 60
    check (inactivity_timeout_minutes between 1 and 1440),
  updated_at timestamptz not null default now()
);

insert into public.general_preferences (id, inactivity_timeout_minutes)
values (1, 60)
on conflict (id) do nothing;

alter table public.general_preferences enable row level security;

grant select on public.general_preferences to authenticated;
grant update (inactivity_timeout_minutes) on public.general_preferences to authenticated;

drop policy if exists "Authenticated users read general preferences" on public.general_preferences;
create policy "Authenticated users read general preferences"
  on public.general_preferences
  for select
  to authenticated
  using (true);

drop policy if exists "HASH administrators update general preferences" on public.general_preferences;
create policy "HASH administrators update general preferences"
  on public.general_preferences
  for update
  to authenticated
  using (public.is_hash_admin())
  with check (public.is_hash_admin());

create or replace function public.set_general_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_general_preferences_updated_at on public.general_preferences;
create trigger set_general_preferences_updated_at
  before update on public.general_preferences
  for each row execute function public.set_general_preferences_updated_at();
