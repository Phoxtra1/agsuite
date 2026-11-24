import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Video } from "lucide-react";

const currentWebinar = {
  title: "Travel Abroad and Relocation Webinar",
  theme: "Exploring employment, studies, business, and other pathway opportunities.",
  description: "An online conversation exploring international employment, study, business and other pathways, alongside important considerations for people thinking about travel or relocation.",
  href: "/event/travel-abroad-relocation-webinar",
};

export default function WebinarEventsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-[#101D32] px-5 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link to="/event" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All events</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-amber-200">Amineva Global Events</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Webinars</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Our webinars bring people together online to explore focused subjects, hear relevant perspectives and take part in meaningful discussion.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Current programme</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Upcoming Webinar</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Select the webinar to review its subject, intended audience and participation information.</p>
        </div>
        <article className="overflow-hidden rounded-3xl border border-amber-400/40 bg-card shadow-sm">
          <div className="bg-[#101D32] p-7 text-white sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> Online webinar</span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Amineva Global presents</p>
            <h3 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{currentWebinar.title}</h3>
            <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-slate-200">{currentWebinar.theme}</p>
          </div>
          <div className="p-7 sm:p-9">
            <p className="text-sm leading-7 text-muted-foreground">{currentWebinar.description}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CalendarDays className="h-4 w-4" /> Registration information on event page</span>
              <Link to={currentWebinar.href} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">View webinar and register <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </article>

        <section className="mt-14 border-t border-border pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">More to come</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Future Webinars</h2>
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/20 p-7 sm:p-9">
            <h3 className="text-lg font-semibold">New webinar programmes will appear here.</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">Amineva Global will host webinars on different subjects over time. When a new webinar is announced, its title, theme, schedule and registration details will be listed in this section.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
