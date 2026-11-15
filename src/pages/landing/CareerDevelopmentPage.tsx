import React, { FC, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Heart,
  HeartHandshake,
  Target,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  School,
  BookOpen,
  Award,
  Globe,
  Compass,
  FileText,
  MessageSquare,
  BadgeAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  IMPACT_INTRO,
  INITIATIVES,
  COLLABORATION_CATEGORIES,
  SCHOOL_ACTIVITY_IMAGES,
  Initiative,
} from "@/data/impact";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

function handleImpactImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === "true") {
    image.style.display = "none";
    return;
  }
  image.dataset.fallbackApplied = "true";
  image.src = "/images/impact/impact-school-engagement.webp";
}

const featuredHeroPhoto =
  SCHOOL_ACTIVITY_IMAGES.find((photo) => photo.url === "/saleria1.jpg") ?? SCHOOL_ACTIVITY_IMAGES[0];

const LEARNER_JOURNEY_STAGES = [
  {
    id: "discover",
    label: "Discover strengths",
    title: "Start with the learner.",
    description:
      "Help each learner reflect on their interests, personal strengths and the abilities they want to develop. Career exploration begins with understanding the person, not choosing a job title too early.",
    focus: "Interests · strengths · self-awareness",
    icon: Compass,
  },
  {
    id: "explore",
    label: "Explore possibilities",
    title: "Make the world of work feel wider.",
    description:
      "Introduce learners to careers they may not encounter in everyday life, including technical, vocational, creative, emerging and professional pathways.",
    focus: "Career awareness · exposure · curiosity",
    icon: BookOpen,
  },
  {
    id: "choose",
    label: "Make informed choices",
    title: "Connect today’s learning with tomorrow’s options.",
    description:
      "Help learners connect interests with educational pathways, practical skills and useful conversations with parents, teachers and professionals.",
    focus: "Education · practical skills · guidance",
    icon: Target,
  },
] as const;

type LearnerJourneyStageId = (typeof LEARNER_JOURNEY_STAGES)[number]["id"];

