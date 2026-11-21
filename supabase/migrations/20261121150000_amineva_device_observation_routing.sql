alter table public.amineva_devices add column if not exists app_id text;
alter table public.amineva_devices add column if not exists component_id text;
alter table public.amineva_devices add column if not exists driver_profile_id text;
alter table public.amineva_devices add column if not exists driver_config jsonb not null default '{}'::jsonb;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='amineva_devices_app_id_check') then
  alter table public.amineva_devices add constraint amineva_devices_app_id_check check(app_id is null or app_id in ('agroclimate','inventra','info-solutions'));
 end if;
 if not exists(select 1 from pg_constraint where conname='amineva_devices_component_id_check') then
  alter table public.amineva_devices add constraint amineva_devices_component_id_check check(component_id is null or char_length(trim(component_id)) between 1 and 100);
 end if;
end $$;
create table if not exists public.amineva_device_observations (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null,
 device_id uuid not null references public.amineva_devices(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 app_id text not null check(app_id in ('agroclimate','inventra','info-solutions')),
 component_id text not null check(char_length(trim(component_id)) between 1 and 100),
 metric text not null check(char_length(trim(metric)) between 1 and 64),
 value double precision not null check(value > '-Infinity'::double precision and value < 'Infinity'::double precision),
 unit text not null check(char_length(trim(unit)) between 1 and 24),
 measured_at timestamptz not null,
 received_at timestamptz not null default now(),
 transport text not null check(transport in ('web-bluetooth','web-hid','web-serial','network-gateway','native-bridge')),
 manufacturer text,
 model text,
 quality text not null default 'valid' check(quality in ('valid','suspect')),
 metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'),
 unique(device_id,event_id)
);
create index if not exists amineva_device_observations_owner_component_time_idx on public.amineva_device_observations(owner_id,app_id,component_id,measured_at desc);
create index if not exists amineva_device_observations_device_time_idx on public.amineva_device_observations(device_id,measured_at desc);
alter table public.amineva_device_observations enable row level security;
drop policy if exists "Users can read their own routed device observations" on public.amineva_device_observations;
create policy "Users can read their own routed device observations" on public.amineva_device_observations for select to authenticated using(auth.uid()=owner_id);
revoke insert,update,delete on public.amineva_device_observations from anon,authenticated;
grant select on public.amineva_device_observations to authenticated;
grant all on public.amineva_device_observations to service_role;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='amineva_device_observations') then
  alter publication supabase_realtime add table public.amineva_device_observations;
 end if;
end $$;
