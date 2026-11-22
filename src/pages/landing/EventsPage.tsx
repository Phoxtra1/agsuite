import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Globe2, MessageSquareText, Video } from "lucide-react";

const eventTypes = [
  { title: "Webinars", description: "Online programmes that bring together useful information, professional perspectives and practical experiences.", icon: Video, href: "/explore/events/webinars", active: true },
  { title: "Seminars", description: "Focused learning and knowledge-sharing programmes.", icon: CalendarDays, active: false },
  { title: "Forums", description: "Facilitated discussions that bring people together to exchange perspectives on relevant subjects.", icon: MessageSquareText, active: false },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101D32] px-5 py-20 text-white sm:py-24">
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200"><Globe2 className="h-4 w-4" /> Amineva Global</span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Knowledge · Perspectives · Opportunities</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Events that inform, connect and inspire.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">Amineva Global events create space for people to explore important subjects, learn from relevant experience and engage in meaningful conversations about opportunities and decisions that matter.</p>
          <div className="mt-9"><a href="#event-formats" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">Explore upcoming event <ArrowRight className="h-4 w-4" /></a></div>
        </div>
      </section>
      <section id="event-formats" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Amineva Global events</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Choose an event format</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Explore the different formats through which Amineva Global brings people together.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {eventTypes.map(({ title, description, icon: Icon, href, active }) => {
            const card = <article className={`h-full rounded-2xl border p-6 shadow-sm transition ${active ? "border-amber-400/50 bg-card hover:-translate-y-1 hover:shadow-lg" : "border-border bg-card/70"}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
              {active && <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore webinars <ArrowRight className="h-4 w-4" /></span>}
            </article>;
            return active && href ? <Link key={title} to={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">{card}</Link> : <div key={title}>{card}</div>;
          })}
        </div>
      </section>
    </main>
  );
}
