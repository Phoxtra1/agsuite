import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Globe2, MessageSquareText, Video } from "lucide-react";

const eventTypes = [
  { title: "Webinars", description: "Online programmes that bring together useful information, professional perspectives and practical experiences.", icon: Video, active: true },
  { title: "Seminars", description: "Focused learning and knowledge-sharing programmes. Details will be published when a seminar is scheduled.", icon: CalendarDays, active: false },
  { title: "Forums", description: "Facilitated discussions that bring people together to exchange perspectives on relevant subjects.", icon: MessageSquareText, active: false },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101D32] px-5 py-20 text-white sm:py-24">
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            <Globe2 className="h-4 w-4" /> Amineva Global
          </span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Knowledge · Perspectives · Opportunities</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Events that inform, connect and inspire.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Amineva Global events create space for people to explore important subjects, learn from relevant experience and engage in meaningful conversations about opportunities and decisions that matter.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#upcoming-events" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">Explore upcoming event <ArrowRight className="h-4 w-4" /></a>
            <Link to="/explore/appointments" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Book an appointment</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Our event formats</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Different ways to engage</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Our events are organised in formats suited to their purpose. The format, participation arrangements and registration details will be stated on each event page.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {eventTypes.map(({ title, description, icon: Icon, active }) => (
            <article key={title} className={`rounded-2xl border p-6 shadow-sm ${active ? "border-amber-400/50 bg-card shadow-amber-500/5" : "border-border bg-card/70"}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
              <div className="mt-5 flex items-center gap-2">
                <h3 className="text-xl font-bold">{title}</h3>
                {active ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Current format</span> : <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Future programmes</span>}
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="upcoming-events" className="border-y border-border bg-muted/30 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">What’s coming up</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Upcoming event</h2>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Registration details to follow</span>
          </div>
          <article className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-lg lg:grid-cols-[1.05fr_1fr]">
            <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-[#101D32] p-8 text-white sm:p-10">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full border border-amber-300/20" />
              <div className="absolute -right-2 top-0 h-48 w-48 rounded-full border border-amber-300/15" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> Online webinar</span>
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Amineva Global presents</p>
                <h3 className="mt-3 max-w-lg text-3xl font-bold leading-tight sm:text-4xl">Career, Travel &amp; Relocation Webinar</h3>
                <p className="mt-4 text-sm text-slate-300">2027 edition</p>
              </div>
              <p className="relative mt-10 text-sm font-medium text-slate-200">Explore Your Potentials, Discover Global Opportunities.</p>
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Upcoming · 2027</span>
              <h3 className="mt-3 text-2xl font-bold">Explore pathways. Understand possibilities. Make informed decisions.</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">An online discussion programme exploring career development and education alongside travel and relocation opportunities. Hear relevant perspectives, learn from experience and bring your questions into the conversation.</p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2"><Video className="h-4 w-4" /> Online participation</span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2"><CalendarDays className="h-4 w-4" /> Date to be announced</span>
              </div>
              <Link to="/explore/events/career-travel-relocation-2027" className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">View event details <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </article>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-20">
        <h2 className="text-2xl font-bold sm:text-3xl">Stay connected with Amineva Global</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Explore our programmes and return to this page for new event announcements, registration information and participation updates.</p>
      </section>
    </main>
  );
}
