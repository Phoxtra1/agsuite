-- Controlled publication and document library for Info Discovery.
-- External indexes remain discovery-only. A record becomes public only after
-- an authorised Suite reviewer has checked metadata, source provenance,
-- version/corrections and the applicable access and reuse rights.

create table if not exists public.discovery_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text[] not null default '{}'::text[],
  publication_year integer,
  publisher text not null,
  container_title text,
  doi text,
  canonical_url text not null,
  source_id text not null,
  source_name text not null,
  abstract text not null default '',
  material_type text not null default 'publication',
  subjects text[] not null default '{}'::text[],
  jurisdiction text,
  access_status text not null default 'unknown'
    check (access_status in ('metadata_only','open_access','restricted','unknown')),
  license text,
  rights_basis text,
  full_text_url text,
  storage_path text,
  storage_mime_type text,
  storage_size bigint,
  review_status text not null default 'pending_review'
    check (review_status in ('pending_review','verified','rejected','withdrawn')),
  review_note text,
  bibliographic_details_checked boolean not null default false,
  original_source_checked boolean not null default false,
  version_and_corrections_checked boolean not null default false,
  rights_and_access_checked boolean not null default false,
  submitted_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(authors,' '),'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(publisher,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(container_title,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(abstract,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(subjects,' '),'')), 'B')
  ) stored,
  constraint discovery_records_year_range check (publication_year is null or publication_year between 1000 and 2200),
  constraint discovery_records_canonical_http check (canonical_url ~* '^https?://'),
  constraint discovery_records_fulltext_http check (full_text_url is null or full_text_url ~* '^https?://'),
  constraint discovery_records_verified_review_complete check (
    review_status <> 'verified' or (
      bibliographic_details_checked and original_source_checked and
      version_and_corrections_checked and rights_and_access_checked and
      nullif(trim(rights_basis),'') is not null and
      nullif(trim(review_note),'') is not null and
      reviewed_by is not null and reviewed_at is not null
    )
  )
);

create unique index if not exists discovery_records_doi_unique
  on public.discovery_records (lower(doi))
  where doi is not null and trim(doi) <> '';

create index if not exists discovery_records_search_vector_idx
  on public.discovery_records using gin (search_vector);
create index if not exists discovery_records_status_created_idx
  on public.discovery_records (review_status, created_at desc);
create index if not exists discovery_records_source_idx
  on public.discovery_records (source_id);

create or replace function public.can_manage_discovery_library()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.applications a on a.id = p.app_id
    where p.user_id = auth.uid()
      and p.status = 'active'
      and p.role in ('manager','super_admin')
      and a.app_slug = 'suite'
      and a.status = 'active'
  );
$$;

revoke all on function public.can_manage_discovery_library() from public;
grant execute on function public.can_manage_discovery_library() to anon, authenticated;

alter table public.discovery_records enable row level security;

drop policy if exists "Public can read verified discovery records" on public.discovery_records;
create policy "Public can read verified discovery records"
  on public.discovery_records for select
  to anon, authenticated
  using (review_status = 'verified');

drop policy if exists "Suite reviewers can read all discovery records" on public.discovery_records;
create policy "Suite reviewers can read all discovery records"
  on public.discovery_records for select
  to authenticated
  using (public.can_manage_discovery_library());

drop policy if exists "Suite reviewers can submit discovery records" on public.discovery_records;
create policy "Suite reviewers can submit discovery records"
  on public.discovery_records for insert
  to authenticated
  with check (
    public.can_manage_discovery_library()
    and submitted_by = auth.uid()
    and review_status = 'pending_review'
  );

drop policy if exists "Suite reviewers can update discovery records" on public.discovery_records;
create policy "Suite reviewers can update discovery records"
  on public.discovery_records for update
  to authenticated
  using (public.can_manage_discovery_library())
  with check (public.can_manage_discovery_library());

create or replace function public.set_discovery_record_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_discovery_record_updated_at on public.discovery_records;
create trigger set_discovery_record_updated_at
  before update on public.discovery_records
  for each row execute function public.set_discovery_record_updated_at();

create table if not exists public.discovery_record_review_events (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.discovery_records(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('submitted','verified','rejected','withdrawn','reopened')),
  previous_status text,
  next_status text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.discovery_record_review_events enable row level security;

drop policy if exists "Suite reviewers can read discovery review history" on public.discovery_record_review_events;
create policy "Suite reviewers can read discovery review history"
  on public.discovery_record_review_events for select
  to authenticated
  using (public.can_manage_discovery_library());

create or replace function public.audit_discovery_record_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  action_name text;
begin
  if tg_op = 'INSERT' then
    action_name := 'submitted';
    insert into public.discovery_record_review_events
      (record_id, actor_id, action, previous_status, next_status, note)
    values
      (new.id, auth.uid(), action_name, null, new.review_status, new.review_note);
    return new;
  end if;

  if new.review_status is distinct from old.review_status then
    action_name := case new.review_status
      when 'verified' then 'verified'
      when 'rejected' then 'rejected'
      when 'withdrawn' then 'withdrawn'
      else 'reopened'
    end;
    insert into public.discovery_record_review_events
      (record_id, actor_id, action, previous_status, next_status, note)
    values
      (new.id, auth.uid(), action_name, old.review_status, new.review_status, new.review_note);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_discovery_record_review on public.discovery_records;
create trigger audit_discovery_record_review
  after insert or update on public.discovery_records
  for each row execute function public.audit_discovery_record_review();

grant select, insert, update on public.discovery_records to authenticated;
grant select on public.discovery_records to anon;
grant select on public.discovery_record_review_events to authenticated;


-- Uploaded documents remain in a private bucket. Public read is granted only
-- when a matching catalogue record is editorially verified and explicitly
-- marked open access. Public users receive short-lived signed URLs, not bucket
-- listing access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'discovery-library',
  'discovery-library',
  false,
  52428800,
  array['application/pdf','application/epub+zip','text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Managers upload discovery documents" on storage.objects;
create policy "Managers upload discovery documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'discovery-library'
    and public.can_manage_discovery_library()
    and exists (
      select 1 from public.discovery_records r
      where r.id::text = (storage.foldername(name))[1]
        and r.review_status = 'pending_review'
    )
  );

drop policy if exists "Managers can inspect pending discovery documents" on storage.objects;
create policy "Managers can inspect pending discovery documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'discovery-library'
    and public.can_manage_discovery_library()
  );

drop policy if exists "Approved open access discovery documents can be read" on storage.objects;
create policy "Approved open access discovery documents can be read"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'discovery-library'
    and exists (
      select 1 from public.discovery_records r
      where r.storage_path = storage.objects.name
        and r.review_status = 'verified'
        and r.access_status = 'open_access'
    )
  );

drop policy if exists "Managers update discovery documents" on storage.objects;
create policy "Managers update discovery documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'discovery-library' and public.can_manage_discovery_library())
  with check (bucket_id = 'discovery-library' and public.can_manage_discovery_library());

drop policy if exists "Managers delete discovery documents" on storage.objects;
create policy "Managers delete discovery documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'discovery-library' and public.can_manage_discovery_library());