export const CareerDevelopmentPage: FC = () => {
  const { initiativeId } = useParams<{ initiativeId?: string }>();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    "all" | "active" | "planned" | "completed"
  >("all");
  const [expandedInitiativeId, setExpandedInitiativeId] = useState<string | null>(
    initiativeId || "career-development"
  );
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; altText: string; caption: string } | null>(null);
  const [activeJourneyStageId, setActiveJourneyStageId] = useState<LearnerJourneyStageId>("discover");
  const activeJourneyStage =
    LEARNER_JOURNEY_STAGES.find((stage) => stage.id === activeJourneyStageId) ?? LEARNER_JOURNEY_STAGES[0];
  const JourneyStageIcon = activeJourneyStage.icon;

  useEffect(() => {
    document.title = "Career Development and Exploration Program | Amineva Impact";
  }, []);

  useEffect(() => {
    if (!initiativeId) return;
    const matchingInitiative = INITIATIVES.some(item => item.id === initiativeId);
    if (!matchingInitiative) return;
    setExpandedInitiativeId(initiativeId);
    const elem = document.getElementById(`initiative-${initiativeId}`);
    elem?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [initiativeId]);

  const filteredInitiatives = INITIATIVES.filter((item) => {
    if (selectedStatusFilter === "all") return true;
    return item.status === selectedStatusFilter;
  });

  const getStatusBadge = (status: Initiative["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success/20 text-success border-success/30 font-medium">
            ● Active Programme
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="font-medium">
            ✓ Completed
          </Badge>
        );
      case "planned":
        return (
          <Badge variant="outline" className="text-muted-foreground font-medium">
            Planned Initiative
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-background text-foreground min-h-screen">
            {/* PROGRAMME HERO */}
      <section className="relative isolate overflow-hidden bg-[#101d32] py-14 text-white md:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 left-0 h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <Link
            to="/impact"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/65 transition hover:text-amber-200"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Amineva Impact
          </Link>
          <div className="mt-9 grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr]">
            <div className="max-w-2xl space-y-6">
              <Badge className="border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                First active programme
              </Badge>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">
                  Every learner matters
                </p>
                <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Career Development and Exploration Program
                </h1>
                <p className="max-w-xl text-xl font-semibold leading-snug text-amber-200 sm:text-2xl">
                  A wider view of the future starts early.
                </p>
              </div>
              <p className="max-w-xl text-base leading-8 text-white/70">
                Helping learners understand themselves, discover a wider range of career
                possibilities and make more informed decisions about their educational and future
                pathways.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/support">
                  <Button className="gap-2 bg-amber-300 text-[#14243a] hover:bg-amber-200">
                    Partner with the programme
                    <HeartHandshake className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="#learner-journey"
                  className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore the learner journey
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-6 text-xs text-white/55">
                <span>Primary and Junior High School learners</span>
                <span>Career awareness through real engagement</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rotate-2 rounded-[2rem] border border-white/15 bg-white/[0.04]"
              />
              <figure className="group relative aspect-[4/4.1] overflow-hidden rounded-[1.7rem] border border-white/15 bg-slate-900 shadow-2xl sm:aspect-[5/4.2]">
                <img
                  src={featuredHeroPhoto.url}
                  alt={featuredHeroPhoto.altText}
                  onError={handleImpactImageError}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081321]/90 via-transparent to-[#081321]/10" />
                <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
                    From the classroom
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                    {featuredHeroPhoto.title}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">
                    {featuredHeroPhoto.caption}
                  </p>
                </figcaption>
              </figure>
              <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3 text-[#14243a] shadow-xl sm:-left-7 sm:px-5">
                <span className="text-2xl font-bold">600+</span>
                <span className="max-w-[145px] text-xs leading-snug text-slate-600">
                  learners reached in one school engagement
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* IMPACT SNAPSHOT */}
      <section className="max-w-7xl mx-auto px-6 -mt-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 py-6">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <School className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">School engagements documented</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">600+</p>
              <p className="text-xs text-muted-foreground">Learners at one school engagement</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Career Development</p>
              <p className="text-xs text-muted-foreground">First active initiative</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE LEARNER JOURNEY */}
      <section id="learner-journey" className="scroll-mt-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                A learner-centred approach
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                Career awareness is a journey.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Explore how the programme helps learners move from understanding themselves to
              recognising possibilities and making better-informed decisions.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
            <div className="grid lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.28fr)]">
              <div
                role="tablist"
                aria-label="Learner journey stages"
                className="flex flex-col gap-2 bg-muted/35 p-4 sm:p-6"
              >
                {LEARNER_JOURNEY_STAGES.map((stage, index) => {
                  const StageIcon = stage.icon;
                  const isActive = stage.id === activeJourneyStageId;
                  return (
                    <button
                      key={stage.id}
                      id={"journey-tab-" + stage.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="journey-panel"
                      onClick={() => setActiveJourneyStageId(stage.id)}
                      className={
                        "group flex w-full items-center gap-4 rounded-xl p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
                        (isActive
                          ? "bg-[#101d32] text-white shadow-md"
                          : "text-foreground hover:bg-background")
                      }
                    >
                      <span
                        className={
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " +
                          (isActive
                            ? "bg-amber-300 text-[#14243a]"
                            : "bg-accent/10 text-accent")
                        }
                      >
                        <StageIcon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={
                            "block text-[10px] font-bold uppercase tracking-[0.18em] " +
                            (isActive ? "text-amber-200" : "text-muted-foreground")
                          }
                        >
                          Stage 0{index + 1}
                        </span>
                        <span className="mt-1 block text-sm font-semibold">{stage.label}</span>
                      </span>
                      <ArrowRight
                        className={
                          "ml-auto h-4 w-4 shrink-0 transition-transform " +
                          (isActive ? "translate-x-0 text-amber-200" : "-translate-x-1 opacity-0")
                        }
                      />
                    </button>
                  );
                })}
              </div>

              <div
                id="journey-panel"
                role="tabpanel"
                aria-labelledby={"journey-tab-" + activeJourneyStage.id}
                className="relative flex min-h-[280px] items-center overflow-hidden p-7 sm:p-10 lg:p-12"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-accent/10"
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeJourneyStage.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24 }}
                    className="relative max-w-2xl"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                      {activeJourneyStage.focus}
                    </p>
                    <h3 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                      {activeJourneyStage.title}
                    </h3>
                    <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
                      {activeJourneyStage.description}
                    </p>
                    <div className="mt-7 flex items-center gap-3 text-xs font-semibold text-accent">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                        <JourneyStageIcon className="h-4 w-4" />
                      </span>
                      {activeJourneyStage.label}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMME OVERVIEW, OBJECTIVES AND IMPLEMENTATION */}
      {INITIATIVES.length > 0 && (
        <section className="bg-muted/30 border-y border-border py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                  <Award className="w-3.5 h-3.5" /> First Active Initiative
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Career Development and Exploration
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Empowering basic-school learners with early career awareness, self-discovery tools, and confidence to explore future pathways.
              </p>
            </div>

            {/* In-depth Career Development Showcase Card */}
            {(() => {
              const activeInit = INITIATIVES[0];
              return (
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-sm space-y-10">
                  {/* Overview Grid */}
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(activeInit.status)}
                        <span className="text-xs text-muted-foreground font-medium">
                          Category: {activeInit.category}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {activeInit.tagline}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {activeInit.overview}
                      </p>
                      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-accent/10 via-muted/40 to-primary/[0.06] border border-accent/15 space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          Core Purpose
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {activeInit.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Verified Metrics / Target Audience */}
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-accent" /> Verified Engagement Figures
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {activeInit.verifiedMetrics?.map((m) => (
                            <div key={m.label} className="relative overflow-hidden p-3.5 bg-gradient-to-br from-card to-accent/[0.07] rounded-xl border border-border shadow-sm"><div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-accent/[0.07]" />
                              <p className="text-xl font-bold text-accent">{m.figure}</p>
                              <p className="text-xs font-medium text-foreground">{m.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{m.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative overflow-hidden p-6 rounded-2xl border border-border bg-gradient-to-br from-card to-primary/[0.05] space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-accent" /> Target Beneficiaries
                        </h4>
                        <ul className="space-y-2">
                          {activeInit.targetAudience.map((ta) => (
                            <li key={ta} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                              <span>{ta}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Objectives Grid */}
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-accent" /> Key Programme Objectives
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeInit.objectives.map((obj, idx) => (
                        <div
                          key={idx}
                          className="relative overflow-hidden p-4 rounded-xl border border-border bg-gradient-to-br from-card to-accent/[0.05] flex items-start gap-3 shadow-sm hover:border-accent/35 hover:shadow-md transition-all"
                        >
                          <span className="w-6 h-6 rounded-full bg-accent/10 text-accent font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-foreground leading-relaxed">
                            {obj}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activities and Implementation */}
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-accent" /> Activities & Implementation
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {activeInit.activities.map((act, idx) => {
                        const ActivityIcon = [Compass, Users, MessageSquare, Briefcase][idx % 4];
                        return (
                          <div
                            key={act.title}
                            className="group relative overflow-hidden p-5 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.045] hover:border-accent/40 hover:shadow-md transition-all"
                          >
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent shadow-sm transition-transform group-hover:scale-105">
                              <ActivityIcon className="h-5 w-5" />
                            </div>
                            <h5 className="font-semibold text-foreground text-sm mb-2">
                              {act.title}
                            </h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {act.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* PROGRAMME ACTIVITIES, SCHOOL RECORDS AND IMPACT DOCUMENTATION */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">
            On-Ground Documentation
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Activities & Engagements
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 text-sm md:text-base">
            Transparent reporting of actual school outreach sessions, topics covered, progress updates, and verified outcomes.
          </p>
        </div>

        <Tabs defaultValue="engagements" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="engagements" className="text-xs md:text-sm">
                School Engagements
              </TabsTrigger>
              <TabsTrigger value="updates" className="text-xs md:text-sm">
                Progress Updates
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs md:text-sm">
                Achievements
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="engagements" className="space-y-10" id="activities-gallery">
            {/* Gallery of Activity Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <School className="w-5 h-5 text-accent" /> Activity Photo Gallery
                  </h3>

                </div>

              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {SCHOOL_ACTIVITY_IMAGES.map((img, idx) => (
                  <motion.div
                    key={img.url}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={idx}
                    className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-accent/50 transition-all duration-300 shadow-sm flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      aria-label={`View photo: ${img.title}`}
                      className="group/image relative block w-full aspect-[2/1] overflow-hidden bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    >
                      <img

                        onError={handleImpactImageError}
                        src={img.url}
                        alt={img.altText}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover/image:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-primary/90 to-transparent px-4 pb-3 pt-9 text-xs font-semibold text-primary-foreground opacity-0 transition-opacity duration-200 group-hover/image:opacity-100 group-focus-visible/image:opacity-100">
                        View photograph <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </button>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">
                          {img.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {img.caption}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 pt-4">
              {INITIATIVES.flatMap((init) => init.schoolEngagements || []).map(
                (se, idx) => (
                  <Card key={idx} className="border border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {se.location}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {se.date}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground mt-2">
                        {se.schoolName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {se.summary}
                      </p>

                      <div>
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
                          Topics Covered
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {se.topicsCovered.map((topic) => (
                            <span
                              key={topic}
                              className="px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>Verified Participants:</span>
                        <span className="font-bold text-foreground">
                          {se.beneficiariesCount} Students
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="updates">
            <div className="max-w-3xl mx-auto space-y-4">
              {INITIATIVES.flatMap((init) => init.progressUpdates || []).map(
                (up, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-border bg-card flex items-start gap-4"
                  >
                    <div className="px-3 py-1 rounded-lg bg-accent/10 text-accent font-bold text-xs flex-shrink-0 mt-0.5">
                      {up.date}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        {up.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {up.summary}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Highlight Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-accent/10 border border-accent/20 text-center">
                <div className="p-2">
                  <div className="text-2xl font-bold text-foreground">5</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Schools Engaged</div>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-bold text-foreground">600+</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Learners at one school engagement</div>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-bold text-foreground">Foundations</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Career Importance</div>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-bold text-foreground">Capacity</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Pathways for Better Future</div>
                </div>
              </div>

              {/* Achievements Detail Cards */}
              <div className="space-y-3">
                {INITIATIVES.flatMap((init) => init.achievements || []).map(
                  (ach, idx) => (
                    <motion.div
                      key={idx}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      custom={idx}
                      className="p-5 rounded-2xl border border-border bg-card flex items-start gap-4 text-xs md:text-sm text-foreground hover:border-accent/30 transition shadow-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{ach}</span>
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={selectedImage !== null} onOpenChange={(open) => { if (!open) setSelectedImage(null); }}>
          <DialogContent className="max-w-5xl border-border bg-card p-3 md:p-5">
            {selectedImage && (
              <>
                <DialogHeader className="pr-8">
                  <DialogTitle>{selectedImage.title}</DialogTitle>
                  <DialogDescription>{selectedImage.caption}</DialogDescription>
                </DialogHeader>
                <img

                  onError={handleImpactImageError}
                  src={selectedImage.url}
                  alt={selectedImage.altText}
                  className="max-h-[72vh] w-full rounded-xl bg-muted object-contain"
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>

      {/* PROGRAMME RECORDS, ENGAGEMENTS AND COLLABORATION DETAILS */}
      <section id="initiatives-showcase" className="bg-muted/20 border-t border-border py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">
              Initiatives Registry
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              Programme Progress and Engagement Records
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-2 text-sm">
              This section brings together the programme record, progress updates and supporting engagement information.
            </p>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {(["all", "active", "planned", "completed"] as const).map(
                (status) => (
                  <Button
                    key={status}
                    variant={selectedStatusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatusFilter(status)}
                    className="capitalize text-xs"
                  >
                    {status}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="space-y-6 max-w-5xl mx-auto">
            {filteredInitiatives.map((init) => {
              const isExpanded = expandedInitiativeId === init.id;
              return (
                <div
                  key={init.id}
                  id={`initiative-${init.id}`}
                  className="group border border-border bg-card rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:border-accent/40 hover:shadow-md"
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`initiative-content-${init.id}`}
                    onClick={() => setExpandedInitiativeId(isExpanded ? null : init.id)}
                    className="group w-full p-6 flex items-center justify-between gap-4 text-left hover:bg-muted/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {getStatusBadge(init.status)}
                        <span className="text-xs text-muted-foreground">
                          {init.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {init.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                        {init.tagline}
                      </p>
                    </div>

                    <span aria-hidden="true" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition group-hover:border-accent/40">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        id={`initiative-content-${init.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border p-6 lg:p-8 space-y-6 bg-muted/10"
                      >
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Overview & Purpose
                          </h4>
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {init.overview}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                              Objectives
                            </h4>
                            <ul className="space-y-2">
                              {init.objectives.map((obj, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex items-start gap-2"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                              Collaboration Opportunities
                            </h4>
                            <ul className="space-y-2">
                              {init.collaborationOpportunities.map((col, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                                  <span>{col}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-4">
                          <span className="text-xs text-muted-foreground">
                            Ready to collaborate or host an engagement?
                          </span>
                          <Link to={init.contactLink}>
                            <Button size="sm" className="gap-2 text-xs">
                              Inquire & Collaborate <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION F: COLLABORATION AND INSTITUTIONAL ENGAGEMENT */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="bg-card border border-border rounded-3xl p-8 lg:p-12 shadow-sm relative overflow-hidden">
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Institutional Invitation
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Partner with Amineva Impact
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                We invite schools, educational institutions, development organizations, companies, and community leaders to collaborate with Amineva Global across our social and educational initiatives.
              </p>

              <div className="grid md:grid-cols-2 gap-4 pt-4">
                {COLLABORATION_CATEGORIES.map((cat, idx) => {
                  const CategoryIcon = [BookOpen, Users, Building2, Sparkles][idx % 4];
                  return (
                    <div
                      key={cat.title}
                      className="group relative overflow-hidden p-5 rounded-2xl border border-border bg-gradient-to-br from-card to-accent/[0.045] shadow-sm hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md transition-all"
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-foreground text-xs md:text-sm mb-1">
                        {cat.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 flex items-center gap-4 flex-wrap">
                <Link to="/support">
                  <Button size="lg" className="gap-2 font-semibold">
                    Contact Amineva Global <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Direct enquiries via official corporate support channels.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 relative overflow-hidden p-7 rounded-3xl bg-gradient-to-br from-primary/[0.08] via-card to-accent/[0.08] border border-border shadow-inner space-y-4">
              <h3 className="font-bold text-foreground text-base">
                Why Partner With Us?
              </h3>
              <ul className="space-y-3">
                {[
                  "Structured, verifiable community and school engagement framework",
                  "Institutional credibility under Amineva Global's corporate technology standards",
                  "Authentic, non-promotional educational focus",
                  "Direct impact measurement and engagement documentation",
                ].map((reason, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareerDevelopmentPage;