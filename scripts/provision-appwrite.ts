// scripts/provision-appwrite.ts
/**
 * Idempotent Appwrite Provisioning Script for AG Suite (Amineva Suite)
 * 
 * Target Server: https://cloud.phoxtra.com/v1
 * Target Project: adesua
 * Target Database: amineva-db
 */

import fs from 'fs';
import path from 'path';

function loadDotEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadDotEnv();

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.phoxtra.com/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'amineva';
const DB_ID = process.env.VITE_DB_ID || 'amineva-db';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('ERROR: APPWRITE_API_KEY is not set in .env or environment.');
  process.exit(1);
}

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
  'X-Appwrite-Response-Format': '1.5.0'
};

interface ApiResponse {
  status: number;
  ok: boolean;
  data: any;
}

async function apiRequest(method: string, apiPath: string, body: any = null): Promise<ApiResponse> {
  const url = `${ENDPOINT}${apiPath}`;
  const options: RequestInit = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  } catch (err: any) {
    return { status: 0, ok: false, data: { message: err?.message || 'Network fetch failed' } };
  }
}

interface AttributeSchema {
  key: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'datetime';
  size?: number;
  required: boolean;
  default?: any;
}

interface CollectionSchema {
  id: string;
  name: string;
  attributes: AttributeSchema[];
}

