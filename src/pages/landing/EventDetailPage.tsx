import { Link } from "react-router-dom";
import { currentWebinar } from "@/lib/eventData";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, GraduationCap, MessageCircle, ShieldCheck, Video, Plane, BriefcaseBusiness, BookOpen } from "lucide-react";

const discussionAreas = [
  {
    title: "Employment Opportunities",
    icon: BriefcaseBusiness,
    description: "Explore international employment pathways, how to assess opportunities and the importance of understanding role requirements, eligibility and the process involved.",
  },
  {
    title: "Study Opportunities",
    icon: GraduationCap,
    description: "Consider overseas education options, programme selection, entry requirements and the preparation involved in pursuing studies abroad.",
  },
  {
    title: "Business Opportunities",
    icon: BookOpen,
    description: "Explore business-related pathways and the need to understand local conditions, applicable rules, resources and practical considerations before committing.",
  },
  {
    title: "Other Pathway Opportunities",
    icon: Compass,
    description: "Discuss other possible routes and the importance of checking the relevant requirements, credibility of information and suitability of each option.",
  },
];

const audience = [
  "Students and graduates exploring international study or career options",
  "Job seekers and professionals considering employment opportunities abroad",
  "Entrepreneurs and business-minded individuals exploring international possibilities",
  "Individuals and families considering travel or relocation",
  "Anyone seeking a clearer understanding of international pathways and the decisions involved",
];

export default function EventDetailPage() {
  const registrationUrl = currentWebinar.registrationUrl;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101D32] px-5 py-16 text-white sm:py-20 lg:py-24">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <Link to="/event/webinars" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All webinars</Link>
          <div className="mt-9 max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> Amineva Global Webinar</span>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Travel · Employment · Education · Business</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Travel Abroad and Relocation Webinar</h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-100">Exploring employment, studies, business, and other pathway opportunities.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {registrationUrl ? (
                <a href={registrationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-extrabold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-300">Register Now <ArrowRight className="h-5 w-5" /></a>
              ) : (
                <button type="button" disabled aria-disabled="true" title="The official registration form link has not been connected yet." className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-extrabold text-slate-950 opacity-80">Register Now <ArrowRight className="h-5 w-5" /></button>
              )}
              <a href="#webinar-overview" className="inline-flex items-center rounded-xl border border-white/25 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10">Explore webinar details</a>
            </div>
          </div>
        </div>
      </section>

      <section id="webinar-overview" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:py-18">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.34fr]">
          <div className="space-y-12">
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">About the webinar</p>
              <h2 className="mt-3 text-3xl font-bold">Understand the possibilities. Consider the pathways. Make informed decisions.</h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground">Travelling or relocating abroad can involve important decisions about employment, education, business and personal circumstances. People often need to understand what opportunities may exist, what requirements apply, how to prepare and how to assess the information they receive. This webinar creates a space to explore these subjects in one guided conversation.</p>
              <p className="mt-4 text-sm leading-8 text-muted-foreground">Through relevant contributions and participant discussion, the programme will consider different international pathways and the practical questions people should ask before making decisions. The aim is to support awareness and informed consideration—not to promise jobs, admission, visas, business success or relocation outcomes.</p>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">What the webinar will explore</p>
              <h2 className="mt-3 text-2xl font-bold">Four areas of discussion</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {discussionAreas.map(({title,icon:Icon,description}) => <article key={title} className="rounded-2xl border border-border bg-card p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p></article>)}
              </div>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Who should attend</p>
              <h2 className="mt-3 text-2xl font-bold">For people exploring their next steps</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {audience.map(item => <li key={item} className="flex gap-3 rounded-xl border border-border bg-card p-4 text-sm leading-7 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-500" />{item}</li>)}
              </ul>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">What participants can gain</p>
              <h2 className="mt-3 text-2xl font-bold">A clearer basis for asking the right questions</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[{icon:Compass,title:"Pathway awareness",body:"A broader view of employment, study, business and other international pathways."},{icon:MessageCircle,title:"Relevant perspectives",body:"An opportunity to hear contributions and engage with questions on the subject."},{icon:ShieldCheck,title:"Careful assessment",body:"A reminder to verify information, understand requirements and be cautious of misleading claims."},{icon:Plane,title:"Better preparation",body:"Greater awareness of the practical considerations involved in travel and relocation decisions."}].map(({icon:Icon,title,body})=><article key={title} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-amber-600 dark:text-amber-400"/><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p></article>)}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Guest contributors</p>
              <h2 className="mt-3 text-2xl font-bold">Knowledge and experience from relevant fields</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Confirmed speakers, facilitators and contributor profiles will be published here when participation is finalised.</p>
              <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">Guest contributors: To be announced.</div>
            </section>

            <section className="rounded-3xl border border-border bg-muted/30 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Programme information</p>
              <h2 className="mt-3 text-2xl font-bold">Event schedule and participation</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">The date, time, online participation details and session programme will be published here once confirmed. Please check this page for updates before the webinar.</p>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Event at a glance</p>
            <h2 className="mt-3 text-xl font-bold">Travel Abroad and Relocation Webinar</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-muted-foreground">Format</dt><dd className="mt-1 font-semibold">Online webinar</dd></div>
              <div><dt className="text-muted-foreground">Theme</dt><dd className="mt-1 leading-6 font-medium">Exploring employment, studies, business, and other pathway opportunities.</dd></div>
              <div><dt className="text-muted-foreground">Date and time</dt><dd className="mt-1 font-medium">To be announced</dd></div>
              <div><dt className="text-muted-foreground">Guest contributors</dt><dd className="mt-1 font-medium">To be announced</dd></div>
            </dl>
            <button type="button" disabled aria-disabled="true" title="The official registration form link has not been connected yet." className="mt-7 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground opacity-70">Register Now <ArrowRight className="h-4 w-4" /></button>
          </aside>
        </div>
      </section>

      <section id="registration" className="scroll-mt-20 border-t border-border bg-[#101D32] px-5 py-14 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Registration</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Take part in the conversation.</h2>
          {registrationUrl ? (
            <>
              <p className="mt-4 text-sm leading-7 text-slate-300">Complete the registration form to express your interest in participating in this webinar.</p>
              <a href={registrationUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">Register Now <ArrowRight className="h-4 w-4" /></a>
            </>
          ) : (
            <p className="mt-4 text-sm leading-7 text-slate-300">Registration will open when the event form is published. The registration button is ready to connect to the official form once its link is provided.</p>
          )}
          <div className="mt-8"><Link to="/event" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Back to Amineva Global Events</Link></div>
        </div>
      </section>
    </main>
  );
}
