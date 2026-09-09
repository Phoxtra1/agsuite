# Appwrite Self-Hosted Migration Guide (Phoxtra Platform)

This guide documents the complete configuration, provisioning, and deployment process for migrating **AG Suite (Amineva Suite)** to your self-hosted Appwrite instance at `https://cloud.phoxtra.com/v1`.

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

# Server Provisioning API Key
APPWRITE_API_KEY="standard_6311d12b..."
```

---

## 2. API Key Scopes (Appwrite Console)

For automated database provisioning (`scripts/provision-appwrite.ts`) and server-side function execution, generate an API Key in the **Appwrite Console** (`https://cloud.phoxtra.com`) under **Project `amineva` -> Overview -> Settings -> API Keys** with the following scopes enabled:

- `databases.read` & `databases.write`
- `documents.read` & `documents.write`
- `buckets.read` & `buckets.write`
- `functions.read` & `functions.write`
- `users.read` & `users.write`

---

## 3. Database & Storage Provisioning Status: COMPLETE

Run the idempotent provisioning script to automatically create database `amineva-db`, all required collections, attribute schemas, and storage buckets:

```bash
npx tsx scripts/provision-appwrite.ts
```

### Provisioned Collections:
1. `profiles` - User Profiles & metadata
2. `products` - Suite Products & Applications catalog
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
33. `pins` - Security PIN hashes & lock state

### Provisioned Storage Buckets:
- `suite_assets` - Public assets & avatars
- `workspace-drive` - Drive uploaded files
- `ticket-attachments` - Support attachments

---

## 4. Appwrite CLI & Function Deployment

The project root includes `appwrite.json` configured for Appwrite CLI deployment:

```bash
# Login to self-hosted Appwrite CLI
npx appwrite login --endpoint https://cloud.phoxtra.com/v1

# Push project structure and functions
npx appwrite push functions
```

---

## 5. Verification & Testing

Verify system isolation and backend cutover by executing the Vitest test suite:

```bash
npm test
```
