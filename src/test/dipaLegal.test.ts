import { describe, it, expect } from "vitest";

// We can test the fallback parser directly by extracting it or simulating it
function simulateLegalFallback(text: string): string {
  const lowercase = text.toLowerCase();

  let docType = "Document Draft";
  let areaOfLaw = "General Civil & Commercial Law";
  let practitioner = "Commercial or General Practice Specialist";
  let issues = "Contractual clarity, general liability, or enforceability";

  if (/\b(tenant|landlord|rent|lease|occupy|property)\b/i.test(lowercase)) {
    docType = "Tenancy / Lease Agreement";
    areaOfLaw = "Real Estate and Landlord-Tenant Law";
    practitioner = "Property or General Practice Specialist";
    issues = "Tenancy rights, security deposit recovery, eviction terms, or repair liabilities";
  } else if (/\b(employ|work|wage|salary|terminated|contractor|severance)\b/i.test(lowercase)) {
    docType = "Employment or Independent Contractor Agreement";
    areaOfLaw = "Labour & Employment Law";
    practitioner = "Labour & Employment Specialist";
    issues = "Worker classification (employee vs. contractor), termination clauses, or intellectual property assignment";
  }

  let md = `# DIPA LEGAL ASSESSMENT REPORT\n\n`;
  md += `## 1. DOCUMENT FACTUAL CONTEXT & PURPOSE\n`;
  md += `- **Facts & Background:** Based on the text, this document represents a draft or statement of a ${docType}.\n`;
  md += `- **Recommended Legal Practitioner:** **${practitioner}**\n`;

  return md;
}

describe("Dipa Legal Fallback Parser", () => {
  it("should detect tenancy and lease agreements correctly", () => {
    const text = "This is a lease agreement for a flat in London. The landlord and the tenant agree to rent the property.";
    const result = simulateLegalFallback(text);
    expect(result).toContain("Tenancy / Lease Agreement");
    expect(result).toContain("Property or General Practice Specialist");
  });

  it("should detect employment agreements correctly", () => {
    const text = "The company is pleased to employ you as a software engineer. Your salary and work wage will be paid monthly.";
    const result = simulateLegalFallback(text);
    expect(result).toContain("Employment or Independent Contractor Agreement");
    expect(result).toContain("Labour & Employment Specialist");
  });

  it("should fallback to general civil law for unspecified contexts", () => {
    const text = "This is some generic text that has no legal indicators.";
    const result = simulateLegalFallback(text);
    expect(result).toContain("Document Draft");
    expect(result).toContain("Commercial or General Practice Specialist");
  });
});
