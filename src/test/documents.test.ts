import { describe, it, expect, beforeEach, vi } from "vitest";
import { invalidateShareToken, createDocument, getDocument, updateDocument } from "@/lib/workspace/documents";
import { createSheet, getSheet, updateSheet } from "@/lib/workspace/sheets/documents";
import { createDeck, getDeck, updateDeck } from "@/lib/workspace/slides/documents";
import { createForm, getFormById, updateForm } from "@/lib/workspace/forms/documents";
import { supabase } from "@/integrations/appwrite/client";

// Mock Supabase client
vi.mock("@/integrations/appwrite/client", () => {
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  const insertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Offline") }),
    }),
  });
  const fromMock = vi.fn().mockReturnValue({
    update: updateMock,
    insert: insertMock,
  });
  return {
    supabase: {
      from: fromMock,
    },
  };
});

describe("Amineva Workspace tools creation test suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should attempt to revoke/invalidate a share link by its token", async () => {
    const fromSpy = vi.spyOn(supabase, "from");
    const result = await invalidateShareToken("test-share-token-123");

    expect(fromSpy).toHaveBeenCalledWith("workspace_document_shares");
    expect(result).toBe(true);
  });

  it("should create document, sheet, slide, and form successfully even when offline or unauthenticated", async () => {
    const doc = await createDocument("Test Doc");
    expect(doc).toBeDefined();
    expect(doc.id).toBeDefined();
    expect(doc.title).toBe("Test Doc");

    const sheet = await createSheet("Test Sheet");
    expect(sheet).toBeDefined();
    expect(sheet.id).toBeDefined();
    expect(sheet.title).toBe("Test Sheet");

    const deck = await createDeck("Test Slide");
    expect(deck).toBeDefined();
    expect(deck.id).toBeDefined();
    expect(deck.title).toBe("Test Slide");

    const form = await createForm("Test Form");
    expect(form).toBeDefined();
    expect(form.id).toBeDefined();
    expect(form.title).toBe("Test Form");
  });

  it("should persist document, sheet, slide, and form modifications and restore them across refreshes", async () => {
    const doc = await createDocument("Persistent Doc");
    await updateDocument(doc.id, { title: "Updated Persistent Doc", content_text: "Saved content" });
    const fetchedDoc = await getDocument(doc.id);
    expect(fetchedDoc).toBeDefined();
    expect(fetchedDoc?.title).toBe("Updated Persistent Doc");
    expect(fetchedDoc?.content_text).toBe("Saved content");

    const sheet = await createSheet("Persistent Sheet");
    await updateSheet(sheet.id, { title: "Updated Persistent Sheet" });
    const fetchedSheet = await getSheet(sheet.id);
    expect(fetchedSheet).toBeDefined();
    expect(fetchedSheet?.title).toBe("Updated Persistent Sheet");

    const deck = await createDeck("Persistent Slide");
    await updateDeck(deck.id, { title: "Updated Persistent Slide" });
    const fetchedDeck = await getDeck(deck.id);
    expect(fetchedDeck).toBeDefined();
    expect(fetchedDeck?.title).toBe("Updated Persistent Slide");

    const form = await createForm("Persistent Form");
    await updateForm(form.id, { title: "Updated Persistent Form" });
    const fetchedForm = await getFormById(form.id);
    expect(fetchedForm).toBeDefined();
    expect(fetchedForm?.title).toBe("Updated Persistent Form");
  });
});
