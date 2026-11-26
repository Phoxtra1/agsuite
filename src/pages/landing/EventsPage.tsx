import { Link } from "react-router-dom";
import { ArrowRight, Video, Users, MessagesSquare, Presentation, Wrench } from "lucide-react";
import { currentWebinar } from "@/lib/eventData";

const eventFormats = [
  { title: "Webinars", description: "Online programmes for focused learning and discussion.", icon: Video, href: "/event/webinars", active: true },
  { title: "Summits", description: "Gatherings for examining important issues and shared priorities.", icon: Users, active: false },
  { title: "Forums", description: "Spaces for exchanging views and engaging in discussion.", icon: MessagesSquare, active: false },
  { title: "Conferences", description: "Programmes featuring presentations and expert contributions.", icon: Presentation, active: false },
  { title: "Workshops", description: "Interactive sessions focused on exploring and developing practical understanding.", icon: Wrench, active: false },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-[#101D32] px-5 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Amineva Global Events</span>
            <a href={currentWebinar.registrationUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-950/25 transition hover:bg-amber-300">Register Now</a>
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Knowledge · Perspective · Opportunity</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Events that inform, connect and inspire.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">Amineva Global Events create space for people to explore important subjects, learn from relevant experience, and engage in meaningful conversation about opportunities and decisions that matter.</p>
        </div>
      </section>

      <section id="event-formats" className="px-5 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Video className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Explore our programmes</p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Event Formats</h2>
            </div>
          </div>
          <div className="event-format-track flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" aria-label="Browse event formats">
            {eventFormats.map(({ title, description, icon: Icon, href, active }) => {
              const card = (
                <article className={`flex h-full min-h-52 w-[245px] shrink-0 snap-start flex-col rounded-2xl border p-5 transition ${active ? "border-amber-400/50 bg-card shadow-sm hover:-translate-y-1 hover:shadow-lg" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                    {active && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Available</span>}
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
                  <span className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{active ? "Explore" : "View"} {active && <ArrowRight className="h-4 w-4" />}</span>
                </article>
              );
              return active && href ? <Link key={title} to={href} className="block">{card}</Link> : <div key={title} aria-disabled="true" className="cursor-default">{card}</div>;
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Swipe or scroll horizontally to browse the available event formats.</p>
        </div>
      </section>
    </main>
  );
}
