# Lovable hand-off — Amineva Global and Amineva Suite

**Purpose:** continue from the current implementation without rebuilding completed work or making the Workspace depend on one cloud vendor.

This hand-off is intentionally written as a project instruction. Read the current repository before making changes.

## Non-negotiable architecture

1. Amineva Workspace is **local-first and cloud-assisted**. Docs, Sheets, Slides, Forms and Drive must remain usable for previously cached data when a cloud service is down. Local saves are authoritative for the current device until synchronisation succeeds.
2. Do not make Supabase a mandatory dependency for opening, editing, saving, exporting or restoring local Workspace content.
3. Do not replace every product backend with Supabase. AgroClimate, SikaSem, Adesua and DataLens retain their existing operational backends during the initial central identity rollout.
4. The repository currently configures Workspace cloud calls through a Supabase-shaped compatibility client backed by the self-hosted Appwrite endpoint configured in `src/lib/appwrite.ts`. `src/integrations/supabase/client.ts` currently re-exports this Appwrite adapter. This is a verified source-code fact; it does **not** prove what the live Lovable environment or hosted database is currently using.
5. Supabase is the proposed central Amineva ID and billing service after the actual project, current data, schema and access policies are verified. It is not the only storage or runtime layer for the platform.
6. Do not silently rewrite, replace, remove or duplicate the current Workspace implementation. Work in the existing repository and fix the cause in place.

## First: inspect and report the live configuration — do not change it yet

1. Confirm which GitHub repository and branch the Lovable project is connected to. It should be the existing `Phoxtra1/agsuite` repository and current `main` branch.
2. Confirm the deployed/preview commit matches the latest merged Workspace PR.
3. Inspect the Lovable environment variable names and whether values are configured:
   - `VITE_APPWRITE_ENDPOINT`
   - `VITE_APPWRITE_PROJECT_ID`
   - `VITE_BACKEND_PROVIDER`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (or the current browser-safe public key name)
   - `VITE_DISABLE_PRODUCT_AUTH`
4. Never print, commit or place any service-role key, Appwrite API key or payment secret in browser code. It is enough to confirm whether a required secret exists; redact the value in all reports.
5. Confirm the real Supabase project URL and project reference in Lovable, then inspect the actual live migration history, public schema, RLS policies, storage buckets and auth settings. Compare these with `supabase/migrations/` and `docs/AMINEVA_BACKEND_AUDIT.md`.
6. Confirm whether the current Appwrite instance contains live users, Workspace records, Drive metadata, uploaded file bytes, Forms or sharing data. Identify export/backup options before any migration.
7. Return a factual environment/schema report and a proposed sequence. If the live project or existing data cannot be confirmed, stop before running migrations or changing provider configuration.

## Workspace requirements — preserve the current implementation

The current repository contains:
- IndexedDB persistence for Docs, Sheets, Slides and Forms, with scoped migration from older localStorage editor caches.
- A trusted-device local passphrase unlock that is separate from cloud authentication.
- Account-scoped Drive file bytes and pending upload/delete queue in the same local store.
- Local deletion tombstones for editor records, so stale remote rows do not restore a locally deleted document.
- Account-bound JSON backup/restore covering IndexedDB records, Drive blobs and scoped settings.
- A replaceable sync boundary and explicit offline-only behavior.

Verify those functions in a real browser. Do not create another Workspace or parallel IndexedDB implementation. Test:
- Existing localStorage migration with a non-empty legacy account cache.
- Enrol device passphrase while signed in; sign out/reload; unlock offline.
- Correct account isolation when two accounts have local data in the same browser.
- Create/edit Docs, Sheets, Slides and Forms offline; refresh and reopen.
- Upload a Drive file offline; preview/download locally; reconnect and confirm it syncs once.
- Delete editor and Drive records offline; reconnect and confirm they do not reappear.
- Export a backup with Drive content; restore to the same account; reject another account's backup.
- Disable offline access without deleting local files.
- Simulate cloud errors while the browser still reports online.
- Verify that cloud-only actions (sharing, cross-device sync, membership changes) remain disabled during an offline unlock.

The device passphrase is an app access gate, not encryption of the IndexedDB contents. Do not describe it as full encryption. Device OS login, disk encryption and a separate backup remain necessary.

## Central Amineva ID — design and implementation requirements

Use the agreed model in `docs/AMINEVA_ID_BILLING_SCHEMA.md` after reviewing the live schema:

- Registration using verified email or verified phone.
- Individual accounts.
- Organisational accounts.
- Explicit organisation memberships, invitations and roles.
- A central identity mapping that links existing product identities without forcing them to be merged or deleted.
- Server-enforced permissions for organisation records and account administration.

The central account authority should expose clear integration contracts to existing products. Do not require every operational database to move to Supabase. Keep the existing product authentication/data systems intact until each product has a separately approved migration and rollback plan.

## Central billing — implement only with a real payment provider configuration

Support different commercial models:
- Workspace — free.
- AgroClimate, SikaSem and Adesua — subscriptions.
- DataLens — service request, scoping, quotation, invoice and verified payment.
- Other products — no price or paid entitlement until their commercial model is agreed.

Payment rules:
- The server creates pending payment records.
- Verify provider status server-side (signed webhook and/or provider API) before marking paid.
- Use idempotency for duplicate provider events.
- Create/update product entitlements only after server-side verification.
- Handle refunds, chargebacks, subscription cancellation and expiry.
- Do not grant access from a browser redirect, client message or screenshot.
- Never put provider secrets or a service-role key in the frontend.
- Do not invent prices or choose a provider without confirming the user's existing payment-provider account.

If the payment provider account, credentials, webhook setup or server-function deployment is not available, complete and test the provider-independent schema and contract, then report the exact missing environment requirements. Do not simulate a successful payment.

## Cost and data-minimisation requirements

- Keep the public Information Discovery catalogue and stable topic/source content as static app assets unless a real editorial workflow requires a database.
- Do not store every public search/discovery result or every Workspace edit in Supabase.
- Do not repeatedly upload entire rich documents on every keystroke.
- Keep Workspace cloud sync selective and recoverable.
- Avoid unnecessary polling and realtime subscriptions.
- Keep product operational backends separate while restoring central account/billing functions.

## Required completion report

Before changing production configuration, report:
1. GitHub repo, branch and exact deployed commit.
2. Confirmed Lovable environment variable names (values redacted).
3. Supabase project reference and migration status (no keys).
4. Existing Appwrite collections/buckets and data that would be affected.
5. Workspace browser QA results, with pass/fail for each test above.
6. Any schema conflicts or RLS weaknesses found.
7. Proposed provider cutover/rollback plan, only if a cutover is necessary.
8. What is genuinely deployed versus only committed or preview-built.

Do not change global provider settings, run migrations, delete collections, restart infrastructure or migrate product accounts until this report and rollback plan are complete.
