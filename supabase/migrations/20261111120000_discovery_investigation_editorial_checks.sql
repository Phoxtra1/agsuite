-- Extend the existing private editorial workflow for investigation reports.
-- Existing verified records are not silently re-certified; new checks apply
-- when an editor reviews or re-reviews a record after this migration.

alter table public.discovery_records
  add column if not exists jurisdiction_and_publication_date_checked boolean not null default false,
  add column if not exists findings_and_legal_status_checked boolean not null default false;

alter table public.discovery_records
  drop constraint if exists discovery_records_verified_review_complete;

alter table public.discovery_records
  add constraint discovery_records_verified_review_complete check (
    review_status <> 'verified' or (
      bibliographic_details_checked and original_source_checked and
      version_and_corrections_checked and rights_and_access_checked and
      jurisdiction_and_publication_date_checked and findings_and_legal_status_checked and
      nullif(trim(rights_basis),'') is not null and
      nullif(trim(review_note),'') is not null and
      reviewed_by is not null and reviewed_at is not null
    )
  ) not valid;
