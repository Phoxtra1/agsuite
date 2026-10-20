import { describe, it, expect } from "vitest";
import { supabase } from "@/integrations/appwrite/client";

describe("Opportunity Intel & Dipa Prospect Search", () => {
  it("invokes dipaOpportunitySearch function and receives verified online prospects with live websites, valid emails, phone numbers, and IT/Data inquiries", async () => {
    const { data, error } = await supabase.functions.invoke("dipaOpportunitySearch", {
      body: {
        action: "dipaOpportunitySearch",
        query: "Ghana Investment",
        sector: "Government & Investment",
        region: "Greater Accra"
      }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) {
      expect(data.success).toBe(true);
      expect(data.prospects).toBeDefined();
      expect(Array.isArray(data.prospects)).toBe(true);
      expect(data.prospects.length).toBeGreaterThan(0);

      data.prospects.forEach((prospect: any) => {
        expect(prospect.organizationName).toBeDefined();
        expect(prospect.website).toMatch(/^https?:\/\//);
        expect(prospect.verified).toBe(true);
        expect(prospect.httpStatus).toBeGreaterThanOrEqual(200);
        expect(prospect.httpStatus).toBeLessThan(400);

        // Verify no junk contacts
        expect(prospect.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(prospect.phone).toMatch(/^\+?\d[\d\s-]{6,}$/);

        // Verify IT and Data service opportunity alignment
        const insight = prospect.opportunityInsight.toLowerCase();
        const hasITorDataService =
          insight.includes("it") ||
          insight.includes("data") ||
          insight.includes("cloud") ||
          insight.includes("server") ||
          insight.includes("inspection") ||
          insight.includes("telemetry") ||
          insight.includes("maintenance") ||
          insight.includes("documentation");
        expect(hasITorDataService).toBe(true);
      });
    }
  });
});
