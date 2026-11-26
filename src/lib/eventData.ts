export type RegistrationState = "not-live" | "live" | "closed" | "full" | "completed";

export type PublicWebinar = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  description: string;
  format: "Online webinar";
  eventDate: string;
  eventDateISO: string;
  registrationOpens: string;
  registrationOpensISO: string;
  earlyBirdEnds: string;
  regularRegistration: string;
  registrationClosesISO: string;
  capacity: number;
  capacityStatus: "available" | "full";\n  status: "upcoming" | "registration-open" | "completed";
  registrationUrl: string;
  programHighlights?: string[];
  audience?: string[];
};

export function getRegistrationState(event: PublicWebinar, now = new Date()): RegistrationState {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;

  if (today > event.eventDateISO) return "completed";
  if (event.capacityStatus === "full") return "full";
  if (today < event.registrationOpensISO) return "not-live";
  if (today > event.registrationClosesISO) return "closed";
  return "live";
}

export const registrationStateLabel: Record<RegistrationState, string> = {
  "not-live": "NOT LIVE",
  live: "LIVE",
  closed: "CLOSED",
  full: "FULL",
  completed: "COMPLETED",
};

export const webinarEvents: PublicWebinar[] = [{
  id: "AGE-2027-001",
  slug: "travel-abroad-relocation-webinar",
  title: "Travelling Abroad and Relocation Webinar",
  theme: "Exploring employment, studies, business, and other pathway opportunities.",
  description: "An online conversation exploring international employment, study, business and other pathways, alongside important considerations for people thinking about travel or relocation",
  format: "Online webinar",
  eventDate: "30 January 2027",
  eventDateISO: "2027-01-30",
  registrationOpens: "1 December 2026",
  registrationOpensISO: "2026-12-01",
  earlyBirdEnds: "20 December 2026",
  regularRegistration: "21 December 2026 – 24 January 2027",
  registrationClosesISO: "2027-01-24",
  capacity: 100,
  capacityStatus: "available",\n  status: "upcoming",
  registrationUrl: "https://bit.ly/4zNBs1g",
  programHighlights: [
    "Employment opportunities and how to assess them",
    "Study pathways, programme selection and entry requirements",
    "Business opportunities and practical considerations",
    "Travel, relocation and responsible pathway assessment",
  ],
  audience: [
    "Students and graduates exploring international study or career options",
    "Job seekers and professionals considering employment abroad",
    "Entrepreneurs exploring international business possibilities",
    "Individuals and families considering travel or relocation",
  ],
}];

export const currentWebinar = webinarEvents[0];
