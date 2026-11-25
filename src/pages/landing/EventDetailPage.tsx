import { Link } from "react-router-dom";
import { currentWebinar } from "@/lib/eventData";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, GraduationCap, MessageCircle, ShieldCheck, Video, Plane, Briefcase, BookOpen } from "lucide-react";

const discussionAreas = [
  {
    title: "Employment Opportunities",
    icon: Briefcase,
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
          <div className="flex items-center justify-between gap-4">
            <Link to="/event/webinars" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All webinars</Link>

          </div>
          <div className="mt-9 max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> Amineva Global Webinar</span>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Travel · Employment · Education · Business</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Travelling Abroad and Relocation Webinar</h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-100">Exploring employment, studies, business, and other pathway opportunities.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {registrationUrl ? <a href={registrationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">Register Now <ArrowRight className="h-4 w-4" /></a> : <a href="#registration" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">Register Now <ArrowRight className="h-4 w-4" /></a>}
              <a href="#webinar-overview" className="inline-flex items-center rounded-xl border border-white/25 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10">View programme details</a>
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
              <p className="mt-3 text-sm leading-7 text-muted-foreground">The webinar is scheduled for 30 January 2027. Registration opens on 1 December 2026. Early-bird registration runs from 1 to 20 December 2026, followed by regular registration from 21 December 2026 to 24 January 2027. The session time and online participation details will be published here once confirmed.</p>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Event at a glance</p>
            <h2 className="mt-3 text-xl font-bold">Traveling Abroad and Relocation Webinar</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-muted-foreground">Format</dt><dd className="mt-1 font-semibold">Online webinar</dd></div>
              <div><dt className="text-muted-foreground">Theme</dt><dd className="mt-1 leading-6 font-medium">Exploring employment, studies, business, and other pathway opportunities.</dd></div>
              <div><dt className="text-muted-foreground">Event date</dt><dd className="mt-1 font-medium">{currentWebinar.eventDate}</dd></div>
              <div><dt className="text-muted-foreground">Registration opens</dt><dd className="mt-1 font-medium">{currentWebinar.registrationOpens}</dd></div>
              <div><dt className="text-muted-foreground">Early-bird registration</dt><dd className="mt-1 font-medium">1–20 December 2026</dd></div>
              <div><dt className="text-muted-foreground">Regular registration</dt><dd className="mt-1 font-medium">{currentWebinar.regularRegistration}</dd></div>
              <div><dt className="text-muted-foreground">Guest contributors</dt><dd className="mt-1 font-medium">To be announced</dd></div>
            </dl>
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
            <p className="mt-4 text-sm leading-7 text-slate-300">Registration opens on 1 December 2026. The official registration form is being prepared and its link will be added here before registration opens.</p>
          )}
          <div className="mt-8"><Link to="/event" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Back to Amineva Global Events</Link></div>
        </div>
      </section>
    </main>
  );
}
