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

export async function listDocuments(): Promise<WorkspaceDocument[]> {
  const { data, error } = await supabase
    .from("workspace_documents" as any)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[ag-docs] list failed", error);
    return [];
  }
  return (data as any) || [];
}

export async function getDocument(id: string): Promise<WorkspaceDocument | null> {
  const { data, error } = await supabase
    .from("workspace_documents" as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[ag-docs] get failed", error);
    return null;
  }
  return data as any;
}

export async function createDocument(title = "Untitled document"): Promise<WorkspaceDocument | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("workspace_documents" as any)
    .insert({ title, owner_id: u.user.id, content_json: EMPTY_DOC, content_text: "" })
    .select()
    .single();
  if (error) {
    console.error("[ag-docs] create failed", error);
    return null;
  }
  return data as any;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content_json?: any; content_text?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from("workspace_documents" as any)
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[ag-docs] update failed", error);
    return false;
  }
  return true;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const { error } = await supabase.from("workspace_documents" as any).delete().eq("id", id);
  if (error) {
    console.error("[ag-docs] delete failed", error);
    return false;
  }
  return true;
}

export async function duplicateDocument(doc: WorkspaceDocument): Promise<WorkspaceDocument | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("workspace_documents" as any)
    .insert({
      owner_id: u.user.id,
      title: `${doc.title} (copy)`,
      content_json: doc.content_json,
      content_text: doc.content_text,
    })
    .select()
    .single();
  if (error) {
    console.error("[ag-docs] duplicate failed", error);
    return null;
  }
  return data as any;
}

export async function snapshotVersion(documentId: string, content_json: any) {
  const { data: u } = await supabase.auth.getUser();
  await supabase
    .from("workspace_document_versions" as any)
    .insert({ document_id: documentId, content_json, created_by: u.user?.id ?? null });
}

// ---- Shares -------------------------------------------------------

function genToken() {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listShares(documentId: string): Promise<DocumentShare[]> {
  const { data, error } = await supabase
    .from("workspace_document_shares" as any)
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[ag-docs] list shares failed", error);
    return [];
  }
  return (data as any) || [];
}

export async function createShare(documentId: string, mode: "view" | "edit"): Promise<DocumentShare | null> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("workspace_document_shares" as any)
    .insert({ document_id: documentId, mode, token: genToken(), created_by: u.user?.id ?? null })
    .select()
    .single();
  if (error) {
    console.error("[ag-docs] create share failed", error);
    return null;
  }
  return data as any;
}

export async function revokeShare(id: string) {
  await supabase.from("workspace_document_shares" as any).update({ revoked: true }).eq("id", id);
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
  const { data, error } = await (supabase.rpc as any)("get_shared_document", { _token: token });
  if (error) {
    console.error("[ag-docs] shared fetch failed", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row || null;
}

export async function pushSharedDocument(
  token: string,
  content_json: any,
  content_text: string,
  title?: string
): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("update_shared_document", {
    _token: token,
    _content_json: content_json,
    _content_text: content_text,
    _title: title ?? null,
  });
  if (error) {
    console.error("[ag-docs] shared update failed", error);
    return false;
  }
  return !!data;
}
