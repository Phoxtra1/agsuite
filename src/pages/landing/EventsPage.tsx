import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MessagesSquare, Presentation, Video, Users, Wrench } from "lucide-react";

const currentEvent = {
  title: "Travel Abroad and Relocation Webinar",
  theme: "Exploring employment, studies, business, and other pathway opportunities.",
  description: "An online conversation to help participants explore international opportunities, understand important considerations and ask informed questions before making decisions about travel or relocation.",
  href: "/event/travel-abroad-relocation-webinar",
};

const eventFormats = [
  { title: "Webinars", description: "Online sessions that bring together relevant knowledge, experience and discussion around a focused subject.", icon: Video, href: "/event/webinars", active: true },
  { title: "Summits", description: "High-level gatherings that bring participants and contributors together to examine important issues, share perspectives and explore directions for action.", icon: Users, active: false },
  { title: "Forums", description: "Structured conversations where participants exchange views, raise questions and consider different perspectives on a shared subject.", icon: MessagesSquare, active: false },
  { title: "Conferences", description: "Organised programmes featuring presentations, expert contributions and discussions across a broader subject area.", icon: Presentation, active: false },
  { title: "Workshops", description: "Interactive sessions focused on developing understanding, working through challenges and building practical capabilities.", icon: Wrench, active: false },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101D32] px-5 py-16 text-white sm:py-20 lg:py-24">
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Amineva Global Events</span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Knowledge · Perspective · Opportunity</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Events that inform, connect and inspire.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">Amineva Global Events create space for people to explore important subjects, learn from relevant experience, and engage in meaningful conversation about opportunities and decisions that matter.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to={currentEvent.href + "#registration"} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">Register Now <ArrowRight className="h-4 w-4" /></Link>
            <a href="#upcoming-events" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Explore Upcoming Events <CalendarDays className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <section id="upcoming-events" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14 sm:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Coming up</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Explore Upcoming Events</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Find the details of our current programme and follow this page for future events.</p>
          </div>
          <Link to="/event/webinars" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Browse webinars <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <article className="overflow-hidden rounded-3xl border border-amber-400/40 bg-card shadow-sm">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-[#101D32] p-7 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> Current webinar</span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Amineva Global presents</p>
              <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">{currentEvent.title}</h3>
              <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-200">{currentEvent.theme}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={currentEvent.href} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300">View Webinar Details <ArrowRight className="h-4 w-4" /></Link>
                <Link to={currentEvent.href + "#registration"} className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Register Now</Link>
              </div>
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">About this webinar</p>
              <p className="mt-4 text-sm leading-8 text-muted-foreground">{currentEvent.description}</p>
              <p className="mt-5 text-xs leading-6 text-muted-foreground">Date, time, guest contributors and registration arrangements will be displayed on the event details page once confirmed.</p>
            </div>
          </div>
        </article>
      </section>

      <section id="event-formats" className="border-t border-border bg-muted/20 px-5 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">How we bring people together</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Choose an Event Format</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Each format serves a different purpose. Select an available format to explore its programmes. Other formats will be opened as events are announced.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventFormats.map(({ title, description, icon: Icon, href, active }) => {
              const content = (
                <article className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm transition ${active ? "border-amber-400/50 bg-card hover:-translate-y-1 hover:shadow-lg" : "border-border bg-card/70"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>{active ? "Available" : "Coming soon"}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{description}</p>
                  <span className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{active ? "Explore webinars" : "Not yet available"} {active && <ArrowRight className="h-4 w-4" />}</span>
                </article>
              );
              return active && href ? <Link key={title} to={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">{content}</Link> : <div key={title} aria-disabled="true">{content}</div>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
