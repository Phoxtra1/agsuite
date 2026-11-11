import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { ResearchRecord } from "@/lib/infoDiscovery/researchSearch";
import {
  validateDiscoveryRecordDraft,
  validateDiscoveryReview,
  type DiscoveryRecordDraft,
  type DiscoveryReviewEvidence,
  type DiscoveryReviewDecision,
} from "@/lib/infoDiscovery/sourceReview";

const TABLE = "discovery_records";

export type DiscoveryLibraryRecord = DiscoveryRecordDraft & {
  id: string;
  reviewStatus: "pending_review" | "verified" | "rejected" | "withdrawn";
  reviewNote: string;
  createdAt: string;
  reviewedAt: string | null;
  storagePath: string | null;
  storageMimeType: string | null;
  storageSize: number | null;
};

export type DiscoveryReviewEvent = {
  id: string;
  recordId: string;
  actorId: string | null;
  action: string;
  previousStatus: string | null;
  nextStatus: string;
  note: string;
  createdAt: string;
};

export type DiscoveryLibraryAccess = {
  allowed: boolean;
  reason?: string;
  userId?: string;
};

function db() {
  return (supabase as any).from(TABLE);
}

export async function checkDiscoveryLibraryAccess(): Promise<DiscoveryLibraryAccess> {
  if (!isSupabaseConfigured) return { allowed: false, reason: "Supabase is not configured for this deployment." };
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { allowed: false, reason: "Sign in with an authorised Suite administrator account to review publications." };
  }

  const { data: app, error: appError } = await (supabase as any)
    .from("applications")
    .select("id")
    .eq("app_slug", "suite")
    .eq("status", "active")
    .maybeSingle();
  if (appError || !app?.id) {
    return { allowed: false, reason: "The active Suite application could not be confirmed.", userId: authData.user.id };
  }

  const { data: profile, error: profileError } = await (supabase as any)
    .from("profiles")
    .select("role,status")
    .eq("user_id", authData.user.id)
    .eq("app_id", app.id)
    .eq("status", "active")
    .maybeSingle();
  if (profileError || !profile || !["manager", "super_admin"].includes(profile.role)) {
    return { allowed: false, reason: "This account does not have an active Suite manager or super-admin role.", userId: authData.user.id };
  }
  return { allowed: true, userId: authData.user.id };
}

function mapRow(row: any): DiscoveryLibraryRecord {
  return {
    id: row.id,
    title: row.title || "",
    authors: row.authors || [],
    publicationYear: row.publication_year ?? undefined,
    publisher: row.publisher || "",
    containerTitle: row.container_title || "",
    doi: row.doi || "",
    canonicalUrl: row.canonical_url || "",
    sourceId: row.source_id || "",
    sourceName: row.source_name || "",
    abstract: row.abstract || "",
    materialType: row.material_type || "publication",
    subjects: row.subjects || [],
    jurisdiction: row.jurisdiction || "",
    accessStatus: row.access_status || "unknown",
    license: row.license || "",
    rightsBasis: row.rights_basis || "",
    fullTextUrl: row.full_text_url || "",
    reviewStatus: row.review_status,
    reviewNote: row.review_note || "",
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || null,
    storagePath: row.storage_path || null,
    storageMimeType: row.storage_mime_type || null,
    storageSize: row.storage_size ?? null,
  };
}

export async function listDiscoveryLibraryRecords(status?: DiscoveryLibraryRecord["reviewStatus"]): Promise<DiscoveryLibraryRecord[]> {
  const { data, error } = await db()
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);
  if (error) throw new Error(error.message || "Unable to load the publication review queue.");
  const rows = (data || []).map(mapRow);
  return status ? rows.filter((row: DiscoveryLibraryRecord) => row.reviewStatus === status) : rows;
}

