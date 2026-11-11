import { afterEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/integrations/appwrite/client";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Opportunity Intel & Dipa Prospect Search adapter", () => {
  it("returns an actionable error when the shared Appwrite function ID is not configured", async () => {
    // CI tests must not depend on production deployment credentials or live services.
    vi.stubEnv("VITE_SUITE_FUNCTION_ID", "");

    const { data, error } = await supabase.functions.invoke("dipaOpportunitySearch", {
      body: {
        action: "dipaOpportunitySearch",
        query: "Ghana Investment",
        sector: "Government & Investment",
        region: "Greater Accra",
      },
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
    expect(error.message).toContain("VITE_SUITE_FUNCTION_ID");
  });
});
