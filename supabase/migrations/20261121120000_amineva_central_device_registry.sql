create table if not exists public.amineva_devices (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 device_key text not null,
 name text not null,
 transport text not null check (transport in ('web-bluetooth','web-hid','web-serial','network-gateway','native-bridge')),
 capabilities text[] not null default '{}',
 status text not null default 'available' check (status in ('available','connecting','connected','disconnected','error','revoked')),
 last_seen_at timestamptz,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_id,device_key)
);
create index if not exists amineva_devices_owner_updated_idx on public.amineva_devices(owner_id,updated_at desc);
alter table public.amineva_devices enable row level security;
drop policy if exists "Users can view their own devices" on public.amineva_devices;
create policy "Users can view their own devices" on public.amineva_devices for select to authenticated using (auth.uid()=owner_id);
drop policy if exists "Users can register their own devices" on public.amineva_devices;
create policy "Users can register their own devices" on public.amineva_devices for insert to authenticated with check (auth.uid()=owner_id);
drop policy if exists "Users can update their own devices" on public.amineva_devices;
create policy "Users can update their own devices" on public.amineva_devices for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
drop policy if exists "Users can delete their own devices" on public.amineva_devices;
create policy "Users can delete their own devices" on public.amineva_devices for delete to authenticated using (auth.uid()=owner_id);
create or replace function public.set_amineva_devices_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists set_amineva_devices_updated_at on public.amineva_devices;
create trigger set_amineva_devices_updated_at before update on public.amineva_devices for each row execute function public.set_amineva_devices_updated_at();
