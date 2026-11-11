import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DISCOVERY_SOURCES } from "@/lib/infoDiscovery/sourceRegistry";
import {
  checkDiscoveryLibraryAccess,
  listDiscoveryLibraryRecords,
  listDiscoveryRecordReviewEvents,
  getDiscoveryDocumentReviewUrl,
  reviewDiscoveryRecord,
  submitDiscoveryRecord,
  uploadDiscoveryDocument,
  type DiscoveryLibraryAccess,
  type DiscoveryLibraryRecord,
  type DiscoveryReviewEvent,
} from "@/lib/infoDiscovery/discoveryLibrary";
import type { DiscoveryRecordDraft, DiscoveryReviewDecision, DiscoveryReviewEvidence } from "@/lib/infoDiscovery/sourceReview";

const EMPTY_DRAFT: DiscoveryRecordDraft = {
  title: "",
  authors: [],
  publicationYear: undefined,
  publisher: "",
  containerTitle: "",
  doi: "",
  canonicalUrl: "",
  sourceId: "",
  sourceName: "",
  abstract: "",
  materialType: "investigation-report",
  subjects: [],
  jurisdiction: "global",
  accessStatus: "unknown",
  license: "",
  rightsBasis: "",
  fullTextUrl: "",
};

const EMPTY_EVIDENCE: DiscoveryReviewEvidence = {
  bibliographicDetailsChecked: false,
  originalSourceChecked: false,
  versionAndCorrectionsChecked: false,
  rightsAndAccessChecked: false,
  jurisdictionAndPublicationDateChecked: false,
  findingsAndLegalStatusChecked: false,
  reviewNote: "",
  rightsBasis: "",
};

