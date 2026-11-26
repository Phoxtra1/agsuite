import { Link, Navigate, useParams } from "react-router-dom";
import { webinarEvents } from "@/lib/eventData";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Video } from "lucide-react";

export default function WebinarProgramPage() {
  const { slug } = useParams();
  const event = webinarEvents.find(item => item.slug === slug);
  if (!event) return <Navigate to="/event/webinars" replace />;

  const registrationAvailable = Boolean(event.registrationUrl);
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101D32] px-5 py-14 text-white sm:py-20">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <Link to="/event/webinars" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All webinars</Link>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-200"><Video className="h-4 w-4" /> Amineva Global Webinar</div>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{event.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">{event.theme}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {registrationAvailable ? (
              <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">Register Now</a>
            ) : (
              <a href="#registration" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">Register Now <ArrowRight className="h-4 w-4" /></a>
            )}
            <a href="#programme" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Explore programme</a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">About this programme</p>
            <h2 className="mt-3 text-2xl font-bold">A focused conversation with useful perspectives</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{event.description}</p>
          </article>
          <article id="programme" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Programme content</p>
            <h2 className="mt-3 text-2xl font-bold">What we will explore</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(event.programHighlights?.length ? event.programHighlights : ["Key themes and questions related to this programme", "Perspectives and practical considerations", "Participant discussion and questions", "Information to support informed decisions"]).map(item => (
                <div key={item} className="flex gap-3 rounded-xl border border-border p-4 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-500" />{item}</div>
              ))}
            </div>
          </article>
          {event.audience?.length ? (
            <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Who should participate</p>
              <h2 className="mt-3 text-2xl font-bold">Who this webinar is for</h2>
              <ul className="mt-5 space-y-3">{event.audience.map(item => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-500" />{item}</li>)}</ul>
            </article>
          ) : null}
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Programme details</p>
          <h2 className="mt-3 text-lg font-bold">{event.title}</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" /><div><p className="text-muted-foreground">Date</p><p className="mt-1 font-semibold">{event.eventDate}</p></div></div>
            <div><p className="text-muted-foreground">Format</p><p className="mt-1 font-semibold">{event.format}</p></div>
            <div><p className="text-muted-foreground">Registration opens</p><p className="mt-1 font-semibold">{event.registrationOpens}</p></div>
          </div>
          <div id="registration" className="mt-6 border-t border-border pt-5">
            {registrationAvailable ? (
              <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">Register Now <ExternalLink className="h-4 w-4" /></a>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">The official Google Forms registration link will be connected here.</p>
            )}
          </div>
          <Link to="/event/webinars" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Browse all webinars</Link>
        </aside>
      </section>
    </main>
  );
}
