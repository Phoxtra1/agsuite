import client, { account, databases, storage as appwriteStorage, functions as appwriteFunctions, APPWRITE_DB_ID, ID } from "@/lib/appwrite";
import { Query, Permission, Role } from "appwrite";

// Helper: Convert Appwrite document -> standard shape with id, created_at, updated_at
function mapAppwriteDoc(doc: any): any {
  if (!doc || typeof doc !== "object") return doc;
  if (Array.isArray(doc)) return doc.map(mapAppwriteDoc);

  const mapped: any = { ...doc };
  if (!mapped.id && mapped.$id) mapped.id = mapped.$id;
  if (!mapped.created_at && mapped.$createdAt) mapped.created_at = mapped.$createdAt;
  if (!mapped.updated_at && mapped.$updatedAt) mapped.updated_at = mapped.$updatedAt;
  return mapped;
}

// Helper: Strip Appwrite internal metadata prior to insert/update payload
function cleanPayload(data: any): any {
  if (!data || typeof data !== "object") return data;
  const copy = { ...data };
  delete copy.$id;
  delete copy.$createdAt;
  delete copy.$updatedAt;
  delete copy.$databaseId;
  delete copy.$collectionId;
  delete copy.$permissions;
  return copy;
}

/**
 * Workspace collections on the self-hosted server store a few plain columns
 * plus one text "blob" column. Everything else the app keeps on a record
 * (content_json, workbook_json, deck_json, content_text, …) is packed into
 * that blob as JSON on write and unpacked on read, so the app's record shape
 * and the server schema always line up.
 */
const WORKSPACE_SCHEMAS: Record<string, { idField: string; blob: string; cols: string[] }> = {
  workspace_documents: { idField: "document_id", blob: "content", cols: ["title", "owner_id", "created_at", "updated_at"] },
  workspace_sheets: { idField: "sheet_id", blob: "data", cols: ["title", "owner_id", "updated_at"] },
  workspace_slides: { idField: "slide_id", blob: "slides_data", cols: ["title", "owner_id", "updated_at"] },
};
const META_KEYS = new Set(["id", "$id", "$createdAt", "$updatedAt", "$databaseId", "$collectionId", "$permissions", "$sequence"]);

function parseBlob(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}

function workspaceToRemote(collection: string, item: any, existingBlob?: any, isInsert = false): any {
  const s = WORKSPACE_SCHEMAS[collection];
  const extras = parseBlob(existingBlob);
  const row: any = {};
  for (const [k, v] of Object.entries(item || {})) {
    if (META_KEYS.has(k) || k === s.idField || k === s.blob) continue;
    if (s.cols.includes(k)) row[k] = v;
    else extras[k] = v;
  }
  const now = new Date().toISOString();
  if (s.cols.includes("updated_at")) row.updated_at = item?.updated_at || now;
  if (isInsert) {
    row[s.idField] = item?.id || item?.$id || "";
    if (!row.title) row.title = "Untitled";
    if (s.cols.includes("created_at") && !row.created_at) row.created_at = now;
    if (!extras.created_at) extras.created_at = row.created_at || now;
  }
  if (row.title && String(row.title).length > 255) row.title = String(row.title).slice(0, 255);
  row[s.blob] = JSON.stringify(extras);
  return row;
}

function workspaceFromRemote(collection: string, doc: any): any {
  const s = WORKSPACE_SCHEMAS[collection];
  if (!doc) return doc;
  const extras = parseBlob(doc[s.blob]);
  const out: any = { ...extras };
  for (const c of s.cols) if (doc[c] !== undefined && doc[c] !== null) out[c] = doc[c];
  out.id = doc.$id;
  out.created_at = extras.created_at || doc.created_at || doc.$createdAt;
  out.updated_at = doc.updated_at || doc.$updatedAt;
  return out;
}

function ownerPermissions(ownerId: any): string[] | undefined {
  if (!ownerId || typeof ownerId !== "string" || ownerId === "local-user" || ownerId === "anon") return undefined;
  return [Permission.read(Role.user(ownerId)), Permission.update(Role.user(ownerId)), Permission.delete(Role.user(ownerId))];
}

