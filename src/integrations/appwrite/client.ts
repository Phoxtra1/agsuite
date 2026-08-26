import client, { account, databases, storage as appwriteStorage, functions as appwriteFunctions, APPWRITE_DB_ID, ID } from "@/lib/appwrite";
import { Query } from "appwrite";

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
    try {
      if (this.operation === "select") {
        const res = await databases.listDocuments(APPWRITE_DB_ID, this.collection, this.queries);
        const mapped = res.documents.map(mapAppwriteDoc);

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
          const clean = cleanPayload(item);
          delete clean.id;

          const doc = await databases.createDocument(APPWRITE_DB_ID, this.collection, docId, clean);
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

// Appwrite Auth Adapter conforming to Supabase auth interface
const authAdapter = {
  async getSession() {
    try {
      const sess = await account.getSession("current");
      const user = await account.get();
      return {
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
    } catch {
      return { data: { session: null }, error: null };
    }
  },

  async getUser() {
    try {
      const user = await account.get();
      return {
        data: {
          user: {
            id: user.$id,
            email: user.email,
            user_metadata: {
              name: user.name,
              ...(user.prefs || {}),
            },
          },
        },
        error: null,
      };
    } catch {
      return { data: { user: null }, error: null };
    }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      // Clear existing session if any
      try { await account.deleteSession("current"); } catch {}

      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();

      return {
        data: {
          session,
          user: {
            id: user.$id,
            email: user.email,
            user_metadata: { name: user.name, ...(user.prefs || {}) },
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: { session: null, user: null }, error: { message: err?.message || "Sign in failed" } };
    }
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    try {
      const name = options?.data?.name || email.split("@")[0];
      const userId = ID.unique();
      await account.create(userId, email, password, name);

      if (options?.data) {
        try { await account.updatePrefs(options.data); } catch {}
      }

      // Auto sign-in post registration
      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();

      return {
        data: {
          user: { id: user.$id, email: user.email, user_metadata: { name: user.name, ...options?.data } },
          session,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err?.message || "Sign up failed" } };
    }
  },

  async signOut() {
    try {
      await account.deleteSession("current");
      return { error: null };
    } catch (err: any) {
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
    // Check session on init and return subscription interface
    this.getSession().then(({ data }) => {
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
      const payload = typeof options?.body === "string" ? options.body : JSON.stringify(options?.body || {});
      const execution = await appwriteFunctions.createExecution(
        (import.meta as any).env?.VITE_SUITE_FUNCTION_ID || functionName,
        payload
      );
      let data = null;
      try {
        data = JSON.parse(execution.responseBody);
      } catch {
        data = execution.responseBody;
      }
      return { data, error: execution.status === "failed" ? { message: "Execution failed" } : null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Function invocation failed" } };
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

      // Default fallback to function invocation
      return functionsAdapter.invoke(fnName, { body: args });
    } catch (err: any) {
      return { data: null, error: { message: err?.message || `RPC ${fnName} failed` } };
    }
  },
};

export default supabase;
