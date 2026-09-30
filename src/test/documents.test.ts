import { describe, it, expect, beforeEach, vi } from "vitest";
import { invalidateShareToken, createDocument } from "@/lib/workspace/documents";
import { createSheet } from "@/lib/workspace/sheets/documents";
import { createDeck } from "@/lib/workspace/slides/documents";
import { createForm } from "@/lib/workspace/forms/documents";
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
});
