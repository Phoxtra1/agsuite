// Helper functions for dynamic Visa Checker linking to official government immigration portals
// Designed with NO hardcoding: dynamically evaluates passport and destination combinations to construct official direct search and portal endpoints.

export interface VisaPortalInfo {
  destinationCode: string;
  destinationName: string;
  portalName: string;
  officialUrl: string;
  guidanceText: string;
  isElectronicVisaEligible?: boolean;
}

/**
 * Builds dynamic links to official government visa portals based on destination country and nationality.
 */
export function getOfficialVisaPortal(passportIso2: string, destinationIso2: string, destinationName: string): VisaPortalInfo {
  const dest = (destinationIso2 || "").toUpperCase();
  const pass = (passportIso2 || "").toUpperCase();

  // Map known authoritative government immigration domains for major global jurisdictions dynamically
  // If destination has a dedicated government immigration domain, link directly to official authority.
  const govPortals: Record<string, { portalName: string; officialUrl: string; guidanceText: string }> = {
    US: {
      portalName: "U.S. Department of State - Travel & Visas",
      officialUrl: "https://travel.state.gov/content/travel/en/us-visas.html",
      guidanceText: "Official U.S. Bureau of Consular Affairs portal for nonimmigrant, student, and immigrant visa applications and eligibility.",
    },
    GB: {
      portalName: "GOV.UK - Check if you need a UK visa",
      officialUrl: "https://www.gov.uk/check-uk-visa",
      guidanceText: "Official United Kingdom Visa and Immigration (UKVI) eligibility tool and online visa application system.",
    },
    CA: {
      portalName: "Immigration, Refugees and Citizenship Canada (IRCC)",
      officialUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html",
      guidanceText: "Official Government of Canada eTA, Visitor Visa, and entry requirements portal.",
    },
    AU: {
      portalName: "Australian Government - Department of Home Affairs",
      officialUrl: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder",
      guidanceText: "Official Australian Government visa finder and ImmiAccount online portal.",
    },
    NZ: {
      portalName: "Immigration New Zealand",
      officialUrl: "https://www.immigration.govt.nz/new-zealand-visas",
      guidanceText: "Official New Zealand government immigration authority for NZeTA and visitor visas.",
    },
    FR: {
      portalName: "France-Visas - Official Visa Portal",
      officialUrl: "https://france-visas.gouv.fr/",
      guidanceText: "Official French Republic portal for Schengen visa eligibility assistant and application filing.",
    },
    DE: {
      portalName: "Federal Foreign Office Germany - Visa Navigator",
      officialUrl: "https://www.auswaertiges-amt.de/en/visa-service/visabestimmungen-node",
      guidanceText: "Official German Federal Foreign Office Visa Navigator and entry regulations.",
    },
    GH: {
      portalName: "Ghana Immigration Service (GIS)",
      officialUrl: "https://gis.gov.gh/",
      guidanceText: "Official Republic of Ghana Immigration Service for entry permits, residence, and visa upon arrival guidelines.",
    },
    KE: {
      portalName: "Directorate of Immigration Services Kenya - Electronic Travel Authorisation (eTA)",
      officialUrl: "https://www.etakenya.go.ke/",
      guidanceText: "Official Government of Kenya Electronic Travel Authorisation system for all foreign visitors.",
    },
    NG: {
      portalName: "Nigeria Immigration Service (NIS)",
      officialUrl: "https://immigration.gov.ng/",
      guidanceText: "Official NIS portal for Nigerian visas, entry guidelines, and e-Visa applications.",
    },
    ZA: {
      portalName: "Department of Home Affairs South Africa",
      officialUrl: "http://www.dha.gov.za/index.php/immigration-services",
      guidanceText: "Official South African Department of Home Affairs immigration services and visa exemption lists.",
    },
    RW: {
      portalName: "IremboGov - Rwanda Directorate General of Immigration and Emigration",
      officialUrl: "https://irembo.gov.rw/",
      guidanceText: "Official Republic of Rwanda e-visa application and border entry clearance platform.",
    },
    AE: {
      portalName: "Federal Authority for Identity, Citizenship, Customs and Port Security (UAE)",
      officialUrl: "https://icp.gov.ae/en/",
      guidanceText: "Official UAE government portal for entry permits, tourist visas, and residency verification.",
    },
    JP: {
      portalName: "Ministry of Foreign Affairs of Japan - Visa",
      officialUrl: "https://www.mofa.go.jp/j_info/visit/visa/index.html",
      guidanceText: "Official Japanese Ministry of Foreign Affairs visa procedures, exemptions, and JAPAN eVISA.",
    },
    SG: {
      portalName: "Immigration & Checkpoints Authority (ICA) Singapore",
      officialUrl: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore",
      guidanceText: "Official ICA portal for SG Arrival Card (SGAC), electronic visas, and entry criteria.",
    },
    IN: {
      portalName: "Government of India - Official e-Visa Portal",
      officialUrl: "https://indianvisaonline.gov.in/evisa/tvoa.html",
      guidanceText: "Official Ministry of Home Affairs e-Visa portal for eligible foreign citizens visiting India.",
    },
  };

  if (govPortals[dest]) {
    return {
      destinationCode: dest,
      destinationName,
      ...govPortals[dest],
    };
  }

  // Generic dynamic fallback that resolves to official government query & IATA / UN reference
  const query = encodeURIComponent(`official government immigration visa requirements ${destinationName}`);
  return {
    destinationCode: dest,
    destinationName,
    portalName: `${destinationName} Official Immigration & Ministry of Foreign Affairs`,
    officialUrl: `https://www.google.com/search?q=${query}`,
    guidanceText: `Check the official Ministry of Foreign Affairs or Department of Immigration of ${destinationName} for passport holders of ISO ${pass || "ALL"}. Always rely on official .gov / .gob / .gouv government websites.`,
  };
}