const STATUS_LABELS: Record<DiscoveryLibraryRecord["reviewStatus"], string> = {
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

export function DiscoveryLibraryPanel() {
  const [access, setAccess] = useState<DiscoveryLibraryAccess | null>(null);
  const [records, setRecords] = useState<DiscoveryLibraryRecord[]>([]);
  const [reviewHistory, setReviewHistory] = useState<DiscoveryReviewEvent[]>([]);
  const [openingDocument, setOpeningDocument] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DiscoveryRecordDraft>(EMPTY_DRAFT);
  const [authorsText, setAuthorsText] = useState("");
  const [subjectsText, setSubjectsText] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [evidence, setEvidence] = useState<DiscoveryReviewEvidence>(EMPTY_EVIDENCE);
  const [statusFilter, setStatusFilter] = useState<"all" | DiscoveryLibraryRecord["reviewStatus"]>("pending_review");

  const selectedRecord = useMemo(() => records.find(record => record.id === selectedId) || null, [records, selectedId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const currentAccess = await checkDiscoveryLibraryAccess();
      setAccess(currentAccess);
      if (!currentAccess.allowed) {
        setRecords([]);
        return;
      }
      const rows = await listDiscoveryLibraryRecords();
      setRecords(rows);
      setSelectedId(current => rows.some(row => row.id === current) ? current : (rows.find(row => row.reviewStatus === "pending_review")?.id || rows[0]?.id || ""));
    } catch (error: any) {
      toast.error(error?.message || "Unable to load the discovery library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!selectedRecord?.id) {
      setReviewHistory([]);
      return;
    }
    let active = true;
    listDiscoveryRecordReviewEvents(selectedRecord.id)
      .then(events => { if (active) setReviewHistory(events); })
      .catch(error => { if (active) toast.error(error?.message || "Unable to load review history."); });
    return () => { active = false; };
  }, [selectedRecord?.id]);

  const previewStoredDocument = async (recordId: string) => {
    setOpeningDocument(true);
    const popup = window.open("about:blank", "_blank");
    try {
      const url = await getDiscoveryDocumentReviewUrl(recordId);
      if (!url) throw new Error("No document file is attached to this record.");
      if (popup) popup.location.href = url;
      else throw new Error("The browser blocked the document window. Allow pop-ups and try again.");
    } catch (error: any) {
      popup?.close();
      toast.error(error?.message || "The document could not be opened.");
    } finally {
      setOpeningDocument(false);
    }
  };


  const setDraftField = <K extends keyof DiscoveryRecordDraft>(key: K, value: DiscoveryRecordDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const handleSourceChange = (sourceId: string) => {
    const source = DISCOVERY_SOURCES.find(item => item.id === sourceId);
    setDraft(current => ({
      ...current,
      sourceId,
      sourceName: source?.name || "",
      publisher: current.publisher || source?.publisher || "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const submitted = await submitDiscoveryRecord({
        ...draft,
        authors: authorsText.split(/[;,\n]/).map(value => value.trim()).filter(Boolean),
        subjects: subjectsText.split(/[;,\n]/).map(value => value.trim()).filter(Boolean),
      });
      if (documentFile) {
        try {
          await uploadDiscoveryDocument(submitted.id, documentFile, draft.rightsBasis);
        } catch (uploadError: any) {
          await refresh();
          toast.error("The metadata was added to the review queue, but the document upload failed: " + (uploadError?.message || "Upload failed."));
          return;
        }
      }
      toast.success("Added to the publication review queue. It is not public until verified.");
      setDraft(EMPTY_DRAFT);
      setAuthorsText("");
      setSubjectsText("");
      setDocumentFile(null);
      const fileInput = document.getElementById("discovery-document-upload") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "The publication could not be submitted.");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (decision: DiscoveryReviewDecision) => {
    if (!selectedRecord) return;
    setSaving(true);
    try {
      await reviewDiscoveryRecord(selectedRecord.id, decision, evidence);
      toast.success(decision === "verified" ? "Publication verified and made discoverable." : decision === "rejected" ? "Publication rejected." : "Publication withdrawn.");
      setEvidence(EMPTY_EVIDENCE);
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "The review decision could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const visibleRecords = statusFilter === "all" ? records : records.filter(record => record.reviewStatus === statusFilter);
  const pendingCount = records.filter(record => record.reviewStatus === "pending_review").length;
  const verifiedCount = records.filter(record => record.reviewStatus === "verified").length;

  if (loading && !access) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Checking discovery-library access…</CardContent></Card>;
  if (!access?.allowed) return (
    <Card>
      <CardHeader><CardTitle>Discovery Library</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">Administrator access required</p>
        <p className="text-sm text-muted-foreground">{access?.reason || "Sign in using an authorised Supabase Suite manager or super-admin account to manage this library."}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{records.length}</p><p className="text-xs text-muted-foreground">Catalogue records</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Awaiting review</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{verifiedCount}</p><p className="text-xs text-muted-foreground">Approved for discovery</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Submit an investigation report or publication</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title">
                <Input value={draft.title} onChange={e => setDraftField("title", e.target.value)} required placeholder="Publication or document title" />
              </Field>
              <Field label="Source institution or repository">
                <select value={draft.sourceId} onChange={e => handleSourceChange(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select a source</option>
                  {DISCOVERY_SOURCES.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}
                  <option value="other">Other verified institution</option>
                </select>
                {draft.sourceId === "other" && <Input className="mt-2" value={draft.sourceName} onChange={e => setDraftField("sourceName", e.target.value)} placeholder="Institution or repository name" required />}
              </Field>
              <Field label="Author(s) or contributors">
                <Input value={authorsText} onChange={e => setAuthorsText(e.target.value)} placeholder="Separate names with commas" />
              </Field>
              <Field label="Publisher or issuing institution">
                <Input value={draft.publisher} onChange={e => setDraftField("publisher", e.target.value)} required placeholder="Publisher" />
              </Field>
              <Field label="Publication year">
                <Input type="number" min="1000" max={new Date().getFullYear()+1} value={draft.publicationYear ?? ""} onChange={e => setDraftField("publicationYear", e.target.value ? Number(e.target.value) : undefined)} placeholder="Year" />
              </Field>
              <Field label="Journal, series or collection">
                <Input value={draft.containerTitle} onChange={e => setDraftField("containerTitle", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="DOI">
                <Input value={draft.doi} onChange={e => setDraftField("doi", e.target.value)} placeholder="10.xxxx/..." />
              </Field>
              <Field label="Material type">
                <select value={draft.materialType} onChange={e => setDraftField("materialType", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {["investigation-report","commission-report","public-inquiry-report","court-judgment","tribunal-decision","government-audit","official-inspection-report","investigative-journalism","research-report","policy-paper","publication","book","book-chapter","journal-article","thesis","dissertation","dataset","technical-document","other"].map(value => <option key={value} value={value}>{value.replace(/-/g," ")}</option>)}
                </select>
              </Field>
              <Field label="Original record URL">
                <Input type="url" value={draft.canonicalUrl} onChange={e => setDraftField("canonicalUrl", e.target.value)} required placeholder="https://..." />
              </Field>
              <Field label="Full-text URL (if permitted)">
                <Input type="url" value={draft.fullTextUrl} onChange={e => setDraftField("fullTextUrl", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Subjects">
                <Input value={subjectsText} onChange={e => setSubjectsText(e.target.value)} placeholder="Education, African history..." />
              </Field>
              <Field label="Jurisdiction or coverage">
                <Input value={draft.jurisdiction} onChange={e => setDraftField("jurisdiction", e.target.value)} placeholder="Ghana, West Africa, global..." />
              </Field>
              <Field label="Access status">
                <select value={draft.accessStatus} onChange={e => setDraftField("accessStatus", e.target.value as DiscoveryRecordDraft["accessStatus"])} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="unknown">Unknown</option><option value="metadata_only">Metadata only</option><option value="open_access">Open access</option><option value="restricted">Restricted</option>
                </select>
              </Field>
              <Field label="Licence">
                <Input value={draft.license} onChange={e => setDraftField("license", e.target.value)} placeholder="e.g. CC BY 4.0, publisher terms" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Abstract or description">
                  <Textarea rows={3} value={draft.abstract} onChange={e => setDraftField("abstract", e.target.value)} placeholder="Short description of the work" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Rights basis">
                  <Input value={draft.rightsBasis} onChange={e => setDraftField("rightsBasis", e.target.value)} placeholder="Licence, repository permission, or link-only basis" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Optional document file (PDF, EPUB or text, up to 50 MB)">
                  <Input id="discovery-document-upload" type="file" accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain" onChange={e => setDocumentFile(e.target.files?.[0] || null)} />
                </Field>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="max-w-2xl text-xs text-muted-foreground">New investigations, commission reports, court decisions and publications enter a private editorial queue. They remain hidden from public discovery until an authorised reviewer confirms the original institution, jurisdiction, publication date, document version, legal status, findings and access rights.</p>
              <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Add to review queue"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Investigation and publication editorial review queue</CardTitle>
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
              <option value="pending_review">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option><option value="all">All records</option>
            </select>
            <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="max-h-[620px] space-y-2 overflow-y-auto">
            {visibleRecords.length === 0 && <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No records in this queue.</p>}
            {visibleRecords.map(record => (
              <button type="button" key={record.id} onClick={() => { setSelectedId(record.id); setEvidence(EMPTY_EVIDENCE); }} className={"w-full rounded-lg border p-3 text-left transition " + (record.id === selectedId ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                <div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold leading-5">{record.title}</span><Badge variant={record.reviewStatus === "verified" ? "default" : "secondary"}>{STATUS_LABELS[record.reviewStatus]}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{record.publisher} · {record.publicationYear || "Year unknown"}</p>
              </button>
            ))}
          </div>

          {selectedRecord ? (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <h3 className="font-semibold">{selectedRecord.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{[selectedRecord.authors.join(", "), selectedRecord.publisher, selectedRecord.containerTitle, selectedRecord.publicationYear].filter(Boolean).join(" · ")}</p>
                <p className="mt-2 text-xs text-muted-foreground">Source: {selectedRecord.sourceName} · Access: {selectedRecord.accessStatus} · Licence: {selectedRecord.license || "Not recorded"}</p>
                <a href={selectedRecord.canonicalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline">Open original record</a>
                {selectedRecord.storagePath && <p className="mt-2 text-xs text-muted-foreground">Stored document: {selectedRecord.storageMimeType} · {Math.round((selectedRecord.storageSize || 0)/1024)} KB (private until approved)</p>}
              </div>

              {selectedRecord.reviewNote && <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Previous review note: {selectedRecord.reviewNote}</p>}

              {selectedRecord.storagePath && (
                <Button type="button" size="sm" variant="outline" onClick={() => void previewStoredDocument(selectedRecord.id)} disabled={openingDocument}>
                  {openingDocument ? "Preparing document…" : "Open attached document"}
                </Button>
              )}
              {reviewHistory.length > 0 && (
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-sm font-semibold">Review history</p>
                  {reviewHistory.map(event => (
                    <div key={event.id} className="rounded-md bg-muted/40 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium">{event.action.replace(/-/g, " ")}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                      {event.note && <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>}
                    </div>
                  ))}
                </div>
              )}

              {selectedRecord.reviewStatus !== "verified" && (
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-sm font-semibold">Verification checklist</p>
                  {([
                    ["bibliographicDetailsChecked","Bibliographic details checked"],
                    ["originalSourceChecked","Original publisher or repository checked"],
                    ["versionAndCorrectionsChecked","Version, date and corrections checked"],
                    ["rightsAndAccessChecked","Access and reuse rights checked"],
                    ["jurisdictionAndPublicationDateChecked","Jurisdiction, issuing institution and publication date checked"],
                    ["findingsAndLegalStatusChecked","Allegations, findings, recommendations, charges and judgments distinguished"],
                  ] as const).map(([key,label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={evidence[key]} onChange={e => setEvidence(current => ({...current,[key]:e.target.checked}))} />
                      {label}
                    </label>
                  ))}
                  <Field label="Rights basis confirmed">
                    <Input value={evidence.rightsBasis} onChange={e => setEvidence(current => ({...current,rightsBasis:e.target.value}))} placeholder="Licence or permission reference" />
                  </Field>
                  <Field label="Reviewer note">
                    <Textarea rows={3} value={evidence.reviewNote} onChange={e => setEvidence(current => ({...current,reviewNote:e.target.value}))} placeholder="What was checked and any limitations" />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void handleReview("verified")} disabled={saving}>Verify and publish</Button>
                    <Button size="sm" variant="outline" onClick={() => void handleReview("rejected")} disabled={saving}>Reject</Button>
                  </div>
                </div>
              )}
              {selectedRecord.reviewStatus === "verified" && (
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-sm font-semibold">Approved for public discovery</p>
                  <p className="text-xs text-muted-foreground">The record is visible to public search. Withdraw it if a correction, rights issue or publication status change is identified.</p>
                  <Field label="Withdrawal note">
                    <Textarea rows={2} value={evidence.reviewNote} onChange={e => setEvidence(current => ({...current,reviewNote:e.target.value}))} placeholder="Reason for withdrawal" />
                  </Field>
                  <Button size="sm" variant="destructive" onClick={() => void handleReview("withdrawn")} disabled={saving || !evidence.reviewNote.trim()}>Withdraw publication</Button>
                </div>
              )}
            </div>
          ) : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Select a publication to inspect its details and review history.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
