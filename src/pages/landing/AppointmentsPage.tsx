import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Plane, CalendarClock, Video, Clock3 } from "lucide-react";

const sessionTypes = [
  {
    title: "Career and Education",
    description: "Book a one-on-one session to discuss your career direction, development, educational choices or possible learning and professional pathways.",
    topics: ["Career development and exploration", "Career choices and planning", "Educational pathways and progression", "Professional development and career change", "Other career- and education-related questions"],
    icon: GraduationCap,
    href: "/explore/appointments/career-education",
  },
  {
    title: "Travel and Relocation",
    description: "Arrange a one-on-one discussion about travel, study, employment or relocation opportunities and the information you need to consider before taking your next step.",
    topics: ["Study and education opportunities abroad", "International employment considerations", "Travel and relocation preparation", "Destination-related questions", "Other travel- and relocation-related matters"],
    icon: Plane,
    href: "/explore/appointments/travel-relocation",
  },
];

export default function AppointmentsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101D32] px-5 py-16 text-white sm:py-20">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl"/>
        <div className="relative mx-auto max-w-6xl">
          <Link to="/explore" className="text-sm text-slate-300 hover:text-white">← Back to Solutions</Link>
          <p className="mt-9 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Amineva Global · Personal sessions</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">Book a one-on-one appointment.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200">Some questions deserve a dedicated conversation. Choose the area you want to discuss, tell us what you would like to cover, and select an available session that suits your needs.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-200">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2"><Clock3 className="h-4 w-4 text-amber-200"/> Choose a session duration</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2"><CalendarClock className="h-4 w-4 text-amber-200"/> Select an available time</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2"><Video className="h-4 w-4 text-amber-200"/> Online or in-person</span>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Choose a session area</p><h2 className="mt-3 text-3xl font-bold">What would you like to discuss?</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Each session is arranged around the subject you want to discuss. Describe your needs during booking so the session can be focused and useful.</p></div>
        <div className="grid gap-6 lg:grid-cols-2">
          {sessionTypes.map(({title,description,topics,icon:Icon,href})=>(
            <article key={title} className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm transition hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-lg sm:p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-7 w-7"/></span>
              <h3 className="mt-6 text-2xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
              <ul className="mt-6 flex-1 space-y-3">{topics.map(topic=><li key={topic} className="flex gap-3 text-sm text-muted-foreground"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"/>{topic}</li>)}</ul>
              <Link to={href} className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">View session details <ArrowRight className="h-4 w-4"/></Link>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-border bg-muted/30 px-5 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[{icon:Clock3,title:"Choose your duration",body:"Select from the available session lengths and see the applicable fee before proceeding."},{icon:CalendarClock,title:"Choose a suitable time",body:"View available dates and time slots before selecting your appointment."},{icon:Video,title:"Choose how to meet",body:"Select an online or in-person session where the option is available."}].map(({icon:Icon,title,body})=><div key={title} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-amber-600 dark:text-amber-400"/><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p></div>)}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-14 text-center"><p className="text-sm leading-7 text-muted-foreground">Appointments are paid sessions. The applicable fee is displayed during booking according to the selected session duration and arrangement. Your appointment is confirmed after successful payment and booking confirmation.</p></section>
    </main>
  );
}
