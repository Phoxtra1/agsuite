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
  FOCUS_AREAS,
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

const heroSecondaryImage = {
  type: "image" as const,
  url: "/images/impact/impact-school-computer-session.webp",
  title: "Digital Learning & Computer Exposure",
  caption: "Learners gathered with facilitators and computer equipment during a school-based educational engagement.",
  altText: "School learners standing with facilitators and computer equipment during an educational engagement.",
};

export const AminevaImpactPage: FC = () => {
  const { initiativeId } = useParams<{ initiativeId?: string }>();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    "all" | "active" | "planned" | "completed"
  >("all");
  const [expandedInitiativeId, setExpandedInitiativeId] = useState<string | null>(
    initiativeId || "career-development"
  );
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; altText: string; caption: string } | null>(null);

  useEffect(() => {
    document.title = "Amineva Impact | Community & Educational Initiatives | Amineva Global";
  }, []);

  useEffect(() => {
    if (initiativeId) {
      setExpandedInitiativeId(initiativeId);
      const elem = document.getElementById(`initiative-${initiativeId}`);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
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
      {/* HERO / INTRODUCTION */}
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-to-br from-primary/[0.10] via-background to-accent/[0.08] py-12 md:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <div className="absolute -left-24 top-8 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent font-semibold text-xs tracking-wider uppercase">
              <Heart className="w-3.5 h-3.5" />
              <span>Amineva Global Initiatives</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight text-foreground leading-[1.08]">
                Amineva <span className="text-accent">Impact</span>
              </h1>
              <p className="text-base md:text-lg font-semibold text-foreground/80">
                Education, opportunity and practical development.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                {IMPACT_INTRO.positioning}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a href="#activities-gallery">
                <Button size="lg" className="gap-2 font-semibold shadow-sm">
                  See Our Work <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link to="/support">
                <Button size="lg" variant="outline" className="gap-2">
                  Partner With Us <Heart className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              A transparent view of our programmes, school engagements and collaboration opportunities.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="lg:col-span-6"
          >
            <div className="grid grid-cols-12 grid-rows-2 gap-3 h-[300px] sm:h-[380px]">
              <button
                type="button"
                onClick={() => setSelectedImage({
                  url: "/images/impact/impact-school-engagement-hero.webp",
                  title: "Classroom Engagement & Learner Participation",
                  altText: "A facilitator and learners share a moment during a classroom engagement, with classmates gathered in the room.",
                  caption: "A classroom moment from a school engagement documented by Amineva Global.",
                })}
                className="group relative col-span-8 row-span-2 overflow-hidden rounded-3xl border border-border bg-muted text-left shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="View classroom engagement photograph"
              >
                <img
                  src="/images/impact/impact-school-engagement-hero.webp"
                  alt="A facilitator and learners share a moment during a classroom engagement, with classmates gathered in the room."
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 via-primary/35 to-transparent px-4 pb-4 pt-14 text-left">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-white/80">
                    School engagement
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-white">
                    Learning through real participation
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedImage(heroSecondaryImage)}
                className="group relative col-span-4 overflow-hidden rounded-3xl border border-border bg-muted text-left shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="View computer learning photograph"
              >
                <img
                  src={heroSecondaryImage.url}
                  alt={heroSecondaryImage.altText}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
              <div className="col-span-4 rounded-3xl border border-accent/20 bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    On the ground
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground leading-snug">
                    Working with learners, schools and communities.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Schools engaged</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">600+</p>
              <p className="text-xs text-muted-foreground">Learners reached</p>
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

      {/* SECTION B: OUR FOCUS AREAS */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">
            Strategic Scope
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Our Focus Areas
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 text-sm md:text-base">
            Amineva Impact embraces a broad spectrum of educational, social, and community developmental domains. These areas define our strategic scope for present and future engagements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FOCUS_AREAS.map((area, i) => {
            const Icon = area.icon;
            return (
              <motion.div
                key={area.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group relative overflow-hidden p-6 rounded-2xl border border-border bg-card shadow-sm hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between focus-within:ring-2 focus-within:ring-accent/40"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl border border-accent/20 bg-accent/10 flex items-center justify-center text-accent mb-5 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {area.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {area.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION D: FEATURED ACTIVE INITIATIVE HIGHLIGHT */}
      {INITIATIVES.length > 0 && (
        <section className="bg-muted/30 border-y border-border py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                  <Award className="w-3.5 h-3.5" /> First Active Initiative
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Career Development & Exploration
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
                      <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-1">
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
                            <div key={m.label} className="p-3 bg-card rounded-xl border border-border">
                              <p className="text-xl font-bold text-accent">{m.figure}</p>
                              <p className="text-xs font-medium text-foreground">{m.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{m.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
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
                          className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-3"
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
                      {activeInit.activities.map((act) => (
                        <div
                          key={act.title}
                          className="p-5 rounded-2xl border border-border bg-card hover:border-accent/30 transition"
                        >
                          <h5 className="font-semibold text-foreground text-sm mb-1">
                            {act.title}
                          </h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {act.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* SECTION E: ACTIVITIES AND IMPACT DOCUMENTATION */}
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
                  <p className="text-xs text-muted-foreground">
                    Photographic documentation captured during our active basic school outreach sessions.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-accent border-accent/30">
                  {SCHOOL_ACTIVITY_IMAGES.length} Photographs
                </Badge>
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
                  <div className="text-2xl font-bold text-foreground">3</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Schools Engaged</div>
                </div>
                <div className="p-2">
                  <div className="text-2xl font-bold text-foreground">Over 600</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Students Participated</div>
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
                  src={selectedImage.url}
                  alt={selectedImage.altText}
                  className="max-h-[72vh] w-full rounded-xl bg-muted object-contain"
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>

      {/* SECTION C: REUSABLE & EXPANDABLE INITIATIVE SHOWCASE */}
      <section id="initiatives-showcase" className="bg-muted/20 border-t border-border py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">
              Initiatives Registry
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              All Amineva Impact Initiatives
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mt-2 text-sm">
              Our umbrella platform supports active, completed, and planned community programmes.
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
                {COLLABORATION_CATEGORIES.map((cat) => (
                  <div
                    key={cat.title}
                    className="p-4 rounded-xl border border-border bg-muted/20"
                  >
                    <h4 className="font-semibold text-foreground text-xs md:text-sm mb-1">
                      {cat.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                ))}
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

            <div className="lg:col-span-5 p-6 rounded-2xl bg-muted/40 border border-border space-y-4">
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

export default AminevaImpactPage;
