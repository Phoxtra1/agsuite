import { describe, it, expect, beforeEach, vi } from "vitest";
import { invalidateShareToken } from "@/lib/workspace/documents";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => {
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  const fromMock = vi.fn().mockReturnValue({
    update: updateMock,
  });
  return {
    supabase: {
      from: fromMock,
    },
  };
});

describe("Amineva Docs document/sharing test suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should attempt to revoke/invalidate a share link by its token", async () => {
    const fromSpy = vi.spyOn(supabase, "from");
    const result = await invalidateShareToken("test-share-token-123");

    expect(fromSpy).toHaveBeenCalledWith("workspace_document_shares");
    expect(result).toBe(true);
  });
});