export async function submitDiscoveryRecord(draft: DiscoveryRecordDraft): Promise<DiscoveryLibraryRecord> {
  const errors = validateDiscoveryRecordDraft(draft);
  if (errors.length) throw new Error(errors.join(" "));
  const access = await checkDiscoveryLibraryAccess();
  if (!access.allowed || !access.userId) throw new Error(access.reason || "Not authorised.");

  const { data, error } = await db().insert({
    title: draft.title.trim(),
    authors: draft.authors.map(author => author.trim()).filter(Boolean),
    publication_year: draft.publicationYear ?? null,
    publisher: draft.publisher.trim(),
    container_title: draft.containerTitle.trim() || null,
    doi: draft.doi.trim() ? draft.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "") : null,
    canonical_url: draft.canonicalUrl.trim(),
    source_id: draft.sourceId.trim(),
    source_name: draft.sourceName.trim(),
    abstract: draft.abstract.trim(),
    material_type: draft.materialType.trim() || "publication",
    subjects: draft.subjects.map(subject => subject.trim()).filter(Boolean),
    jurisdiction: draft.jurisdiction.trim() || null,
    access_status: draft.accessStatus,
    license: draft.license.trim() || null,
    rights_basis: draft.rightsBasis.trim() || null,
    full_text_url: draft.fullTextUrl.trim() || null,
    submitted_by: access.userId,
    review_status: "pending_review",
  }).select("*").single();
  if (error) throw new Error(error.message || "Unable to add this item to the review queue.");
  return mapRow(data);
}

export async function reviewDiscoveryRecord(
  id: string,
  decision: DiscoveryReviewDecision,
  evidence: DiscoveryReviewEvidence,
): Promise<DiscoveryLibraryRecord> {
  const access = await checkDiscoveryLibraryAccess();
  if (!access.allowed || !access.userId) throw new Error(access.reason || "Not authorised.");
  if (!evidence.reviewNote.trim()) throw new Error("A reviewer note is required.");
  if (decision === "verified") {
    const errors = validateDiscoveryReview(evidence);
    if (errors.length) throw new Error(errors.join(" "));
  }

  const updates: Record<string, unknown> = {
    review_status: decision,
    review_note: evidence.reviewNote.trim(),
    reviewed_by: access.userId,
    reviewed_at: new Date().toISOString(),
    bibliographic_details_checked: decision === "verified" && evidence.bibliographicDetailsChecked,
    original_source_checked: decision === "verified" && evidence.originalSourceChecked,
    version_and_corrections_checked: decision === "verified" && evidence.versionAndCorrectionsChecked,
    rights_and_access_checked: decision === "verified" && evidence.rightsAndAccessChecked,
  };
  if (decision === "verified") updates.rights_basis = evidence.rightsBasis.trim();

  const { data, error } = await db().update(updates).eq("id", id).select("*").single();
  if (error) throw new Error(error.message || "Unable to save the review decision.");
  return mapRow(data);
}

export async function searchVerifiedDiscoveryRecords(query: string, signal?: AbortSignal): Promise<ResearchRecord[]> {
  if (!isSupabaseConfigured || query.trim().length < 2) return [];
  let request = db().select("*").eq("review_status", "verified")
    .textSearch("search_vector", query.trim(), { type: "websearch", config: "simple" })
    .order("publication_year", { ascending: false, nullsFirst: false })
    .limit(8);
  if (signal && typeof request.abortSignal === "function") request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) {
    if (/JWT|auth|permission|row-level security/i.test(error.message || "")) return [];
    throw new Error(error.message || "The reviewed publication library could not be searched.");
  }
  return (data || []).map((row: any): ResearchRecord => ({
    id: "amineva-library:" + row.id,
    title: row.title,
    doi: row.doi || undefined,
    url: row.canonical_url,
    year: row.publication_year || undefined,
    authors: (row.authors || []).join(", "),
    publisher: row.publisher || "Publisher not supplied",
    journal: row.container_title || "",
    abstract: (row.abstract || "").slice(0, 900),
    type: row.material_type || "Publication",
    sources: [row.source_name || "Amineva verified library"],
    openAccess: row.access_status === "open_access" && Boolean(row.full_text_url || row.storage_path),
    subjects: row.subjects || [],
    verificationStatus: "editorially-verified",
    verificationNote: row.review_note || "Editorial record review completed.",
    accessStatus: row.access_status,
    license: row.license || undefined,
    fullTextUrl: row.access_status === "open_access" ? (row.full_text_url || undefined) : undefined,
    libraryRecordId: row.storage_path && row.access_status === "open_access" ? row.id : undefined,
    hasStoredDocument: Boolean(row.storage_path && row.access_status === "open_access"),
  } as ResearchRecord));
}



