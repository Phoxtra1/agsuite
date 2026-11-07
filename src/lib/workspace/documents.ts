import { supabase } from "@/integrations/appwrite/client";
import { getWorkspaceUser } from "@/lib/workspace/scope";
import { readWorkspaceCollection, writeWorkspaceCollection } from "@/lib/workspace/localStore";
import { reconcile, scheduleRemote, upsertRemote, deleteRemote, isRealUser, isRemoteId, suppressTombstonedRemoteRows } from "@/lib/workspace/remoteSync";
import { isWorkspaceOfflineMode } from "@/lib/workspace/localAccess";

const TBL = "workspace_documents";
const toRow = (d: WorkspaceDocument, userId: string) => ({ ...d, owner_id: isRealUser(d.owner_id) ? d.owner_id : userId });
function pushDoc(d: WorkspaceDocument) {
  const owner = isRealUser(d.owner_id) ? d.owner_id : getWorkspaceUser();
  if (!isRealUser(owner) || !isRemoteId(d.id)) return;
  scheduleRemote(`${TBL}:${d.id}`, () => upsertRemote(TBL, d.id, toRow(d, owner)));
}

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
async function getLocalDocs(): Promise<WorkspaceDocument[]> {
  return readWorkspaceCollection("amineva_workspace_docs");
}

async function saveLocalDocs(records: WorkspaceDocument[]): Promise<void> {
  await writeWorkspaceCollection("amineva_workspace_docs", records);
}

async function getAuthenticatedUserId(): Promise<string> {
  if (isWorkspaceOfflineMode()) return getWorkspaceUser();
  try {
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null }, error: new Error("Timeout") }), 600)
    );
    const { data } = await Promise.race([getUserPromise, timeoutPromise]);
    if (data?.user?.id) return data.user.id;
  } catch {}
  const scopeUser = getWorkspaceUser();
  if (scopeUser && scopeUser !== "anon") return scopeUser;
  return "local-user";
}

export async function listDocuments(): Promise<WorkspaceDocument[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const local = await getLocalDocs();
  if (isWorkspaceOfflineMode() || (typeof navigator !== "undefined" && !navigator.onLine)) return local;
  try {
    const queryPromise = supabase
      .from("workspace_documents" as any)
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Timeout") }), 2500)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (!error && data && Array.isArray(data)) {
      const remoteRows = await suppressTombstonedRemoteRows(TBL, data as any as WorkspaceDocument[][]);
      const merged = reconcile({ table: TBL, local: await getLocalDocs(), remote: remoteRows, userId, updatedAt: (d) => d.updated_at, toRow });
      await saveLocalDocs(merged);
      return merged;
    }
  } catch (e) {
    console.warn("[ag-docs] Supabase unreachable, using offline storage", e);
  }
  return local;
}

export async function getDocument(id: string): Promise<WorkspaceDocument | null> {
  const local = await getLocalDocs();
  const cached = local.find((d) => d.id === id);
  if (cached || isWorkspaceOfflineMode() || (typeof navigator !== "undefined" && !navigator.onLine)) return cached ?? null;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from("workspace_documents" as any)
      .select("*")
      .eq("id", id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!error && data) {
      const idx = local.findIndex((d) => d.id === id);
      if (idx >= 0) local[idx] = data as any;
      else local.unshift(data as any);
      await saveLocalDocs(local);
      return data as any;
    }
  } catch (e) {
    console.warn("[ag-docs] Offline get document", e);
  }

  const found = local.find((d) => d.id === id);
  if (found) return found;

  return null;
}

export async function createDocument(title = "Untitled document"): Promise<WorkspaceDocument> {
  const userId = await getAuthenticatedUserId();

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

  const local = await getLocalDocs();
  local.unshift(newDoc);
  await saveLocalDocs(local);

  pushDoc(newDoc);
  return newDoc;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content_json?: any; content_text?: string; outline?: any; classification?: string }
): Promise<boolean> {
  const now = new Date().toISOString();
  const local = await getLocalDocs();
  const idx = local.findIndex((d) => d.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...patch, updated_at: now };
    await saveLocalDocs(local);
    pushDoc(local[idx]);
  }
  return true;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const local = await getLocalDocs();
  const filtered = local.filter((d) => d.id !== id);
  await saveLocalDocs(filtered);
  deleteRemote(TBL, id);
  return true;
}

export async function duplicateDocument(doc: WorkspaceDocument): Promise<WorkspaceDocument> {
  const userId = await getAuthenticatedUserId();

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

  const local = await getLocalDocs();
  local.unshift(duplicated);
  await saveLocalDocs(local);
  pushDoc(duplicated);
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

export async function invalidateShareToken(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("workspace_document_shares" as any)
      .update({ revoked: true })
      .eq("token", token);
    if (!error) return true;
  } catch (e) {
    console.warn("[ag-docs] Failed to invalidate share token", e);
  }
  return false;
}
