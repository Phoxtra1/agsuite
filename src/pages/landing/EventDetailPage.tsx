import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, Globe2, GraduationCap, MessageCircle, ShieldCheck, Video, Plane, CalendarDays } from "lucide-react";

const careerTopics = [
  "Understanding interests, strengths and personal aspirations when exploring career directions.",
  "Making thoughtful career choices and understanding their long-term implications.",
  "Exploring education and professional pathways that connect to career goals.",
  "Building relevant skills, work readiness and professional capacity.",
  "Understanding career opportunities, including professional and entrepreneurial pathways.",
];
const travelTopics = [
  "Exploring international study, employment, travel and relocation opportunities.",
  "Understanding important considerations before making travel or relocation decisions.",
  "Preparing for the financial, practical and personal realities of living, studying or working abroad.",
  "Learning from relevant experiences and perspectives about life in other destinations.",
  "Recognising misleading information and understanding why requirements and opportunities should be verified.",
];

export default function EventDetailPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101D32] px-5 py-16 text-white sm:py-20 lg:py-24">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Link to="/explore/events" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All events</Link>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> Online webinar · 2027</span>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Amineva Global presents</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Career, Travel &amp; Relocation Webinar</h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-100">Explore Your Potentials, Discover Global Opportunities.</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">A practical, experience-informed online programme for people exploring career directions, educational pathways and international opportunities.</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/[0.06] p-4"><Video className="h-5 w-5 text-amber-300" /><p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Format</p><p className="mt-1 text-sm font-semibold">Online webinar</p></div>
                <div className="rounded-2xl bg-white/[0.06] p-4"><CalendarDays className="h-5 w-5 text-amber-300" /><p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Year</p><p className="mt-1 text-sm font-semibold">2027</p></div>
                <div className="col-span-2 rounded-2xl bg-white/[0.06] p-4"><Globe2 className="h-5 w-5 text-amber-300" /><p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date and time</p><p className="mt-1 text-sm font-semibold">To be announced</p><p className="mt-1 text-xs text-slate-400">The confirmed schedule will be published on this page.</p></div>
              </div>
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4">
                <p className="text-sm font-semibold text-amber-100">Registration information</p>
                <p className="mt-1 text-xs leading-6 text-slate-300">Registration details and payment instructions will be published here when registration opens.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-12">
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">About the programme</p>
              <h2 className="mt-3 text-3xl font-bold">Explore choices. Understand pathways. Ask better questions.</h2>
              <p className="mt-5 text-sm leading-8 text-muted-foreground">Career, education, travel and relocation decisions can shape important parts of a person’s future. Yet people often have questions about where to begin, which pathways may be available, what preparation is required and how to assess the information they receive. This webinar brings these subjects into one moderated online conversation, with relevant contributions and opportunities for participants to ask questions.</p>
              <p className="mt-4 text-sm leading-8 text-muted-foreground">The programme is designed to help participants explore possibilities, hear informed perspectives and consider practical factors before making decisions. It is an educational and information-sharing event; it does not promise employment, admission, visas or relocation outcomes.</p>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Discussion area one</p><h2 className="text-2xl font-bold">Career Development &amp; Exploration</h2></div></div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">Explore how people identify suitable directions, understand educational options and prepare for changing professional opportunities.</p>
              <ul className="mt-5 space-y-3">{careerTopics.map((topic) => <li key={topic} className="flex gap-3 text-sm leading-7 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-500" />{topic}</li>)}</ul>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plane className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Discussion area two</p><h2 className="text-2xl font-bold">Travel &amp; Relocation</h2></div></div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">Consider international opportunities and the information, preparation and careful decisions involved in travelling, studying, working or relocating abroad.</p>
              <ul className="mt-5 space-y-3">{travelTopics.map((topic) => <li key={topic} className="flex gap-3 text-sm leading-7 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-500" />{topic}</li>)}</ul>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Who should attend</p>
              <h2 className="mt-3 text-2xl font-bold">A conversation for people at different stages</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["JHS and SHS learners considering future pathways","Tertiary students exploring study and career directions","Graduates preparing for employment or further education","Working professionals considering career development or change","Entrepreneurs and individuals exploring wider opportunities"].map((item) => <div key={item} className="flex gap-3 rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{item}</div>)}
              </div>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">What participants can expect</p>
              <h2 className="mt-3 text-2xl font-bold">Useful perspectives for informed decisions</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[{icon:BookOpen,title:"Broader understanding",body:"Explore career, education, travel and relocation considerations in one programme."},{icon:MessageCircle,title:"Relevant perspectives",body:"Hear contributions informed by professional knowledge and lived experience."},{icon:Compass,title:"Questions and discussion",body:"Bring questions into a moderated conversation and learn from shared perspectives."},{icon:ShieldCheck,title:"Greater awareness",body:"Recognise the importance of preparation, careful assessment and information verification."}].map(({icon:Icon,title,body})=><article key={title} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-amber-600 dark:text-amber-400"/><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p></article>)}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Guest contributions</p>
              <h2 className="mt-3 text-2xl font-bold">Perspectives informed by knowledge and experience</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">The programme is being developed with invited contributors who can share relevant professional knowledge and lived experience across career development, education, travel and relocation. Confirmed speaker profiles and participation details will be published here when arrangements are finalised.</p>
              <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">Guest speakers and contributors: To be announced.</div>
            </section>

            <section className="rounded-3xl border border-border bg-muted/30 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Programme flow</p>
              <h2 className="mt-3 text-2xl font-bold">A guided online conversation</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">The detailed running order and session timings will be published after contributors and the event schedule are confirmed.</p>
              <ol className="mt-6 space-y-4">{["Welcome and introduction by Amineva Global","Opening perspective on career development and exploration","Guest contributions and career discussion","Travel and relocation discussion","Interactive participant questions and answers","Amineva Global closing remarks and next steps"].map((item,index)=><li key={item} className="flex items-start gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{String(index+1).padStart(2,"0")}</span><span className="pt-1 text-sm leading-6 text-muted-foreground">{item}</span></li>)}</ol>
            </section>


            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Before you register</p>
              <h2 className="mt-3 text-2xl font-bold">Frequently asked questions</h2>
              <div className="mt-5 space-y-3">
                <details className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-semibold">Will this programme take place online or in person?</summary>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">This edition is an online webinar. Joining instructions will be sent to confirmed participants before the event.</p>
                </details>
                <details className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-semibold">Has the event date been confirmed?</summary>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">The event is planned for 2027. The exact date and time will be announced once confirmed.</p>
                </details>
                <details className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-semibold">Who can participate?</summary>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">The programme is intended for learners, tertiary students, graduates, working professionals, entrepreneurs and others interested in career, education, travel and relocation opportunities.</p>
                </details>
                <details className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-semibold">How do I register?</summary>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">The registration form, confirmed fee and payment instructions will be published on this page when registration opens.</p>
                </details>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Event at a glance</p>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex gap-3"><Video className="h-5 w-5 text-primary"/><div><p className="font-semibold">Online webinar</p><p className="text-xs text-muted-foreground">Attend remotely</p></div></div>
                <div className="flex gap-3"><CalendarDays className="h-5 w-5 text-primary"/><div><p className="font-semibold">2027 · Exact date to be announced</p><p className="text-xs text-muted-foreground">Check this page for updates</p></div></div>
                <div className="flex gap-3"><Globe2 className="h-5 w-5 text-primary"/><div><p className="font-semibold">Open to a broad audience</p><p className="text-xs text-muted-foreground">Students, graduates and professionals</p></div></div>
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-semibold">Registration will be announced</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">The registration form, confirmed fee and payment instructions will appear in this section when ready.</p>
                <div id="event-registration" className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground">Registration form coming soon</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <section className="border-t border-border bg-[#101D32] px-5 py-14 text-center text-white">
        <div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Amineva Global</p><h2 className="mt-3 text-2xl font-bold sm:text-3xl">Explore Your Potentials, Discover Global Opportunities.</h2><p className="mt-4 text-sm leading-7 text-slate-300">Follow this event page for confirmed programme and registration announcements.</p><Link to="/explore/events" className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold hover:bg-white/10">Back to events <ArrowRight className="h-4 w-4"/></Link></div>
      </section>
    </main>
  );
}
