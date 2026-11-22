import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Video } from "lucide-react";

// Add future webinar entries here; all entries share this reusable card layout.
const webinars = [
  { title: "Career, Travel & Relocation Webinar", year: "2027", format: "Online webinar", theme: "Explore Your Potentials, Discover Global Opportunities.", description: "An online programme exploring career development and education alongside travel and relocation opportunities.", href: "/explore/events/career-travel-relocation-2027", status: "Current event" },
];

export default function WebinarEventsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-[#101D32] px-5 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link to="/explore/events" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All event formats</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-amber-200">Amineva Global events</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Webinars</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Explore Amineva Global webinar programmes and open the details of the event you are interested in.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Webinar programmes</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Current webinars</h2></div>
        <div className="grid gap-6 md:grid-cols-2">
          {webinars.map(event => <article key={event.title} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="bg-[#101D32] p-7 text-white sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> {event.format}</span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Amineva Global presents</p>
              <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{event.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{event.year} edition</p>
              <p className="mt-6 text-sm font-medium leading-6 text-slate-200">{event.theme}</p>
            </div>
            <div className="p-7 sm:p-8">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CalendarDays className="h-4 w-4" /> {event.status}</span>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{event.description}</p>
              <Link to={event.href} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">View event details <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </article>)}
        </div>
      </section>
    </main>
  );
}
