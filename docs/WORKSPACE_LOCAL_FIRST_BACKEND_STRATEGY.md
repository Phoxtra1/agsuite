# Workspace storage and backend boundaries

**Purpose:** preserve Amineva Global's local-first Workspace direction and avoid coupling the whole platform to one cloud provider.

## 1. The rule

Workspace must remain useful when any cloud provider is unavailable. The browser is the immediate editing environment; cloud services provide optional identity, collaboration, sharing, backup and synchronisation. A backend outage must not destroy a local save or prevent an enrolled user from reopening local files.

The architecture is not “Supabase everywhere”. It is a local-first application with replaceable cloud adapters and product-specific backend boundaries.

## 2. Current verified implementation

- Docs, Sheets, Slides and Forms persist account-scoped records in IndexedDB through `src/lib/workspace/localStore.ts`.
- Legacy account-scoped localStorage editor collections are migrated on first read. The legacy key is removed only after the IndexedDB transaction commits.
- Drive stores original uploaded file bytes in IndexedDB when browser storage is available, while retaining metadata and selectively attempting remote storage.
- Workspace remote sync is centralized through `src/lib/workspace/remoteSync.ts`. It coalesces queued writes, pauses while the Workspace is explicitly unlocked offline or the browser reports offline, and retains local deletion tombstones until a remote delete succeeds.
- The trusted-device unlock in `src/lib/workspace/localAccess.ts` is independent from cloud identity. The passphrase is enrolled while a real authenticated account is active. The code stores a salted PBKDF2 verifier, not the passphrase and not an auth token. Unlock exposes only the matching local Workspace scope.
- Offline mode does not create a cloud session, identity, organisation membership, paid entitlement or share link. Cloud-only operations are unavailable until real sign-in returns.
- Local browser storage is not a full-disk encryption boundary. The unlock gate helps prevent casual access to a browser profile, but OS/browser-profile access can still expose local files. Users should also protect their device with an OS login and disk encryption. Browser data can be lost when the profile is cleared, storage is evicted or the device fails; users still need independent exports/backups.

## 3. Actual cloud provider in this repository

The current Workspace compatibility client is backed by **self-hosted Appwrite**:

- `src/lib/appwrite.ts` configures the endpoint `https://cloud.phoxtra.com/v1`.
- `src/integrations/appwrite/client.ts` wraps Appwrite SDK operations in a Supabase-shaped compatibility API.
- `src/integrations/supabase/client.ts` re-exports that adapter.

The fact that callers use an object named `supabase`, or that the repository contains a `supabase/` migrations directory and the Supabase JS dependency, does not mean the current Workspace data path is connected to a Supabase project.

Do not remove the Appwrite adapter or migrate existing Appwrite data on the assumption that Supabase is already active. First establish the actual Lovable project connection, live Appwrite collections/storage, Supabase project URL/public key, applied migration history, data ownership, backup and rollback plan.

## 4. Role of Supabase — if/when the live project is confirmed

Supabase may be used as a central service for Amineva ID, individual and organisation accounts, memberships/roles, customer records, billing, server-verified transactions and product entitlements. This central service is not a prerequisite for local Workspace editing.

A future Workspace cloud connector may use Supabase for selected cloud copies and metadata, but it must implement the same provider-neutral sync contract and remain optional to local editing. The application must not leak Supabase-specific database assumptions into Docs/Sheets/Slides/Forms editor logic. Avoid duplicating full rich editor documents on every keystroke, public catalogue content, or every Information Discovery query.

Keep each product's operational backend separate during the initial restoration of AgroClimate, SikaSem, Adesua and DataLens. Connect central identity/entitlements through explicit integration contracts and migration mapping; do not bulk-replace each product's auth or operational database.

## 5. Cloud capabilities versus offline capabilities

| Capability | Offline Workspace | Requires a working cloud service |
|---|---:|---:|
| Open previously cached Docs, Sheets, Slides and Forms | Yes, after device unlock if signed out | No |
| Create and edit local Workspace records | Yes | No |
| Preview locally saved Drive file bytes | Yes, where the browser stored them | No |
| Queue a record change for later sync | Local save remains available; remote sync waits | Sync requires cloud |
| Delete a local/cloud-backed record | Local delete and tombstone persist | Remote deletion completes after reconnection |
| Account registration and password/verified-contact changes | No | Yes |
| Organisation membership and server-authoritative roles | Cached display only; no role changes | Yes |
| Shares, collaboration, server search and cross-device recovery | No | Yes |
| Paid subscription, quotation, invoice, transaction verification and entitlement | No | Yes, with trusted server-side provider verification |

## 6. Cutover discipline

A future provider change must be implemented behind the existing sync boundary, not by changing editor components to depend directly on one provider. The cutover sequence is:

1. Confirm live projects, environment configuration, applied migrations and data ownership.
2. Back up current Appwrite data, including original Drive file bytes and account mappings.
3. Reconcile the active record contracts (including Forms and Drive) with the destination schema and RLS.
4. Implement/test the destination provider adapter while retaining the current provider for rollback.
5. Test offline create/edit/delete, retries, stale-record conflicts, duplicate sync attempts, multiple-account isolation, and backup/restore in real browsers.
6. Migrate by module with checksums/reconciliation and a rollback window.
7. Only then retire an old provider or collection.

Never place a service-role key in browser code. Payment state and entitlements must be written only after server-side verification and idempotent event processing.
