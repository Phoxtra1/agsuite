import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceDocument {
  id: string;
  owner_id: string;
  title: string;
  content_json: any;
  content_text: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  token: string;
  mode: "view" | "edit";
  revoked: boolean;
  expires_at: string | null;
  created_at: string;
}

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };
const CACHE_KEY = "amineva_workspace_docs";

function getLocalDocs(): WorkspaceDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDocs(docs: WorkspaceDocument[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error("[ag-docs] Failed to save local docs", e);
  }
}

function seedDefaultDocs(): WorkspaceDocument[] {
  const now = new Date().toISOString();
  const defaultDocs: WorkspaceDocument[] = [
    {
      id: "doc-welcome",
      owner_id: "usr-demo",
      title: "Welcome to Amineva Docs",
      content_json: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Welcome to Amineva Docs" }]
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Amineva Docs works seamlessly online or offline. Create, edit, export, and collaborate on your documents with Dipa AI assistance."
              }
            ]
          }
        ]
      },
      content_text: "Welcome to Amineva Docs. Amineva Docs works seamlessly online or offline.",
      created_at: now,
      updated_at: now,
    }
  ];
  saveLocalDocs(defaultDocs);
  return defaultDocs;
}

export async function listDocuments(): Promise<WorkspaceDocument[]> {
  try {
    const { data, error } = await supabase
      .from("workspace_documents" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data && Array.isArray(data) && data.length > 0) {
      saveLocalDocs(data as any);
      return data as any;
    }
  } catch (e) {
    console.warn("[ag-docs] Supabase unreachable, using offline storage", e);
  }
  const local = getLocalDocs();
  if (local.length > 0) return local;
  return seedDefaultDocs();
}

export async function getDocument(id: string): Promise<WorkspaceDocument | null> {
  try {
    const { data, error } = await supabase
      .from("workspace_documents" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      const local = getLocalDocs();
      const idx = local.findIndex((d) => d.id === id);
      if (idx >= 0) local[idx] = data as any;
      else local.unshift(data as any);
      saveLocalDocs(local);
      return data as any;
    }
  } catch (e) {
    console.warn("[ag-docs] Offline get document", e);
  }

  const local = getLocalDocs();
  const found = local.find((d) => d.id === id);
  if (found) return found;

  // Fallback: create local doc on demand so link never opens blank
  const now = new Date().toISOString();
  const fallback: WorkspaceDocument = {
    id,
    owner_id: "usr-demo",
    title: "Untitled Document",
    content_json: EMPTY_DOC,
    content_text: "",
    created_at: now,
    updated_at: now,
  };
  local.unshift(fallback);
  saveLocalDocs(local);
  return fallback;
}

export async function createDocument(title = "Untitled document"): Promise<WorkspaceDocument | null> {
  let userId = "usr-demo";
  try {
    const { data: u } = await supabase.auth.getUser();
    if (u?.user) userId = u.user.id;
  } catch {}

  const now = new Date().toISOString();
  const localId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newDoc: WorkspaceDocument = {
    id: localId,
    owner_id: userId,
    title,
    content_json: EMPTY_DOC,
    content_text: "",
    created_at: now,
    updated_at: now,
  };

  const local = getLocalDocs();
  local.unshift(newDoc);
  saveLocalDocs(local);

  // Attempt sync to Supabase in background
  supabase
    .from("workspace_documents" as any)
    .insert({ title, owner_id: userId, content_json: EMPTY_DOC, content_text: "" })
    .select()
    .single()
    .then(({ data }) => {
      if (data) {
        const updatedLocal = getLocalDocs();
        const idx = updatedLocal.findIndex((d) => d.id === localId);
        if (idx >= 0) {
          updatedLocal[idx] = data as any;
          saveLocalDocs(updatedLocal);
        }
      }
    })
    .catch(() => {});

  return newDoc;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content_json?: any; content_text?: string; outline?: any; classification?: string }
): Promise<boolean> {
  const now = new Date().toISOString();
  const local = getLocalDocs();
  const idx = local.findIndex((d) => d.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...patch, updated_at: now };
    saveLocalDocs(local);
  }

  try {
    const { error } = await supabase
      .from("workspace_documents" as any)
      .update(patch)
      .eq("id", id);
    if (!error) return true;
  } catch (e) {
    console.warn("[ag-docs] Offline update queued locally", e);
  }
  return true;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const local = getLocalDocs();
  const filtered = local.filter((d) => d.id !== id);
  saveLocalDocs(filtered);

  try {
    await supabase.from("workspace_documents" as any).delete().eq("id", id);
  } catch {}
  return true;
}

export async function duplicateDocument(doc: WorkspaceDocument): Promise<WorkspaceDocument | null> {
  let userId = "usr-demo";
  try {
    const { data: u } = await supabase.auth.getUser();
    if (u?.user) userId = u.user.id;
  } catch {}

  const now = new Date().toISOString();
  const localId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const duplicated: WorkspaceDocument = {
    id: localId,
    owner_id: userId,
    title: `${doc.title} (copy)`,
    content_json: doc.content_json,
    content_text: doc.content_text,
    created_at: now,
    updated_at: now,
  };

  const local = getLocalDocs();
  local.unshift(duplicated);
  saveLocalDocs(local);
  return duplicated;
}

export async function snapshotVersion(documentId: string, content_json: any) {
  try {
    const { data: u } = await supabase.auth.getUser();
    await supabase
      .from("workspace_document_versions" as any)
      .insert({ document_id: documentId, content_json, created_by: u?.user?.id ?? null });
  } catch {}
}

// ---- Shares -------------------------------------------------------

function genToken() {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listShares(documentId: string): Promise<DocumentShare[]> {
  try {
    const { data, error } = await supabase
      .from("workspace_document_shares" as any)
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });
    if (!error && data) return (data as any) || [];
  } catch {}
  return [];
}

export async function createShare(documentId: string, mode: "view" | "edit"): Promise<DocumentShare | null> {
  try {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("workspace_document_shares" as any)
      .insert({ document_id: documentId, mode, token: genToken(), created_by: u?.user?.id ?? null })
      .select()
      .single();
    if (!error && data) return data as any;
  } catch {}
  return {
    id: `share-${Date.now()}`,
    document_id: documentId,
    token: genToken(),
    mode,
    revoked: false,
    expires_at: null,
    created_at: new Date().toISOString(),
  };
}

export async function revokeShare(id: string) {
  try {
    await supabase.from("workspace_document_shares" as any).update({ revoked: true }).eq("id", id);
  } catch {}
}

// ---- Public share access (anon) ----------------------------------

export interface SharedDocPayload {
  id: string;
  title: string;
  content_json: any;
  mode: "view" | "edit";
  updated_at: string;
}

export async function fetchSharedDocument(token: string): Promise<SharedDocPayload | null> {
  try {
    const { data, error } = await (supabase.rpc as any)("get_shared_document", { _token: token });
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      return row || null;
    }
  } catch {}
  return null;
}

export async function pushSharedDocument(
  token: string,
  content_json: any,
  content_text: string,
  title?: string
): Promise<boolean> {
  try {
    const { data, error } = await (supabase.rpc as any)("update_shared_document", {
      _token: token,
      _content_json: content_json,
      _content_text: content_text,
      _title: title ?? null,
    });
    if (!error && data) return !!data;
  } catch {}
  return false;
}
