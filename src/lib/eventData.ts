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
};

export const webinarEvents: PublicWebinar[] = [
  {
    id: "AGE-2027-001",
    slug: "travel-abroad-relocation-webinar",
    title: "Traveling Abroad and Relocation Webinar",
    theme: "Exploring employment, studies, business, and other pathway opportunities.",
    description: "An online conversation exploring international employment, study, business and other pathways, alongside important considerations for people thinking about travel or relocation.",
    format: "Online webinar",
    eventDate: "30 January 2027",
    registrationOpens: "1 December 2026",
    earlyBirdEnds: "20 December 2026",
    regularRegistration: "21 December 2026 – 24 January 2027",
    status: "upcoming",
    // Connect the designated Google Form here when its exact URL is supplied.
    registrationUrl: "",
  },
];

export const currentWebinar = webinarEvents[0];
