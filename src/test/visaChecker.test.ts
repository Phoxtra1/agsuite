import { describe, it, expect } from "vitest";
import { getOfficialVisaPortal } from "@/lib/infoDiscovery/visaChecker";

describe("Visa Checker Dynamic Portal Resolver", () => {
  it("resolves specific official immigration portal for known destination countries", () => {
    const uk = getOfficialVisaPortal("GH", "GB", "United Kingdom");
    expect(uk.portalName).toContain("GOV.UK");
    expect(uk.officialUrl).toBe("https://www.gov.uk/check-uk-visa");

    const ca = getOfficialVisaPortal("NG", "CA", "Canada");
    expect(ca.portalName).toContain("IRCC");
    expect(ca.officialUrl).toContain("canada.ca");

    const us = getOfficialVisaPortal("KE", "US", "United States");
    expect(us.portalName).toContain("U.S. Department of State");
    expect(us.officialUrl).toContain("travel.state.gov");
  });

  it("dynamically resolves official queries for any other global destination", () => {
    const br = getOfficialVisaPortal("GH", "BR", "Brazil");
    expect(br.destinationCode).toBe("BR");
    expect(br.destinationName).toBe("Brazil");
    expect(br.portalName).toContain("Brazil Official Immigration");
    expect(br.officialUrl).toContain("google.com/search");
    expect(br.guidanceText).toContain("Brazil");
  });
});
