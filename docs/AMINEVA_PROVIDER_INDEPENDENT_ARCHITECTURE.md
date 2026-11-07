# Amineva Global — provider-independent platform architecture

**Purpose:** Define the architecture boundary that must remain stable whether Amineva Global runs against the existing self-hosted Appwrite service, a Supabase project, another compatible Postgres/API service, or a future Amineva-operated backend.

## 1. Non-negotiable direction

Amineva Global must not become dependent on one hosted backend vendor.

The platform has four distinct responsibilities:

1. **Local application layer:** the browser/PWA owns the immediate Workspace editing experience and durable local working copy.
2. **Identity authority:** one explicitly selected identity provider validates users and issues real sessions. A backend outage is not a sign-out, but it is also not proof of identity.
3. **Remote data and sync services:** persist account-owned records and synchronise local changes when connectivity and a valid account session are available.
4. **Commercial authority:** a trusted server-side service owns quotes, invoices, payment verification, subscriptions and entitlements. The browser never declares a payment successful.

The frontend should depend on stable application contracts, not on vendor-specific assumptions leaking through every page and editor.

## 2. Current implementation and provider switch

The existing compatibility adapter in src/integrations/appwrite/client.ts remains the default provider and preserves the current self-hosted Appwrite integration.

The same exported client surface can now be explicitly configured to use the native Supabase JS client:

- VITE_BACKEND_PROVIDER=appwrite selects the existing Appwrite compatibility adapter.
- VITE_BACKEND_PROVIDER=supabase selects the native Supabase JS client.
- Supabase mode requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
- Only the browser-safe anon/publishable key belongs in frontend configuration. Never use a Supabase service-role key in a browser build.
- Provider selection is explicit. A missing Supabase configuration or unknown provider fails visibly; it does not silently fall back to another database and split data.

This is a controlled integration seam, not a claim that every Appwrite collection has been migrated to Supabase or that the live Supabase project is ready. Before switching, reconcile table names, columns, RLS, storage buckets, RPCs, file ownership and existing data.

## 3. Local-first Workspace

Docs, Sheets, Slides, Forms and Drive must remain useful as local working tools even when remote services are temporarily unavailable.

- IndexedDB stores rich records and Drive file bytes; localStorage is reserved for small preferences and compatibility migration.
- Records are scoped to the authenticated account identifier. Never use a shared demo identity or fabricate an account to bypass login.
- The local copy is saved before a remote write is attempted.
- Remote synchronisation is queued and retried when connectivity returns.
- Remote errors must not erase local records or be translated into a successful cloud write.
- Account switching must never expose another account's local records.
- Export/backup and restore must be available so a browser's local storage is not the only copy of important work.

**Security boundary:** retaining a local account scope after an outage is not offline authentication. Until an explicit trusted-device enrollment flow with encrypted local data and revocation is implemented and tested, Workspace must not grant access to an unauthenticated visitor merely because a previous UID remains in localStorage. Do not add a PIN-only cosmetic gate around plaintext IndexedDB and call it secure.

## 4. Provider-neutral service boundaries

Keep application code calling stable contracts for:

- IdentityProvider: restore session, sign in, register, verify contact, sign out, account profile.
- RecordRepository: scoped list/read/write/delete, version metadata and sync status.
- FileRepository: local blob persistence, remote upload/download, signed access and deletion.
- FunctionProvider: invoke trusted server operations with structured errors.
- BillingProvider: customer, quote, invoice, payment status, subscription and entitlement reads/actions.

Adapters implement those contracts for Appwrite, Supabase/Postgres, or an Amineva-operated service. Do not let a UI component select a backend or embed vendor credentials.

## 5. Data ownership and backend topology

- Amineva Global owns the central account relationship and the commercial ledger.
- Product operational databases remain independent during the initial restoration: AgroClimate, SikaSem, Adesua and DataLens are not to be migrated just because central identity or billing is introduced.
- A central account maps to existing product identities through explicit external-identity records. Do not force-merge or delete product accounts.
- Workspace local data belongs to the account scope; cloud copies are sync replicas and collaboration sources.
- Public Information Discovery guides and source directories remain primarily static/version-controlled. Do not store every public search result or duplicate public content in the billing database.

## 6. Identity and organisation model

Support verified email or phone sign-up, personal accounts and organisations. An individual may create or join organisations. Membership roles and permissions are enforced by the identity/data service, not only hidden in the interface.

A product-specific profile is not automatically the central identity record. Keep explicit mapping between the central identity and existing product user identifiers.

## 7. Billing model

| Product | Intended model | Required records |
|---|---|---|
| Workspace | Free | Account entitlement/baseline access |
| AgroClimate | Subscription | Plan, subscription lifecycle, verified payment and entitlement |
| SikaSem | Subscription | Plan, subscription lifecycle, verified payment and entitlement |
| Adesua | Subscription | Plan, subscription lifecycle, verified payment and entitlement |
| DataLens | Service-based | Service request, scope, quotation, acceptance, invoice, verified payment and delivery |
| Other products | Not yet approved | No invented price or paid entitlement |

Amounts use integer minor units and explicit ISO currency codes. Never store card security codes or raw card credentials. A browser redirect, client message or screenshot is not proof of payment. A trusted server verifies provider signatures/API status and amount/currency/reference, handles duplicate webhooks idempotently, then grants or revokes entitlements.

## 8. Deployment and cutover rules

Before a provider switch or production release:

1. Confirm the target project and provider configuration in Lovable/deployment settings.
2. Inspect the live database schema, migration history, RLS policies, storage buckets and server functions.
3. Back up existing data and document a rollback path.
4. Reconcile the current frontend data contracts with the target schema.
5. Test one module and one identity flow in a non-production environment.
6. Verify cross-account and cross-organisation isolation.
7. Test offline editing, browser restart, failed sync, retry, conflict, export and restore in a real browser.
8. Test payment success, failure, duplicate event, refund, cancellation and expiry server-side.
9. Only then migrate or switch production traffic.

Never run historical migrations blindly against an existing project. Never delete or shut down the existing Appwrite service as part of a frontend provider switch. No backend cutover is complete until the real hosted environment has been checked.
