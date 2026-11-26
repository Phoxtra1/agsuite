export type PublicWebinar = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  description: string;
  format: "Online webinar";
  eventDate: string;
  registrationOpens: string;
  earlyBirdEnds: string;
  regularRegistration: string;
  status: "upcoming" | "registration-open" | "completed";
  registrationUrl: string;
  programHighlights?: string[];
  audience?: string[];
};

export const webinarEvents: PublicWebinar[] = [
  {
    id: "AGE-2027-001",
    slug: "travel-abroad-relocation-webinar",
    title: "Travelling Abroad and Relocation Webinar",
    theme: "Exploring employment, studies, business, and other pathway opportunities.",
    description: "An online conversation exploring international employment, study, business and other pathways, alongside important considerations for people thinking about travel or relocation",
    format: "Online webinar",
    eventDate: "30 January 2027",
    registrationOpens: "1 December 2026",
    earlyBirdEnds: "20 December 2026",
    regularRegistration: "21 December 2026 – 24 January 2027",
    status: "upcoming",
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
  },
];

export const currentWebinar = webinarEvents[0];
