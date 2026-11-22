import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, GraduationCap, MessageCircle, ShieldCheck, Video, Plane } from "lucide-react";

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
        <div className="relative mx-auto max-w-5xl text-center">
          <Link to="/explore/events/webinars" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All webinars</Link>
          <div className="mt-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200"><Video className="h-3.5 w-3.5" /> Online webinar · 2027</span>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Amineva Global presents</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Career, Travel &amp; Relocation Webinar</h1>
            <p className="mt-6 text-lg font-medium leading-8 text-slate-100">Explore Your Potentials, Discover Global Opportunities.</p>
            <button type="button" disabled aria-disabled="true" className="mt-8 inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-amber-400 px-8 py-4 text-base font-extrabold text-slate-950 opacity-100 shadow-lg shadow-amber-950/20 animate-pulse">Register Now</button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-12">
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



        </div>
      </section>
      <section className="border-t border-border bg-[#101D32] px-5 py-14 text-center text-white">
        <div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Amineva Global</p><h2 className="mt-3 text-2xl font-bold sm:text-3xl">Explore Your Potentials, Discover Global Opportunities.</h2><p className="mt-4 text-sm leading-7 text-slate-300">Follow this event page for confirmed programme and registration announcements.</p><Link to="/explore/events" className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold hover:bg-white/10">Back to events <ArrowRight className="h-4 w-4"/></Link></div>
      </section>
    </main>
  );
}
