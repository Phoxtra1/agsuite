import { Link } from "react-router-dom";
import { webinarEvents } from "@/lib/eventData";
import { ArrowRight, CalendarDays, Video, ExternalLink } from "lucide-react";

export default function WebinarEventsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-[#101D32] px-5 py-14 text-white sm:py-18">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Link to="/event" className="inline-flex items-center text-sm font-medium text-slate-300 transition hover:text-white">← All events</Link>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-200"><Video className="h-4 w-4" /> Amineva Global programmes</div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Webinars</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">Explore upcoming online conversations, discover each programme, and register when you are ready to participate.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Upcoming programmes</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Find a webinar</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">New programmes will appear here as they are announced. Each webinar has its own programme page.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {webinarEvents.filter(event => event.status !== "completed").map(event => {
            const programPath = event.slug === "travel-abroad-relocation-webinar" ? "/event/travel-abroad-relocation-webinar" : `/event/webinars/${event.slug}`;
            const isRegistrationAvailable = Boolean(event.registrationUrl);
            return (
              <article key={event.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-lg">
                <div className="h-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Video className="h-3.5 w-3.5" /> Online webinar</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{event.status === "registration-open" ? "Registration open" : "Upcoming"}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold leading-snug group-hover:text-primary">{event.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.theme}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground"><CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />{event.eventDate}</div>
                  <div className="mt-auto pt-7">
                    <div className="grid gap-3">
                      {isRegistrationAvailable ? (
                        <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">Register Now <ExternalLink className="h-4 w-4" /></a>
                      ) : (
                        <button type="button" disabled title="The official Google Form link will be connected here." className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-amber-400/70 px-4 py-3 text-sm font-extrabold text-slate-950/80">Register Now</button>
                      )}
                      <Link to={programPath} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:border-primary/50 hover:bg-muted">View Program <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    {!isRegistrationAvailable && <p className="mt-3 text-center text-xs text-muted-foreground">Registration form link will be added here.</p>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {webinarEvents.filter(event => event.status !== "completed").length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">New webinars will be announced here.</div>
        )}
      </section>
    </main>
  );
}