const collectionsSchema: CollectionSchema[] = [
  {
    id: 'profiles',
    name: 'User Profiles',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: false },
      { key: 'full_name', type: 'string', size: 255, required: false },
      { key: 'avatar_url', type: 'string', size: 1024, required: false },
      { key: 'role', type: 'string', size: 100, required: false, default: 'user' },
      { key: 'onboardingComplete', type: 'boolean', required: false, default: false },
      { key: 'updated_at', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'products',
    name: 'Suite Products & Applications',
    attributes: [
      { key: 'id', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'short_name', type: 'string', size: 255, required: false },
      { key: 'description', type: 'string', size: 1024, required: false },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'url', type: 'string', size: 1024, required: false },
      { key: 'admin_url', type: 'string', size: 1024, required: false },
      { key: 'sort_order', type: 'integer', required: false, default: 0 },
      { key: 'is_public', type: 'boolean', required: false, default: false },
      { key: 'is_external', type: 'boolean', required: false, default: false },
      { key: 'product_type', type: 'string', size: 50, required: true },
    ],
  },
  {
    id: 'module_access',
    name: 'Module Access Control',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'moduleId', type: 'string', size: 255, required: true },
      { key: 'granted', type: 'boolean', required: false, default: true },
      { key: 'grantedBy', type: 'string', size: 255, required: false },
      { key: 'grantedAt', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'modules',
    name: 'Suite Modules',
    attributes: [
      { key: 'moduleId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 1024, required: false },
      { key: 'isPublic', type: 'boolean', required: false, default: false },
    ],
  },
  {
    id: 'applications',
    name: 'Suite Applications',
    attributes: [
      { key: 'app_id', type: 'string', size: 255, required: true },
      { key: 'app_name', type: 'string', size: 255, required: true },
      { key: 'app_slug', type: 'string', size: 255, required: true },
      { key: 'app_type', type: 'string', size: 50, required: false },
      { key: 'status', type: 'string', size: 50, required: false },
    ],
  },
  {
    id: 'user_app_access',
    name: 'User Application Access',
    attributes: [
      { key: 'user_id', type: 'string', size: 255, required: true },
      { key: 'app_id', type: 'string', size: 255, required: true },
      { key: 'role', type: 'string', size: 100, required: false },
      { key: 'active', type: 'boolean', required: false, default: true },
    ],
  },
  {
    id: 'coms_templates',
    name: 'COMS Email Templates',
    attributes: [
      { key: 'template_id', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'subject', type: 'string', size: 255, required: false },
      { key: 'body', type: 'string', size: 10000, required: false },
      { key: 'category', type: 'string', size: 100, required: false },
    ],
  },
  {
    id: 'campaigns',
    name: 'COMS Campaigns',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 100, required: true },
      { key: 'status', type: 'string', size: 100, required: true },
      { key: 'audience', type: 'integer', required: false, default: 0 },
    ],
  },
  {
    id: 'coms_logs',
    name: 'COMS Activity Logs',
    attributes: [
      { key: 'channel', type: 'string', size: 100, required: true },
      { key: 'event', type: 'string', size: 255, required: true },
      { key: 'recipient', type: 'string', size: 255, required: true },
      { key: 'delivery_status', type: 'string', size: 100, required: true },
    ],
  },
  {
    id: 'inbound_messages',
    name: 'COMS Inbound Messages',
    attributes: [
      { key: 'sender', type: 'string', size: 255, required: true },
      { key: 'subject', type: 'string', size: 255, required: true },
      { key: 'body', type: 'string', size: 10000, required: true },
      { key: 'channel', type: 'string', size: 100, required: true },
    ],
  },
  {
    id: 'support_tickets',
    name: 'Support Tickets',
    attributes: [
      { key: 'ticket_id', type: 'string', size: 255, required: true },
      { key: 'user_id', type: 'string', size: 255, required: true },
      { key: 'subject', type: 'string', size: 255, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'priority', type: 'string', size: 50, required: false },
      { key: 'message', type: 'string', size: 10000, required: false },
      { key: 'created_at', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'ticket_attachments',
    name: 'Ticket Attachments',
    attributes: [
      { key: 'ticket_id', type: 'string', size: 255, required: true },
      { key: 'file_name', type: 'string', size: 255, required: true },
      { key: 'storage_path', type: 'string', size: 1024, required: true },
    ],
  },
  {
    id: 'ticket_audit_log',
    name: 'Ticket Audit Log',
    attributes: [
      { key: 'ticket_id', type: 'string', size: 255, required: true },
      { key: 'action', type: 'string', size: 255, required: true },
      { key: 'details', type: 'string', size: 1000, required: false },
    ],
  },
  {
    id: 'workspace_documents',
    name: 'Workspace Documents',
    attributes: [
      { key: 'document_id', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 100000, required: false },
      { key: 'owner_id', type: 'string', size: 255, required: true },
      { key: 'created_at', type: 'string', size: 255, required: false },
      { key: 'updated_at', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'workspace_document_versions',
    name: 'Workspace Document Versions',
    attributes: [
      { key: 'document_id', type: 'string', size: 255, required: true },
      { key: 'version_number', type: 'integer', required: true },
      { key: 'content', type: 'string', size: 100000, required: false },
      { key: 'created_by', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'workspace_document_shares',
    name: 'Workspace Document Shares',
    attributes: [
      { key: 'document_id', type: 'string', size: 255, required: true },
      { key: 'shared_with_id', type: 'string', size: 255, required: true },
      { key: 'permission_level', type: 'string', size: 50, required: true },
    ],
  },
  {
    id: 'workspace_document_comments',
    name: 'Workspace Document Comments',
    attributes: [
      { key: 'document_id', type: 'string', size: 255, required: true },
      { key: 'author_id', type: 'string', size: 255, required: true },
      { key: 'body', type: 'string', size: 5000, required: true },
    ],
  },
  {
    id: 'workspace_sheets',
    name: 'Workspace Sheets',
    attributes: [
      { key: 'sheet_id', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'data', type: 'string', size: 100000, required: false },
      { key: 'owner_id', type: 'string', size: 255, required: true },
      { key: 'updated_at', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'workspace_sheet_shares',
    name: 'Workspace Sheet Shares',
    attributes: [
      { key: 'sheet_id', type: 'string', size: 255, required: true },
      { key: 'shared_with_id', type: 'string', size: 255, required: true },
      { key: 'permission_level', type: 'string', size: 50, required: true },
    ],
  },
  {
    id: 'workspace_slides',
    name: 'Workspace Slides',
    attributes: [
      { key: 'slide_id', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'slides_data', type: 'string', size: 100000, required: false },
      { key: 'owner_id', type: 'string', size: 255, required: true },
      { key: 'updated_at', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'workspace_slide_shares',
    name: 'Workspace Slide Shares',
    attributes: [
      { key: 'slide_id', type: 'string', size: 255, required: true },
      { key: 'shared_with_id', type: 'string', size: 255, required: true },
      { key: 'permission_level', type: 'string', size: 50, required: true },
    ],
  },
  {
    id: 'workspace_forms',
    name: 'Workspace Forms',
    attributes: [
      { key: 'form_id', type: 'string', size: 255, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'schema_json', type: 'string', size: 100000, required: false },
      { key: 'owner_id', type: 'string', size: 255, required: true },
    ],
  },
  {
    id: 'workspace_drive_state',
    name: 'Workspace Drive State',
    attributes: [
      { key: 'user_id', type: 'string', size: 255, required: true },
      { key: 'state_json', type: 'string', size: 100000, required: false },
    ],
  },
  {
    id: 'drive_folders',
    name: 'Drive Folders',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'owner_id', type: 'string', size: 255, required: true },
      { key: 'parent_id', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'drive_files',
    name: 'Drive Files',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'kind', type: 'string', size: 50, required: true },
      { key: 'owner_id', type: 'string', size: 255, required: true },
      { key: 'folder_id', type: 'string', size: 255, required: false },
      { key: 'storage_path', type: 'string', size: 1024, required: false },
      { key: 'size_bytes', type: 'integer', required: false, default: 0 },
    ],
  },
  {
    id: 'drive_shares',
    name: 'Drive Shares',
    attributes: [
      { key: 'file_id', type: 'string', size: 255, required: true },
      { key: 'token', type: 'string', size: 255, required: true },
      { key: 'access', type: 'string', size: 50, required: true },
    ],
  },
  {
    id: 'admin_credentials',
    name: 'Admin Seal Credentials',
    attributes: [
      { key: 'adminId', type: 'string', size: 100, required: true },
      { key: 'recoveryId', type: 'string', size: 100, required: true },
      { key: 'position', type: 'string', size: 255, required: false },
      { key: 'pinSalt', type: 'string', size: 100, required: true },
      { key: 'pinHash', type: 'string', size: 500, required: true },
      { key: 'failedAttempts', type: 'integer', required: false, default: 0 },
      { key: 'lockedUntil', type: 'string', size: 255, required: false },
      { key: 'lastLoginAt', type: 'string', size: 255, required: false },
      { key: 'createdAt', type: 'string', size: 255, required: false },
    ],
  },
  {
    id: 'pins',
    name: 'Security PINs & Credentials',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'scope', type: 'string', size: 100, required: true },
      { key: 'pinHash', type: 'string', size: 500, required: true },
      { key: 'failedAttempts', type: 'integer', required: false, default: 0 },
      { key: 'lockedUntil', type: 'string', size: 255, required: false },
      { key: 'updatedAt', type: 'string', size: 255, required: false },
    ],
  },
];


const legacyAcsCollections = [
  'acs_events',
  'acs_raw_data',
  'acs_intelligence_outputs',
  'acs_sync_logs',
  'acs_processing_logs',
  'acs_daily_intelligence_cache',
];

async function cleanupLegacyAppwriteData(): Promise<void> {
  // Delete only collections that belonged exclusively to the retired ACS service.
  for (const collectionId of legacyAcsCollections) {
    const result = await apiRequest('DELETE', `/databases/${DB_ID}/collections/${collectionId}`);
    if (result.ok) {
      console.log(`Removed retired Appwrite collection '${collectionId}'.`);
    } else if (result.status !== 404) {
      console.warn(`Could not remove retired collection '${collectionId}':`, result.status, result.data);
    }
  }

  // Keep the products collection and its admin records; remove only former category rows.
  const productsCheck = await apiRequest('GET', `/databases/${DB_ID}/collections/products`);
  if (productsCheck.ok) {
    const categoryDocuments: any[] = [];
    let offset = 0;
    const pageSize = 100;

    while (true) {
      const query = `?queries[]=${encodeURIComponent('limit(' + pageSize + ')')}&queries[]=${encodeURIComponent('offset(' + offset + ')')}`;
      const page = await apiRequest('GET', `/databases/${DB_ID}/collections/products/documents${query}`);
      if (!page.ok || !Array.isArray(page.data?.documents)) {
        console.warn('Could not inspect all product documents for retired category records:', page.status, page.data);
        break;
      }
      const documents = page.data.documents;
      categoryDocuments.push(...documents.filter((doc: any) => doc.product_type === 'category'));
      if (documents.length < pageSize) break;
      offset += documents.length;
    }

    for (const document of categoryDocuments) {
      const removed = await apiRequest('DELETE', `/databases/${DB_ID}/collections/products/documents/${document.$id}`);
      if (!removed.ok) {
        console.warn(`Could not remove legacy category product '${document.$id}':`, removed.status, removed.data);
      }
    }

    // The category attribute is no longer part of the admin Product Registry schema.
    const categoryAttribute = await apiRequest('DELETE', `/databases/${DB_ID}/collections/products/attributes/category`);
    if (!categoryAttribute.ok && categoryAttribute.status !== 404) {
      console.warn('Could not remove retired products.category attribute:', categoryAttribute.status, categoryAttribute.data);
    }
  }
}

const storageBuckets = [
  { id: 'suite_assets', name: 'Suite Assets' },
  { id: 'workspace-drive', name: 'Workspace Drive Storage' },
  { id: 'ticket-attachments', name: 'Support Ticket Attachments' },
];

async function runProvisioning(): Promise<void> {
  console.log(`Connecting to Appwrite Self-Hosted Server: ${ENDPOINT}...`);
  console.log(`Project: '${PROJECT_ID}', Database: '${DB_ID}'...`);

  // Health check
  const healthCheck = await apiRequest('GET', '/health');
  console.log(`Server health check status: ${healthCheck.status} ${healthCheck.ok ? 'OK' : 'FAIL'}`);

  // 1. Ensure Database exists
  const dbCheck = await apiRequest('GET', `/databases/${DB_ID}`);
  if (!dbCheck.ok) {
    console.log(`Database '${DB_ID}' check status: ${dbCheck.status} (${JSON.stringify(dbCheck.data)})`);
    console.log(`Attempting to create database '${DB_ID}'...`);
    const createDb = await apiRequest('POST', '/databases', {
      databaseId: DB_ID,
      name: DB_ID,
    });
    if (createDb.ok) {
      console.log(`Database '${DB_ID}' created successfully.`);
    } else {
      console.log(`Notice: Database creation response: ${createDb.status}`, createDb.data);
    }
  } else {
    console.log(`Database '${DB_ID}' already exists.`);
  }

  // 2. Remove obsolete ACS storage and former category catalogue data before provisioning current collections.
  await cleanupLegacyAppwriteData();

  // 3. Iterate over current collections
  for (const colSchema of collectionsSchema) {
    const colCheck = await apiRequest('GET', `/databases/${DB_ID}/collections/${colSchema.id}`);

    if (!colCheck.ok) {
      const createCol = await apiRequest('POST', `/databases/${DB_ID}/collections`, {
        collectionId: colSchema.id,
        name: colSchema.name,
        permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
        documentSecurity: false,
      });

      if (createCol.ok) {
        console.log(`Collection '${colSchema.id}' created.`);
      } else {
        console.log(`Notice for collection '${colSchema.id}': ${createCol.status}`, createCol.data);
      }
    } else {
      console.log(`Collection '${colSchema.id}' exists. Checking attributes...`);
    }

    // Check existing attributes
    const attrCheck = await apiRequest('GET', `/databases/${DB_ID}/collections/${colSchema.id}/attributes`);
    const existingAttrs = new Set(attrCheck.ok && attrCheck.data?.attributes ? attrCheck.data.attributes.map((a: any) => a.key) : []);

    for (const attr of colSchema.attributes) {
      if (existingAttrs.has(attr.key)) {
        continue;
      }

      let endpointPath = `/databases/${DB_ID}/collections/${colSchema.id}/attributes/${attr.type}`;
      const payload: any = {
        key: attr.key,
        required: attr.required,
      };

      if (attr.type === 'string') {
        payload.size = attr.size || 255;
        if (attr.default !== undefined) payload.default = attr.default;
      } else if (attr.type === 'integer' || attr.type === 'float') {
        if (attr.default !== undefined) payload.default = attr.default;
      } else if (attr.type === 'boolean') {
        if (attr.default !== undefined) payload.default = attr.default;
      }

      const createAttr = await apiRequest('POST', endpointPath, payload);
      if (createAttr.ok) {
        console.log(`  + Attribute '${attr.key}' created in '${colSchema.id}'.`);
      }
    }
  }

  // 4. Ensure Storage Buckets exist
  for (const b of storageBuckets) {
    const bCheck = await apiRequest('GET', `/storage/buckets/${b.id}`);
    if (!bCheck.ok) {
      const createB = await apiRequest('POST', '/storage/buckets', {
        bucketId: b.id,
        name: b.name,
        permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
        fileSecurity: false,
        enabled: true,
      });
      if (createB.ok) {
        console.log(`Storage bucket '${b.id}' created.`);
      }
    } else {
      console.log(`Storage bucket '${b.id}' exists.`);
    }
  }

  console.log('Appwrite self-host provisioning sequence completed!');
}

runProvisioning().catch(console.error);
