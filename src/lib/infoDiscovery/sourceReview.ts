export type DiscoveryAccessStatus = "metadata_only" | "open_access" | "restricted" | "unknown";
export type DiscoveryReviewDecision = "verified" | "rejected" | "withdrawn";

export type DiscoveryRecordDraft = {
  title: string;
  authors: string[];
  publicationYear?: number;
  publisher: string;
  containerTitle: string;
  doi: string;
  canonicalUrl: string;
  sourceId: string;
  sourceName: string;
  abstract: string;
  materialType: string;
  subjects: string[];
  jurisdiction: string;
  accessStatus: DiscoveryAccessStatus;
  license: string;
  rightsBasis: string;
  fullTextUrl: string;
};

export type DiscoveryReviewEvidence = {
  bibliographicDetailsChecked: boolean;
  originalSourceChecked: boolean;
  versionAndCorrectionsChecked: boolean;
  rightsAndAccessChecked: boolean;
  reviewNote: string;
  rightsBasis: string;
};

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normaliseDoi(value: string): string {
  return value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").toLowerCase();
}

export function validateDiscoveryRecordDraft(draft: DiscoveryRecordDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push("A publication or document title is required.");
  if (!draft.publisher.trim()) errors.push("Publisher or issuing institution is required.");
  if (!draft.sourceId.trim() || !draft.sourceName.trim()) errors.push("The originating source must be identified.");
  if (!isHttpUrl(draft.canonicalUrl)) errors.push("The original record URL must be a valid HTTP or HTTPS address.");
  if (draft.fullTextUrl.trim() && !isHttpUrl(draft.fullTextUrl)) errors.push("The full-text URL must be a valid HTTP or HTTPS address.");
  if (draft.doi.trim() && !/^10\.\d{4,9}\/[\S]+$/i.test(normaliseDoi(draft.doi))) errors.push("The DOI does not appear to be valid.");
  if (draft.publicationYear !== undefined && (!Number.isInteger(draft.publicationYear) || draft.publicationYear < 1000 || draft.publicationYear > new Date().getFullYear() + 1)) {
    errors.push("The publication year is outside the accepted range.");
  }
  return errors;
}

export function validateDiscoveryReview(evidence: DiscoveryReviewEvidence): string[] {
  const errors: string[] = [];
  if (!evidence.bibliographicDetailsChecked) errors.push("Confirm the title, contributors, publisher and publication details.");
  if (!evidence.originalSourceChecked) errors.push("Check the original publisher or institutional repository record.");
  if (!evidence.versionAndCorrectionsChecked) errors.push("Check the document version, date and any corrections or withdrawals.");
  if (!evidence.rightsAndAccessChecked) errors.push("Confirm the access conditions and rights to link to or distribute the document.");
  if (!evidence.rightsBasis.trim()) errors.push("Record the licence, permission or other rights basis.");
  if (!evidence.reviewNote.trim()) errors.push("A reviewer note is required.");
  return errors;
}
