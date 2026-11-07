# Amineva Global — product and platform foundation

This document records the product direction that the application, future Lovable changes and backend work must preserve. It is a design constraint, not a claim that every planned backend capability is already connected or deployed.

## 1. Public identity

Amineva Global is an **information discovery system** focused on making accurate, structured and accessible information easier to find, understand and use.

Its public purpose is to help people explore knowledge, understand opportunities, examine evidence and make more informed decisions. Do not reposition Amineva Global as an IT company, a general software-development agency, a charity, a foundation or an NGO.

Software and internal platforms support the information-discovery purpose; they are not the central public identity.

## 2. Information Discovery is not a conventional search engine or AI answer page

The Information Discovery experience must not imitate a generic web-search results page or a chatbot that produces a single answer and asks the visitor to trust it.

It follows a structured discovery method:

1. **Area** — establish the wider subject or decision domain.
2. **Subject group** — divide the area into meaningful parts.
3. **Investigation topic** — define the particular issue the visitor wants to understand.
4. **Questions to answer** — break the issue into practical, checkable questions.
5. **Evidence standards** — identify what would count as useful evidence and how to assess it.
6. **Original sources** — direct visitors to the institutions, publishers, datasets, research records or authorities responsible for the underlying information.
7. **Specialist exploration** — where available, provide focused tools or structured data views that help examine the subject.
8. **Next step** — introduce an Amineva product only when one genuinely supports the next action; otherwise leave the subject independent and link to an appropriate external destination.

The primary question field maps a visitor's wording to Amineva's structured areas and investigation guides. It is not a promise to search the entire public internet. Label the scope clearly and do not imply that internal topic matches are live web results.

A research index, API-powered dataset or external reference directory must be identified by its actual provider and purpose. Distinguish source metadata from verified findings. Show retrieval time separately from publication or observation date. Never imply that an indexed record, DOI, generated summary or source listing independently validates a claim.

Do not present generic fallback text as Dipa output, verified research or a source-backed answer. Where a connected research service is unavailable, show the investigation questions and source routes rather than inventing a result.

## 3. Product introduction and external destinations

Products should appear as a natural continuation of a subject, not as forced advertisements.

Current area-to-product associations in Information Discovery:
- Career Development and Education → Adesua, for practical learning and education pathways.
- Business Management → Inventra, for business and inventory operations.
- Financial Operations → Sikasɛm, for financial operations.
- Agriculture and Climate Intelligence → AgroClimate, for agricultural and climate intelligence.
- IT Services and Support → DataLens, for scoped technology and data services.

Only use a product association while the product is genuinely available and relevant. Do not invent a product for an area that has none. For areas without a matching Amineva product, keep the discovery guide useful on its own and provide relevant original publishers, public authorities, recognised institutions or established external services where appropriate.

Product descriptions, category summaries, topic structures, source directories and other fixed public content should remain static application assets unless there is a real editorial or operational reason to make them dynamic. Do not copy static descriptions or every public search result into Supabase.

## 4. Workspace: local-first, cloud-assisted

Workspace productivity editing should not depend on an always-available cloud backend.

- Docs, Sheets, Slides and Forms should save locally first in IndexedDB.
- Drive should retain file metadata and, where the browser permits, the original uploaded file bytes locally.
- Use localStorage only for small preferences, session-scope markers and compact metadata.
- Local saves must complete before cloud synchronisation is attempted.
- A failed cloud request must never erase a successful local save.
- Restore local records after refresh and browser restart.
- Synchronise changed records selectively and in batches; do not upload on every keystroke.
- Avoid unnecessary polling, realtime subscriptions, repeated full-document writes and redundant version copies.
- Provide clear backup/export options. Local browser storage is device- and browser-profile-specific and is not a substitute for a separate backup.
- Never treat a network failure as proof that a user signed out. Preserve local account scope on an auth-service outage. A previously enrolled trusted device may use a separate local passphrase to access only that account’s local Workspace cache; this is not a cloud session or online entitlement.
- Do not silently merge two users' private local records. Account-scope adoption must be explicit, traceable and conflict-aware.

## 5. Supabase target responsibilities

Supabase is the proposed central backend for Amineva Global, subject to confirming the actual project connection, credentials, current data and migration history.

It should manage only the cloud capabilities that need a shared authoritative service:

- Amineva ID authentication and verified contact details.
- Individual account profiles.
- Organisation profiles, memberships and roles.
- Central customer identity and billing records.
- Payment references and server-verified transaction states.
- Subscription records and product entitlements.
- Minimal Workspace metadata and selectively synchronised Workspace copies, only if the selected cloud provider is available. Local editing must continue without this service.

Do not store the public Information Discovery catalogue, static application descriptions, every public search result, or all Workspace editing activity in Supabase. The active Workspace cloud adapter must remain replaceable; see `docs/WORKSPACE_LOCAL_FIRST_BACKEND_STRATEGY.md`.

Use Row Level Security and server-side verification for private records, organisation membership, payment status and entitlements. Never expose service-role credentials in the browser.

## 6. Central identity and billing

Long-term account model:
- Registration supports email or phone with verification.
- Accounts can be individual or organisational.
- Organisations have explicit members, roles and permissions.
- Existing product accounts must be mapped carefully; do not delete or force-merge product identities before tested migration.

Central billing should support different product business models rather than forcing every product into one subscription pattern:

- Workspace: free.
- AgroClimate, Sikasɛm and Adesua: subscription models.
- DataLens: scoped service request, quotation, invoice and payment.
- Other products: add only after their commercial model is confirmed.

A payment provider's browser redirect is not proof of payment. Verify payment server-side before recording it as paid or granting product entitlements.

## 7. Keep other product backends separate during restoration

AgroClimate, Sikasɛm, Adesua and DataLens retain their existing backend arrangements during the initial Amineva Global restoration. Do not migrate their operational data or replace their authentication as part of the Workspace repair. Central identity and entitlement connections can be designed later, with explicit mapping and rollback.

## 8. Implementation and release discipline

- Inspect the existing code and data model before changing an integration.
- Preserve the current product interfaces and capabilities unless a change is required to fix a verified defect or implement the agreed direction.
- Prefer root-cause fixes in the existing repository over parallel implementations.
- Back up and migrate legacy local records safely; never delete the old copy before the new store commits.
- Test refresh, browser restart, offline mode, failed sync, account switching, data conflict, export and restore.
- Do not claim that Supabase is connected, migrations are applied, old data is recovered or production is restored until those facts are verified.
- Deploy only after build, tests, security review and the required live integration checks pass.
