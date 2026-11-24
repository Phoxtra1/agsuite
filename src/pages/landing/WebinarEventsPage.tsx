import { Link } from "react-router-dom";
import { currentWebinar } from "@/lib/eventData";
import { ArrowRight, CalendarDays, Video, Briefcase, GraduationCap, BookOpen, Compass, CheckCircle2, ShieldCheck, MessageCircle, Plane } from "lucide-react";

const discussionAreas = [
  { title: "Employment opportunities", icon: Briefcase, body: "Explore international employment pathways, how to assess opportunities, role requirements, eligibility and the processes involved." },
  { title: "Study opportunities", icon: GraduationCap, body: "Consider overseas education options, programme selection, entry requirements and the preparation involved in pursuing studies abroad." },
  { title: "Business opportunities", icon: BookOpen, body: "Explore business-related pathways and understand local conditions, applicable rules, resources and practical considerations before committing." },
  { title: "Other pathways", icon: Compass, body: "Consider other possible routes and the importance of checking requirements, verifying information and assessing personal suitability." },
];
const audience = [
  "Students and graduates exploring international study or career options",
  "Job seekers and professionals considering employment abroad",
  "Entrepreneurs exploring international business possibilities",
  "Individuals and families considering travel or relocation",
  "Anyone seeking a clearer understanding of international pathways",
];
const gains = [
  { icon: Compass, title: "Pathway awareness", body: "A broader understanding of employment, study, business and other international pathways." },
  { icon: MessageCircle, title: "Relevant perspectives", body: "An opportunity to hear informed contributions and engage with questions on the subject." },
  { icon: ShieldCheck, title: "Careful assessment", body: "Greater awareness of how to verify information, understand requirements and recognise misleading claims." },
  { icon: Plane, title: "Better preparation", body: "A clearer view of practical considerations involved in travel and relocation decisions." },
];

export default function WebinarEventsPage() {
  const registrationUrl = currentWebinar.registrationUrl;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <Link to="/event" className="text-sm font-medium text-muted-foreground hover:text-foreground">← All events</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Amineva Global Events</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Webinars</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Explore webinar programmes designed to help participants understand important subjects, consider available pathways and make better-informed decisions.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-2xl border border-amber-400/40 bg-card p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400"><Video className="h-4 w-4" /> Upcoming webinar</span>
            <h2 className="mt-2 text-xl font-bold">{currentWebinar.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{currentWebinar.theme}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"><CalendarDays className="h-4 w-4" /> {currentWebinar.eventDate}</p>
          </div>
          <Link to={`/event/${currentWebinar.slug}`} className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:mt-0">View programme <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">About this webinar</p>
          <h2 className="mt-3 text-3xl font-bold">Understand the possibilities. Consider the pathways. Make informed decisions.</h2>
          <p className="mt-5 text-sm leading-8 text-muted-foreground">Travelling or relocating abroad can involve important decisions about employment, education, business and personal circumstances. People need to understand what opportunities may exist, what requirements apply, how to prepare and how to assess the information they receive. This webinar creates a space to explore these subjects in one guided conversation.</p>
          <p className="mt-4 text-sm leading-8 text-muted-foreground">Through relevant contributions and participant discussion, the programme will consider different international pathways and the practical questions people should ask before making decisions. The aim is to support awareness and informed consideration—not to promise jobs, admission, visas, business success or relocation outcomes.</p>
        </div>

        <div className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Programme content</p>
          <h2 className="mt-2 text-2xl font-bold">What we will explore</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {discussionAreas.map(({title,icon:Icon,body}) => <article key={title} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-primary"/><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p></article>)}
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Who should participate</p>
            <h2 className="mt-2 text-2xl font-bold">Who is this webinar for?</h2>
            <ul className="mt-5 space-y-3">{audience.map(item=><li key={item} className="flex gap-3 text-sm leading-7 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-500"/>{item}</li>)}</ul>
          </section>
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Participant benefits</p>
            <h2 className="mt-2 text-2xl font-bold">What you can gain</h2>
            <div className="mt-5 space-y-4">{gains.map(({icon:Icon,title,body})=><article key={title} className="flex gap-3"><Icon className="mt-1 h-5 w-5 shrink-0 text-primary"/><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p></div></article>)}</div>
          </section>
        </div>

        <section className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
          <h2 className="text-xl font-bold">Programme details</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div><p className="text-muted-foreground">Webinar date</p><p className="mt-1 font-semibold">{currentWebinar.eventDate}</p></div>
            <div><p className="text-muted-foreground">Registration opens</p><p className="mt-1 font-semibold">{currentWebinar.registrationOpens}</p></div>
            <div><p className="text-muted-foreground">Format</p><p className="mt-1 font-semibold">Online webinar</p></div>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Early-bird registration: 1–20 December 2026. Regular registration: {currentWebinar.regularRegistration}. Session time and online participation details will be published once confirmed.</p>
          <div className="mt-6">
            {registrationUrl ? <a href={registrationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Register Now <ArrowRight className="h-4 w-4"/></a> : <p className="text-sm text-muted-foreground">The registration form link will be published when registration opens.</p>}
          </div>
        </section>
      </section>
    </main>
  );
}
