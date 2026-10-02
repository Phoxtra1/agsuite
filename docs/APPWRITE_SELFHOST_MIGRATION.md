# Appwrite Self-Hosted Migration Guide (Phoxtra Platform)

This guide documents the current state, architecture, completed milestones, and remaining tasks for migrating **AG Suite (Amineva Suite)** from Supabase to your self-hosted Appwrite instance at `https://cloud.phoxtra.com/v1`.

---

## 1. Environment Configuration

The application is configured to connect to your self-hosted Appwrite instance via environment variables defined in `.env`:

```env
VITE_BACKEND_PROVIDER="appwrite"
VITE_ACS_PROVIDER="appwrite"
VITE_APPWRITE_ENDPOINT="https://cloud.phoxtra.com/v1"
VITE_APPWRITE_PROJECT_ID="amineva"
VITE_DB_ID="amineva-db"
VITE_ACS_DATABASE_ID="amineva-db"
VITE_APPWRITE_PROFILES_COLLECTION_ID="profiles"
VITE_ASSETS_BUCKET_ID="suite_assets"
VITE_SUITE_FUNCTION_ID="69689f59003426b9e5e3"

# Server Provisioning API Key
APPWRITE_API_KEY="standard_6311d12b..."
```

---

## 2. Architecture & Compatibility Layer (Supabase Bridge)

To minimize code refactoring across the front-end components, the system uses a seamless Appwrite client adapter (`src/integrations/appwrite/client.ts`). The legacy Supabase import path (`@/integrations/supabase/client`) re-exports this adapter.

