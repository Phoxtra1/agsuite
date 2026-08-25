// scripts/provision-appwrite.ts
/**
 * Idempotent Appwrite Provisioning Script for AG Suite (Amineva Suite)
 * 
 * Usage:
 *   APPWRITE_API_KEY=your_key npx tsx scripts/provision-appwrite.ts
 *
 * Reads config from .env or environment variables:
 * - VITE_APPWRITE_ENDPOINT (default: https://fra.cloud.appwrite.io/v1)
 * - VITE_APPWRITE_PROJECT_ID (default: ag-suite03)
 * - VITE_DB_ID (default: agsuite-db2)
 * - APPWRITE_API_KEY (required for provisioning)
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

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || 'ag-suite03';
const DB_ID = process.env.VITE_DB_ID || 'agsuite-db2';
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.log('---------------------------------------------------------');
  console.log('NOTICE: APPWRITE_API_KEY is not set.');
  console.log('To run automated provisioning against Appwrite Cloud/Server, run:');
  console.log('   APPWRITE_API_KEY=<your_admin_api_key> npx tsx scripts/provision-appwrite.ts');
  console.log('---------------------------------------------------------');
}

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-appwrite-project': PROJECT_ID,
  'x-appwrite-key': API_KEY || '',
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
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
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

// Database schema definition for AG Suite
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
      { key: 'category', type: 'string', size: 255, required: false },
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
    id: 'applications',
    name: 'Suite Applications',
    attributes: [
      { key: 'app_id', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'status', type: 'string', size: 50, required: false },
    ],
  },
  {
    id: 'acs_daily_intelligence_cache',
    name: 'ACS Daily Intelligence Cache',
    attributes: [
      { key: 'cache_key', type: 'string', size: 255, required: true },
      { key: 'data', type: 'string', size: 100000, required: false },
      { key: 'created_at', type: 'string', size: 255, required: false },
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

async function runProvisioning(): Promise<void> {
  if (!API_KEY) {
    console.error('Cannot proceed without APPWRITE_API_KEY environment variable.');
    process.exit(1);
  }

  console.log(`Starting Appwrite Provisioning for Project: ${PROJECT_ID}, Database: ${DB_ID}...`);

  // 1. Ensure Database exists
  const dbCheck = await apiRequest('GET', `/databases/${DB_ID}`);
  if (!dbCheck.ok) {
    console.log(`Database '${DB_ID}' not found. Creating database...`);
    const createDb = await apiRequest('POST', '/databases', {
      databaseId: DB_ID,
      name: DB_ID,
    });
    if (createDb.ok) {
      console.log(`Database '${DB_ID}' created successfully.`);
    } else {
      console.error(`Failed to create database '${DB_ID}':`, createDb.data);
    }
  } else {
    console.log(`Database '${DB_ID}' already exists.`);
  }

  // 2. Iterate over collections
  for (const colSchema of collectionsSchema) {
    console.log(`Checking collection '${colSchema.id}'...`);
    const colCheck = await apiRequest('GET', `/databases/${DB_ID}/collections/${colSchema.id}`);

    if (!colCheck.ok) {
      console.log(`Creating collection '${colSchema.id}' (${colSchema.name})...`);
      const createCol = await apiRequest('POST', `/databases/${DB_ID}/collections`, {
        collectionId: colSchema.id,
        name: colSchema.name,
        permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
        documentSecurity: false,
      });

      if (!createCol.ok) {
        console.error(`Failed to create collection '${colSchema.id}':`, createCol.data);
        continue;
      }
      console.log(`Collection '${colSchema.id}' created.`);
    } else {
      console.log(`Collection '${colSchema.id}' exists. Checking attributes...`);
    }

    // Check existing attributes
    const attrCheck = await apiRequest('GET', `/databases/${DB_ID}/collections/${colSchema.id}/attributes`);
    const existingAttrs = new Set(attrCheck.ok && attrCheck.data?.attributes ? attrCheck.data.attributes.map((a: any) => a.key) : []);

    for (const attr of colSchema.attributes) {
      if (existingAttrs.has(attr.key)) {
        console.log(`  - Attribute '${attr.key}' already exists in '${colSchema.id}'. Skipping.`);
        continue;
      }

      console.log(`  + Adding attribute '${attr.key}' (${attr.type}) to '${colSchema.id}'...`);
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
        console.log(`  + Attribute '${attr.key}' created.`);
      } else {
        console.error(`  x Failed to create attribute '${attr.key}':`, createAttr.data);
      }
    }
  }

  console.log('Provisioning completed successfully!');
}

runProvisioning().catch(console.error);