export async function uploadDiscoveryDocument(recordId: string, file: File, rightsBasis: string): Promise<void> {
  const access = await checkDiscoveryLibraryAccess();
  if (!access.allowed) throw new Error(access.reason || "Not authorised.");
  if (!rightsBasis.trim()) throw new Error("Document upload requires a recorded licence or permission basis.");
  const allowed = new Set(["application/pdf", "application/epub+zip", "text/plain"]);
  if (!allowed.has(file.type)) throw new Error("Only PDF, EPUB and plain-text documents can be uploaded.");
  if (file.size > 50 * 1024 * 1024) throw new Error("The document exceeds the 50 MB upload limit.");

  const { data: current, error: lookupError } = await db().select("id,review_status,access_status").eq("id", recordId).single();
  if (lookupError || !current || current.review_status !== "pending_review") {
    throw new Error("Only a pending publication record can receive an uploaded document.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "document";
  const objectPath = recordId + "/" + crypto.randomUUID() + "-" + safeName;
  const { error: uploadError } = await supabase.storage.from("discovery-library").upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message || "Document upload failed.");

  const { error: updateError } = await db().update({
    storage_path: objectPath,
    storage_mime_type: file.type,
    storage_size: file.size,
    rights_basis: rightsBasis.trim(),
  }).eq("id", recordId);
  if (updateError) {
    await supabase.storage.from("discovery-library").remove([objectPath]).catch(() => null);
    throw new Error(updateError.message || "The document uploaded but the catalogue record could not be updated.");
  }
}

export async function getVerifiedDiscoveryDocumentUrl(recordId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data: record, error } = await db()
    .select("storage_path,review_status,access_status")
    .eq("id", recordId)
    .maybeSingle();
  if (error || !record?.storage_path || record.review_status !== "verified" || record.access_status !== "open_access") return null;

  const { data, error: signedError } = await supabase.storage
    .from("discovery-library")
    .createSignedUrl(record.storage_path, 900);
  if (signedError || !data?.signedUrl) return null;
  return data.signedUrl;
}


export async function listDiscoveryRecordReviewEvents(recordId: string): Promise<DiscoveryReviewEvent[]> {
  const access = await checkDiscoveryLibraryAccess();
  if (!access.allowed) throw new Error(access.reason || "Not authorised.");
  const { data, error } = await (supabase as any)
    .from("discovery_record_review_events")
    .select("id,record_id,actor_id,action,previous_status,next_status,note,created_at")
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message || "Unable to load publication review history.");
  return (data || []).map((row: any) => ({
    id: row.id,
    recordId: row.record_id,
    actorId: row.actor_id || null,
    action: row.action,
    previousStatus: row.previous_status || null,
    nextStatus: row.next_status,
    note: row.note || "",
    createdAt: row.created_at,
  }));
}


export async function getDiscoveryDocumentReviewUrl(recordId: string): Promise<string | null> {
  const access = await checkDiscoveryLibraryAccess();
  if (!access.allowed) throw new Error(access.reason || "Not authorised.");
  const { data: record, error } = await db()
    .select("storage_path")
    .eq("id", recordId)
    .maybeSingle();
  if (error || !record?.storage_path) return null;

  const { data, error: signedError } = await supabase.storage
    .from("discovery-library")
    .createSignedUrl(record.storage_path, 900);
  if (signedError || !data?.signedUrl) throw new Error(signedError?.message || "The stored document could not be opened.");
  return data.signedUrl;
}