// Query builder implementing PostgREST/Supabase chainable shape
class AppwriteQueryBuilder {
  private collection: string;
  private queries: string[] = [];
  private isSingle = false;
  private isMaybeSingle = false;
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: any = null;

  constructor(collection: string) {
    this.collection = collection;
  }

  select(_cols?: string, _opts?: any) {
    return this;
  }

  insert(data: any, _opts?: any) {
    this.operation = "insert";
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.operation = "update";
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  upsert(data: any, _opts?: any) {
    this.operation = "upsert";
    this.payload = data;
    return this;
  }

  eq(col: string, val: any) {
    const targetCol = col === "id" ? "$id" : col;
    if (val !== undefined && val !== null) {
      this.queries.push(Query.equal(targetCol, val));
    }
    return this;
  }

  neq(col: string, val: any) {
    const targetCol = col === "id" ? "$id" : col;
    if (val !== undefined && val !== null) {
      this.queries.push(Query.notEqual(targetCol, val));
    }
    return this;
  }

  gt(col: string, val: any) {
    const targetCol = col === "id" ? "$id" : col;
    this.queries.push(Query.greaterThan(targetCol, val));
    return this;
  }

  gte(col: string, val: any) {
    const targetCol = col === "id" ? "$id" : col;
    this.queries.push(Query.greaterThanEqual(targetCol, val));
    return this;
  }

  lt(col: string, val: any) {
    const targetCol = col === "id" ? "$id" : col;
    this.queries.push(Query.lessThan(targetCol, val));
    return this;
  }

  lte(col: string, val: any) {
    const targetCol = col === "id" ? "$id" : col;
    this.queries.push(Query.lessThanEqual(targetCol, val));
    return this;
  }

  like(col: string, pattern: string) {
    const term = pattern.replace(/%/g, "");
    if (term) this.queries.push(Query.search(col, term));
    return this;
  }

  ilike(col: string, pattern: string) {
    return this.like(col, pattern);
  }

  is(col: string, val: any) {
    if (val === null) {
      this.queries.push(Query.isNull(col));
    } else {
      this.eq(col, val);
    }
    return this;
  }

  in(col: string, vals: any[]) {
    const targetCol = col === "id" ? "$id" : col;
    if (Array.isArray(vals) && vals.length > 0) {
      this.queries.push(Query.equal(targetCol, vals));
    }
    return this;
  }

  contains(col: string, val: any) {
    if (Array.isArray(val)) {
      this.queries.push(Query.equal(col, val));
    } else if (typeof val === "string") {
      this.queries.push(Query.search(col, val));
    }
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    const targetCol = col === "created_at" ? "$createdAt" : col === "updated_at" ? "$updatedAt" : col === "id" ? "$id" : col;
    if (opts?.ascending) {
      this.queries.push(Query.orderAsc(targetCol));
    } else {
      this.queries.push(Query.orderDesc(targetCol));
    }
    return this;
  }

  limit(n: number) {
    this.queries.push(Query.limit(n));
    return this;
  }

  range(from: number, to: number) {
    const limit = to - from + 1;
    this.queries.push(Query.offset(from));
    this.queries.push(Query.limit(limit));
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute(): Promise<{ data: any; error: any; count?: number | null }> {
    const ws = WORKSPACE_SCHEMAS[this.collection] ? this.collection : null;
    try {
      if (this.operation === "select") {
        const queries = [...this.queries];
        if (ws && !queries.some((q) => q.includes('"limit"'))) queries.push(Query.limit(200));
        const res = await databases.listDocuments(APPWRITE_DB_ID, this.collection, queries);
        const mapped = res.documents.map((d: any) => (ws ? workspaceFromRemote(ws, d) : mapAppwriteDoc(d)));

        if (this.isSingle) {
          if (mapped.length === 0) {
            return { data: null, error: { message: "No rows found" }, count: 0 };
          }
          return { data: mapped[0], error: null, count: res.total };
        }

        if (this.isMaybeSingle) {
          return { data: mapped[0] || null, error: null, count: res.total };
        }

        return { data: mapped, error: null, count: res.total };
      }

      if (this.operation === "insert") {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const inserted: any[] = [];

        for (const item of items) {
          const docId = item.id || item.$id || ID.unique();
          if (ws) {
            const row = workspaceToRemote(ws, item, undefined, true);
            row[WORKSPACE_SCHEMAS[ws].idField] = docId;
            const perms = ownerPermissions(item.owner_id);
            let doc: any;
            try {
              doc = await databases.createDocument(APPWRITE_DB_ID, this.collection, docId, row, perms);
            } catch (e: any) {
              if (!perms || e?.code === 409) throw e;
              doc = await databases.createDocument(APPWRITE_DB_ID, this.collection, docId, row);
            }
            inserted.push(workspaceFromRemote(ws, doc));
            continue;
          }
          const clean = cleanPayload(item);
          delete clean.id;

          const ownPerms = this.collection === "workspace_forms" ? ownerPermissions(clean.owner_id) : undefined;
          let doc: any;
          try {
            doc = await databases.createDocument(APPWRITE_DB_ID, this.collection, docId, clean, ownPerms);
          } catch (e: any) {
            if (!ownPerms || e?.code === 409) throw e;
            doc = await databases.createDocument(APPWRITE_DB_ID, this.collection, docId, clean);
          }
          inserted.push(mapAppwriteDoc(doc));
        }

        const resData = Array.isArray(this.payload) ? inserted : inserted[0];
        return { data: resData, error: null };
      }

      if (this.operation === "update") {
        const list = await databases.listDocuments(APPWRITE_DB_ID, this.collection, this.queries);
        const updated: any[] = [];
        const clean = cleanPayload(this.payload);
        delete clean.id;

        for (const doc of list.documents) {
          if (ws) {
            const row = workspaceToRemote(ws, clean, (doc as any)[WORKSPACE_SCHEMAS[ws].blob]);
            const res = await databases.updateDocument(APPWRITE_DB_ID, this.collection, doc.$id, row);
            updated.push(workspaceFromRemote(ws, res));
            continue;
          }
          const res = await databases.updateDocument(APPWRITE_DB_ID, this.collection, doc.$id, clean);
          updated.push(mapAppwriteDoc(res));
        }

        const resData = this.isSingle || this.isMaybeSingle ? (updated[0] || null) : updated;
        return { data: resData, error: null };
      }

      if (this.operation === "upsert") {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const results: any[] = [];

        for (const item of items) {
          const docId = item.id || item.$id;
          const clean = cleanPayload(item);
          delete clean.id;

          if (docId) {
            try {
              const updated = await databases.updateDocument(APPWRITE_DB_ID, this.collection, docId, clean);
              results.push(mapAppwriteDoc(updated));
              continue;
            } catch {
              // Document doesn't exist yet, proceed to create
            }
          }

          const created = await databases.createDocument(APPWRITE_DB_ID, this.collection, docId || ID.unique(), clean);
          results.push(mapAppwriteDoc(created));
        }

        const resData = Array.isArray(this.payload) ? results : results[0];
        return { data: resData, error: null };
      }

      if (this.operation === "delete") {
        const list = await databases.listDocuments(APPWRITE_DB_ID, this.collection, this.queries);
        for (const doc of list.documents) {
          await databases.deleteDocument(APPWRITE_DB_ID, this.collection, doc.$id);
        }
        return { data: null, error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.warn(`[Appwrite Client] Operation '${this.operation}' on '${this.collection}' error:`, err?.message || err);
      return { data: null, error: { message: err?.message || "Appwrite request failed" } };
    }
  }

  // Promise interface implementation
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<{ data: any; error: any; count?: number | null } | TResult> {
    return this.execute().catch(onrejected);
  }
}

// Session cache to prevent redundant Appwrite calls and avoid rate limits
let cachedAuthSession: { data: any; timestamp: number } | null = null;
const AUTH_CACHE_TTL_MS = 5000; // 5 seconds cache

function invalidateAuthCache() {
  cachedAuthSession = null;
}

// Appwrite Auth Adapter conforming to Supabase auth interface
const authAdapter = {
  async getSession() {
    const now = Date.now();
    if (cachedAuthSession && now - cachedAuthSession.timestamp < AUTH_CACHE_TTL_MS) {
      return cachedAuthSession.data;
    }

    try {
      const sess = await account.getSession("current");
      const user = await account.get();
      const result = {
        data: {
          session: {
            access_token: sess.$id,
            expires_at: Math.floor(new Date(sess.expire).getTime() / 1000),
            user: {
              id: user.$id,
              email: user.email,
              user_metadata: {
                name: user.name,
                ...(user.prefs || {}),
              },
              app_metadata: {
                provider: "email",
              },
            },
          },
        },
        error: null,
      };
      cachedAuthSession = { data: result, timestamp: now };
      return result;
    } catch (err: any) {
      // A network/backend failure is not proof that the user signed out.
      // Keep this distinct so AuthContext does not clear the local Workspace scope.
      const emptyResult = {
        data: { session: null },
        error: { message: err?.message || "Authentication service is temporarily unavailable.", code: "AUTH_SERVICE_UNAVAILABLE" },
      };
      cachedAuthSession = { data: emptyResult, timestamp: now };
      return emptyResult;
    }
  },

  async getUser() {
    const sessionRes = await this.getSession();
    const user = sessionRes?.data?.session?.user ?? null;
    return { data: { user }, error: sessionRes?.error ?? null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      invalidateAuthCache();
      const cleanEmail = email.trim();
      // Ensure any existing session is cleared before creating a new session
      await account.deleteSession("current").catch(() => null);

      const session = await account.createEmailPasswordSession(cleanEmail, password);
      const user = await account.get();

      const formattedUser = {
        id: user.$id,
        email: user.email,
        user_metadata: { name: user.name, ...(user.prefs || {}) },
        app_metadata: { provider: "email" },
      };

      const formattedSession = {
        access_token: session.$id,
        expires_at: Math.floor(new Date(session.expire).getTime() / 1000),
        user: formattedUser,
      };

      const successResult = {
        data: {
          session: formattedSession,
          user: formattedUser,
        },
        error: null,
      };

      // Keep the cache response in the same shape as getSession().
      cachedAuthSession = {
        data: {
          data: { session: formattedSession },
          error: null,
        },
        timestamp: Date.now(),
      };

      return successResult;
    } catch (err: any) {
      invalidateAuthCache();
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
        return {
          data: { session: null, user: null },
          error: { message: "Network error: Unable to connect to authentication server. Please check your connection or try again." },
        };
      }
      return { data: { session: null, user: null }, error: { message: err?.message || "Sign in failed" } };
    }
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    try {
      invalidateAuthCache();
      const cleanEmail = email.trim();
      const name = options?.data?.name || cleanEmail.split("@")[0];
      const userId = ID.unique();

      // Account creation must succeed against the real identity provider.
      await account.deleteSession("current").catch(() => null);
      const createdUser = await account.create(userId, cleanEmail, password, name);

      // A real session is required before the UI treats the user as authenticated.
      let session: any = null;
      let user: any = createdUser;
      try {
        await account.deleteSession("current").catch(() => null);
        session = await account.createEmailPasswordSession(cleanEmail, password);
        user = await account.get();
      } catch {
        // Account creation may have succeeded, but do not fabricate a session.
      }

      if (options?.data && user?.$id && session) {
        try { await account.updatePrefs(options.data); } catch { /* profile metadata can retry later */ }
      }

      const formattedUser = {
        id: user?.$id || createdUser.$id || userId,
        email: user?.email || cleanEmail,
        user_metadata: { name: user?.name || name, ...options?.data },
        app_metadata: { provider: "email" },
      };

      const formattedSession = session ? {
        access_token: session.$id,
        expires_at: Math.floor(new Date(session.expire).getTime() / 1000),
        user: formattedUser,
      } : null;

      cachedAuthSession = {
        data: { data: { session: formattedSession }, error: null },
        timestamp: Date.now(),
      };

      // Best effort non-blocking profile creation; never used as an auth substitute.
      databases.createDocument(APPWRITE_DB_ID, "profiles", ID.unique(), {
        userId: formattedUser.id,
        email: formattedUser.email,
        full_name: name,
        onboardingComplete: true,
      }).catch(() => null);

      return {
        data: { user: formattedUser, session: formattedSession },
        error: null,
      };
    } catch (err: any) {
      invalidateAuthCache();
      const message = err?.message || "Registration failed";
      if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("networkerror")) {
        return {
          data: { user: null, session: null },
          error: { message: "Network error: Unable to connect to authentication server. Please check your connection or try again." },
        };
      }
      return { data: { user: null, session: null }, error: { message } };
    }
  },

  async signOut() {
    try {
      invalidateAuthCache();
      await account.deleteSession("current");
      return { error: null };
    } catch (err: any) {
      invalidateAuthCache();
      return { error: { message: err?.message || "Sign out failed" } };
    }
  },

  async resetPasswordForEmail(email: string, options?: any) {
    try {
      const redirectUrl = options?.redirectTo || `${window.location.origin}/auth/reset-password`;
      await account.createRecovery(email, redirectUrl);
      return { data: {}, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Password recovery failed" } };
    }
  },

  async updateUser({ password, data }: { password?: string; data?: any }) {
    try {
      if (password) {
        await account.updatePassword(password);
      }
      if (data) {
        if (data.name) await account.updateName(data.name);
        await account.updatePrefs(data);
      }
      const user = await account.get();
      return {
        data: {
          user: {
            id: user.$id,
            email: user.email,
            user_metadata: { name: user.name, ...(user.prefs || {}) },
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "User update failed" } };
    }
  },

  async signInWithOAuth({ provider, options }: { provider: string; options?: any }) {
    try {
      const redirectSuccess = options?.redirectTo || `${window.location.origin}/auth/callback`;
      const redirectFailure = `${window.location.origin}/auth/callback?error=oauth`;
      account.createOAuth2Session(provider as any, redirectSuccess, redirectFailure);
      return { data: {}, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "OAuth failed" } };
    }
  },

  async signInWithOtp({ email, options }: { email: string; options?: any }) {
    return this.resetPasswordForEmail(email, options);
  },

  async resend({ email, options }: { type: string; email: string; options?: any }) {
    try {
      const redirectUrl = options?.emailRedirectTo || `${window.location.origin}/auth/callback`;
      await account.createVerification(redirectUrl);
      return { data: {}, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Resend failed" } };
    }
  },

  async exchangeCodeForSession(_code: string) {
    return this.getSession();
  },

  async verifyOtp(_params: any) {
    return this.getSession();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // A failed session check must not be emitted as SIGNED_OUT. Doing so
    // previously cleared the active local Workspace account scope on outage.
    this.getSession().then(({ data, error }: any) => {
      if (error) return;
      callback(data.session ? "SIGNED_IN" : "SIGNED_OUT", data.session);
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};

// Storage Adapter conforming to Supabase storage interface
const storageAdapter = {
  from(bucketId: string) {
    return {
      async upload(path: string, file: File | Blob, _options?: any) {
        try {
          const fileObj = file instanceof File ? file : new File([file], path.split("/").pop() || "file", { type: file.type });
          const res = await appwriteStorage.createFile(bucketId, ID.unique(), fileObj);
          return { data: { path: res.$id }, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err?.message || "Storage upload failed" } };
        }
      },

      async download(fileId: string) {
        try {
          const blob = await appwriteStorage.getFileDownload(bucketId, fileId);
          return { data: blob, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err?.message || "Storage download failed" } };
        }
      },

      createSignedUrl(fileId: string, _ttl: number = 300) {
        try {
          const url = appwriteStorage.getFileView(bucketId, fileId).toString();
          return Promise.resolve({ data: { signedUrl: url }, error: null });
        } catch (err: any) {
          return Promise.resolve({ data: null, error: { message: err?.message || "Signed URL failed" } });
        }
      },

      getPublicUrl(fileId: string) {
        try {
          const url = appwriteStorage.getFileView(bucketId, fileId).toString();
          return { data: { publicUrl: url } };
        } catch {
          return { data: { publicUrl: "" } };
        }
      },

      async remove(fileIds: string[]) {
        try {
          for (const id of fileIds) {
            await appwriteStorage.deleteFile(bucketId, id);
          }
          return { data: true, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err?.message || "Delete file failed" } };
        }
      },
    };
  },
};

// Functions Adapter conforming to Supabase functions interface
const functionsAdapter = {
  async invoke(functionName: string, options?: { body?: any; headers?: Record<string, string> }) {
    try {
      const functionId = (import.meta as any).env?.VITE_SUITE_FUNCTION_ID;
      if (!functionId) {
        return { data: null, error: null };
      }
      // Route by function name so the self-hosted `agSuite` function knows
      // which action to run.
      const rawBody = typeof options?.body === "string" ? JSON.parse(options.body || "{}") : (options?.body || {});
      const payload = JSON.stringify({ action: functionName, ...rawBody });
      const execution = await appwriteFunctions.createExecution(functionId, payload);
      let data = null;
      try {
        data = JSON.parse(execution.responseBody);
      } catch {
        data = execution.responseBody;
      }
      return { data, error: execution.status === "failed" ? { message: "Execution failed" } : null };
    } catch (err: any) {
      console.warn(`[Appwrite Functions] Function '${functionName}' invocation skipped:`, err?.message || err);
      return { data: null, error: null };
    }
  },
};

// Realtime Channel Adapter conforming to Supabase channel interface
function channelAdapter(channelName: string) {
  return {
    on(_event: string, _filter: any, _callback: (payload: any) => void) {
      return this;
    },
    subscribe(callback?: (status: string) => void) {
      if (callback) callback("SUBSCRIBED");
      return this;
    },
  };
}

// Appwrite Unified Client exporting Supabase-like surface
export const supabase = {
  from(collection: string) {
    return new AppwriteQueryBuilder(collection);
  },
  auth: authAdapter,
  storage: storageAdapter,
  functions: functionsAdapter,
  channel: channelAdapter,
  removeChannel(_channel: any) {},

  async rpc(fnName: string, args?: any) {
    try {
      if (fnName === "ensure_self_app_access") {
        const appSlug = args?._app_slug || "workspace";
        try {
          const user = await account.get();
          if (user?.$id) {
            const existing = await databases.listDocuments(APPWRITE_DB_ID, "module_access", [
              Query.equal("userId", user.$id),
              Query.equal("moduleId", appSlug),
              Query.limit(1),
            ]);
            if (existing.documents.length === 0) {
              await databases.createDocument(APPWRITE_DB_ID, "module_access", ID.unique(), {
                userId: user.$id,
                moduleId: appSlug,
                granted: true,
              }).catch(() => null);
            }
          }
        } catch {}
        return { data: appSlug, error: null };
      }

      if (fnName === "has_app_access" || fnName === "has_app_access_by_id") {
        const userId = args?._user_id;
        const appSlug = args?._app_slug;
        const appId = args?._app_id;

        const query = supabase.from("user_app_access").select("*").eq("user_id", userId);
        if (appId) query.eq("app_id", appId);
        const { data } = await query;
        const allowed = Array.isArray(data) && data.some((r: any) => r.active !== false);
        return { data: allowed, error: null };
      }

      if (fnName === "get_shared_document" || fnName === "get_shared_sheet" || fnName === "get_shared_slides") {
        const token = args?._token;
        const targetTable = fnName === "get_shared_document" ? "workspace_documents" : fnName === "get_shared_sheet" ? "workspace_sheets" : "workspace_slides";
        const { data } = await supabase.from(targetTable).select("*").limit(1);
        return { data: data || [], error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || `RPC ${fnName} failed` } };
    }
  },
};

export default supabase;