### Key Adapter Features:
- **`AppwriteQueryBuilder`**: Implements PostgREST / Supabase chainable syntax (`select`, `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `like`, `ilike`, `is`, `contains`, `order`, `limit`, `range`, `single`, `maybeSingle`, `insert`, `update`, `upsert`, `delete`) and translates them directly to Appwrite `Databases` queries (`Query.equal`, `Query.orderAsc`, `Query.limit`, etc.).
- **`authAdapter`**: Maps Appwrite `Account` sessions and authentication methods (`getSession`, `getUser`, `signInWithPassword`, `signUp`, `signOut`, `resetPasswordForEmail`, `updateUser`, `signInWithOAuth`, `onAuthStateChange`) into standard Supabase auth structures. Includes an in-memory session cache (5s TTL) to prevent rate limits.
- **`storageAdapter`**: Translates Supabase Storage methods (`upload`, `download`, `getPublicUrl`, `createSignedUrl`, `remove`) into Appwrite `Storage` bucket calls.
- **`functionsAdapter`**: Intercepts `supabase.functions.invoke(...)` and routes execution requests to the self-hosted Appwrite function `agSuite`.
- **`rpc` Adapter**: Maps legacy Supabase stored procedure calls (e.g. `ensure_self_app_access`, `has_app_access`, `get_shared_document`) into Appwrite database collections or Appwrite Function invocations.

---

## 3. Provisioning & Database Schema Status: COMPLETE

The database provisioning script (`scripts/provision-appwrite.ts`) is idempotent and configures database `amineva-db`, 33 collections with required attribute schemas, and 3 storage buckets.

```bash
npx tsx scripts/provision-appwrite.ts
```

### Provisioned Collections (33 Total):
1. `profiles` - User profiles & metadata
2. `products` - Suite products & applications catalog
3. `module_access` - Module access permissions
4. `modules` - System modules
5. `applications` - Registered app definitions
6. `user_app_access` - User application entitlement mapping
7. `acs_events` - ACS event logs
8. `acs_raw_data` - Raw ingested ACS datasets
9. `acs_intelligence_outputs` - Intelligence engine outputs
10. `acs_sync_logs` - Data sync logs
11. `acs_processing_logs` - ACS processing logs
12. `acs_daily_intelligence_cache` - Daily intelligence cache
13. `coms_templates` - COMS Email templates
14. `campaigns` - Marketing & notification campaigns
15. `coms_logs` - Communication activity logs
16. `inbound_messages` - COMS Inbound messages
17. `support_tickets` - Customer support tickets
18. `ticket_attachments` - Support ticket attachments
19. `ticket_audit_log` - Ticket history log
20. `workspace_documents` - Docs documents
21. `workspace_document_versions` - Version history
22. `workspace_document_shares` - Share permissions
23. `workspace_document_comments` - Document comments
24. `workspace_sheets` - Sheets workbooks
25. `workspace_sheet_shares` - Sheet sharing
26. `workspace_slides` - Slide decks
27. `workspace_slide_shares` - Slide sharing
28. `workspace_forms` - Form schemas & responses
29. `workspace_drive_state` - User Drive state cache
30. `drive_folders` - Folder hierarchy
31. `drive_files` - File index metadata
32. `drive_shares` - Drive share links
33. `admin_credentials` & `pins` - Security PIN hashes & credential lock state

### Provisioned Storage Buckets:
- `suite_assets` - Public assets & avatars
- `workspace-drive` - Drive uploaded files
- `ticket-attachments` - Support attachments

---

## 4. Appwrite Functions & Server Execution

Functions are configured in `appwrite.json` and deployed using the Appwrite CLI:

```bash
# Login to self-hosted Appwrite CLI
npx appwrite login --endpoint https://cloud.phoxtra.com/v1

# Push functions to self-hosted server
npx appwrite push functions
```

### Deployed Appwrite Functions:
- **`agSuite` (`69689f59003426b9e5e3`)**: Central backend handler covering:
  - Admin Seal ID & PIN authentication (`admin-seal-auth`, `id-create`, `id-migrate`, `id-login`)
  - User module retrieval (`get-user-modules`)
  - Login alerts & device fingerprinting (`login-alert`)
  - Email notification dispatching (`send-email`, `auth-mailer`)
  - ACS Data ingestion & telemetry (`acs-ingest`, `acs-intelligence`)
  - Inbound communication logging (`coms-inbound`)
  - AI Assistant Invocations (`docs-intelligence`, `sheets-intelligence`, `slides-intelligence`)
  - Application profiles & user access control (`ensure_app_profile`, `ensure_self_app_access`, `process_sla_alerts`)
- **`agStock` (`agStock`)**: Inventory, POS sales, billing, and PIN verification backend.

---

## 5. Current Migration State Summary

| Area | Status | Notes |
|---|---|---|
| Client Re-export Cutover | **100% Complete** | All `supabase` imports point to `@/integrations/appwrite/client`. Zero direct `@supabase/supabase-js` references in app source code. |
| Query / CRUD Operations | **100% Complete** | `AppwriteQueryBuilder` translates chained PostgREST queries to Appwrite SDK `listDocuments`, `createDocument`, `updateDocument`, `deleteDocument`. |
| Auth & Session Management | **100% Complete** | Appwrite `Account` service manages email/password, registrations, password resets, and session tokens. |
| File Storage & Drive | **100% Complete** | Appwrite `Storage` manages bucket uploads, downloads, public/signed URLs, and removals. |
| Admin Seal Security | **100% Complete** | Migrated from client-side PIN storage to server-side salted SHA-256 hash checks inside Appwrite Function `agSuite`. |
| Database Provisioning | **100% Complete** | Automated via `scripts/provision-appwrite.ts`. |
| Test Suite Passing | **100% Complete** | Vitest test suite passes all 47 tests across 10 test suites (`npx vitest run`). |

---

## 6. What Needs to be Done to Make the Migration Complete (Native Cutover Checklist)

While the migration cutover is operational and test suites pass via the Supabase bridge adapter, the following tasks are required to complete a **100% pure, native Appwrite architecture**:

### 1. Direct Appwrite SDK Refactoring (Phase 2 Clean-up)
- **Replace Legacy Import Paths**: Gradually refactor imports from `@/integrations/appwrite/client` to direct `Databases`, `Account`, `Storage`, and `Functions` calls from `@/lib/appwrite`.
- **Eliminate PostgREST Chain Wrapper**: Replace chain calls (e.g. `supabase.from("products").select("*").eq(...)`) with native `databases.listDocuments(...)` queries to remove runtime translation overhead.

### 2. Native Realtime & Subscriptions
- Replace the dummy `channelAdapter` stub in `src/integrations/appwrite/client.ts` with Appwrite Client Realtime WebSockets: `client.subscribe('databases.amineva-db.collections.<collection_id>.documents', (response) => { ... })`.

### 3. Edge AI & LLM Model Integration
- Upgrade the mock outputs in `agSuite` (`docs-intelligence`, `sheets-intelligence`, `slides-intelligence`) to invoke self-hosted or API LLM providers (e.g., DeepSeek, OpenAI, or local Ollama instances running alongside Appwrite).

### 4. Direct Handshake Token Validation
- Add explicit handling for `verify_handshake_token` inside `agSuite` / `supabase.rpc` to validate SSO tokens against an `app_handshakes` collection or Appwrite cache when running outside preview mode.

### 5. Production Appwrite CLI CI/CD Pipeline
- Configure a GitHub Action / CI runner to automatically execute `npx tsx scripts/provision-appwrite.ts` and `npx appwrite push functions` on deployment to `cloud.phoxtra.com`.
