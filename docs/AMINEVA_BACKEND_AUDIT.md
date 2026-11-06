# Amineva Global — backend audit findings

**Repository inspected:** Phoxtra1/agsuite  
**Inspection date:** 6 November 2026  
**Scope:** Active frontend integrations, Workspace persistence, and checked-in Supabase migration files.  
**Important:** This is a source-code audit. It does not prove the status of a hosted Supabase project, Appwrite database, Fly.io machine, DNS or SSL certificate.

## 1. Current active backend is Appwrite, not Supabase

Verified in the repository:
- src/lib/appwrite.ts configures the Appwrite endpoint at https://cloud.phoxtra.com/v1.
- src/integrations/appwrite/client.ts implements a Supabase-shaped compatibility API using Appwrite SDK services.
- src/integrations/supabase/client.ts re-exports that Appwrite compatibility client rather than constructing a Supabase JS client.
- Workspace data modules import the Appwrite compatibility client even where the variable is named supabase.

Therefore, the presence of a supabase/ directory and SQL migrations does not mean the application currently authenticates or stores data through Supabase. Do not replace the adapter until the actual Supabase project URL, public key, Lovable connection and current data ownership are confirmed.

## 2. Workspace persistence findings

### Docs, Sheets, Slides and Forms
The four editor modules stored complete collections in account-scoped localStorage and attempted remote synchronisation through the Appwrite compatibility client.

This is not a good long-term store for rich documents, workbook cell data, presentation decks or form definitions. Browser localStorage has a small synchronous quota and rewriting whole collections on frequent edits increases failure risk.

The startup authentication adapter also treated every failed Appwrite session lookup as a successful response with session=null. The AuthContext could then interpret an outage as a confirmed sign-out and clear the remembered Workspace user scope. This is a plausible reason locally saved records could appear to disappear after refresh; it is not proof that all missing data remains recoverable.

### Drive
Drive stores folders, file metadata, shares and activity in localStorage. Before this change, uploading a file while the backend was unavailable could retain only metadata; the actual file bytes were not saved locally. The offline preview fallback could also return an unrelated stock image.

### Changes made on the feature branch
- Added a user-scoped IndexedDB store for editor records and Drive file blobs.
- Added a first-read migration from the existing scoped localStorage editor caches. The old cache is removed only after the IndexedDB transaction commits.
- Moved Docs, Sheets, Slides and Forms record persistence to IndexedDB, with a localStorage fallback for environments without IndexedDB.
- Kept the last local Workspace identity scope when session lookup fails due to a backend error. A network failure is no longer emitted as a confirmed SIGNED_OUT event.
- Drive now attempts to preserve uploaded file bytes locally before cloud upload, and can use those local bytes for offline previews.
- Removed unsupported fixed Drive quota and fake storage-distribution figures.

### Remaining Workspace validation
- Real-browser IndexedDB tests across refresh and browser restart.
- Migration test using a real existing localStorage cache.
- Multiple-account isolation and account-switch tests.
- Offline file upload and preview tests.
- Conflict handling and failed remote-sync tests.
- Explicit backup/export and restore workflow review.
- Offline access still remains subject to WorkspaceGate authentication. Preserving the local scope is not the same as granting an unverified offline login; an approved local-unlock design is still required if Workspace must be accessible while the identity backend is down.

## 3. Existing Supabase schema coverage

Checked-in migrations already define:
- profiles, team_members, applications, user_app_access, and app-specific profile/access helper functions.
- workspace_documents, workspace_document_versions, and workspace_document_shares.
- workspace_sheets and workspace_sheet_shares.
- workspace_slides and workspace_slide_shares.
- workspace_drive_state, which stores a user's Drive state as a JSONB document.
- Various support, communication, ACS, admin and security-related tables.

The active Workspace code also queries:
- workspace_forms
- drive_folders
- drive_files
- drive_shares
- Supabase Storage bucket workspace-drive

No matching table-creation migration for workspace_forms, drive_folders, drive_files or drive_shares was found in the checked-in migration set. The workspace_drive_state table is not the same data model as the active code's separate folder/file/share collections.

A Supabase migration cannot be assumed to restore all Workspace modules as they currently exist. The missing schemas and the actual hosted project's migration history must be reconciled before the client is switched.

## 4. Central identity and billing gaps

The checked-in migrations contain a product/application registry and per-app user access, but the inspected migration set does not establish the agreed complete central billing system.

No complete set of central tables and verified server-side workflows was found for:
- individual and organisation account types and organisation memberships/roles,
- central billing customer identities,
- payment-provider transactions and server-verified payment status,
- invoices and quotation workflows,
- subscription lifecycle and product entitlements across the stated business models.

The existing product/application registry and per-app access model may be useful foundations, but they should not be treated as a finished Amineva ID and billing implementation.

## 5. Security items requiring review before production Supabase use

These are migration-level findings; they require review against the actual deployed policies and console workflows before changing anything.

1. The product registry migrations include anonymous INSERT, UPDATE and DELETE policies on public.products. A later migration constrains accepted product fields, but still grants these operations to anon. This is broader than a normal public read-only product catalogue and should be reviewed against the console's real write requirements.
2. The admin_credentials migration seeds a built-in administrator identifier and a PIN hash derived from a known static PIN and salt. Treat this as a credential exposure risk. Remove/rotate the legacy credential through a controlled security migration before production use; do not expose or reuse the seed credential.
3. ACS migrations include a sync_acs_data_lake function that deletes rows from several ACS tables before rebuilding them. Its invocation frequency, permissions, data-retention requirements and database load must be reviewed before any central backend consolidation.
4. Some older migrations grant broad authenticated read/update/delete access to shared operational tables (for example inbound messages and ACS records). Review the final effective policies, not only individual migration statements.

No security migration was applied as part of this audit.

## 6. Migration and connection gates

Before switching the live client to Supabase:
1. Confirm the exact Supabase project used by Lovable and retrieve the project URL and browser-safe public key through the approved secret/configuration workflow.
2. Inspect the live project's applied migration history and actual RLS policies.
3. Confirm whether Appwrite collections and files can be exported, and whether any existing user data needs recovery.
4. Reconcile Forms and Drive schemas with the active frontend data contracts.
5. Define Amineva ID, organisation membership and central billing tables with RLS and server-side payment verification.
6. Prove authentication and one Workspace module in a test environment before migrating all Workspace tools.
7. Test rollback, backup and account mapping before production cutover.

Do not place a Supabase service-role key in frontend code. Do not run old migrations blindly against an existing project. Do not delete the Appwrite adapter or data until a verified migration and rollback plan exists.
