import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Clock3, GraduationCap, MapPin, Video, Plane, CheckCircle2 } from "lucide-react";

const categories = {
  "career-education": {
    title: "Career and Education",
    eyebrow: "One-on-one career and education session",
    description: "A dedicated conversation for individuals who want to explore career questions, educational choices, development goals or possible pathways. Use the booking form to explain what you would like to discuss so the session can be arranged around your needs.",
    topics: ["Career development and exploration", "Career choices, direction and planning", "Educational pathways and progression", "Professional development and career change", "Other career- and education-related questions"],
    icon: GraduationCap,
  },
  "travel-relocation": {
    title: "Travel and Relocation",
    eyebrow: "One-on-one travel and relocation session",
    description: "A dedicated conversation for individuals considering travel, study, employment or relocation opportunities. Describe the destination, opportunity or questions you want to discuss so you can select an appropriate session.",
    topics: ["Study opportunities and education abroad", "International work and employment considerations", "Travel and relocation preparation", "Destination-specific questions", "Understanding information, requirements and next steps"],
    icon: Plane,
  },
};

export default function AppointmentCategoryPage() {
  const { category } = useParams();
  const selected = categories[category as keyof typeof categories];
  if (!selected) return null;
  const Icon = selected.icon;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="bg-[#101D32] px-5 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl">
          <Link to="/explore/appointments" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/> Appointment categories</Link>
          <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200"><Icon className="h-7 w-7"/></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">{selected.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{selected.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200">{selected.description}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="text-2xl font-bold">What would you like to discuss?</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">You can describe your specific questions and objectives in your own words when booking. The areas below are examples to help you understand the scope; they are not a restrictive list.</p>
          <ul className="mt-6 space-y-3">{selected.topics.map(topic=><li key={topic} className="flex gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/>{topic}</li>)}</ul>
          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-xl font-bold">How booking works</h2>
            <ol className="mt-5 space-y-4">{["Describe what you would like to discuss and provide your contact details.","Choose a session duration and meeting arrangement (online or in-person).","Select from the available dates and time slots.","Review the session details and applicable fee.","Proceed to secure payment. Your appointment is confirmed after payment is successfully verified."].map((step,index)=><li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index+1}</span>{step}</li>)}</ol>
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Appointment options</p>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3"><Clock3 className="h-5 w-5 text-primary"/><div><p className="text-sm font-semibold">Session duration</p><p className="text-xs leading-5 text-muted-foreground">Available durations and prices will be shown in the booking system.</p></div></div>
            <div className="flex gap-3"><CalendarClock className="h-5 w-5 text-primary"/><div><p className="text-sm font-semibold">Date and time</p><p className="text-xs leading-5 text-muted-foreground">Choose from available appointment slots.</p></div></div>
            <div className="flex gap-3"><Video className="h-5 w-5 text-primary"/><div><p className="text-sm font-semibold">Online session</p><p className="text-xs leading-5 text-muted-foreground">Meeting details are provided after confirmation.</p></div></div>
            <div className="flex gap-3"><MapPin className="h-5 w-5 text-primary"/><div><p className="text-sm font-semibold">In-person session</p><p className="text-xs leading-5 text-muted-foreground">Location and arrangements are provided during booking.</p></div></div>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">Online booking will open soon</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">The secure scheduling and payment link will be connected here once the appointment platform is finalised.</p>
          </div>
          <Link to="/explore/appointments" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4"/> Back to appointment options</Link>
        </aside>
      </section>
    </main>
  );
}
