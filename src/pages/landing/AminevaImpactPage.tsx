import React, { FC, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Heart,
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
import {
  IMPACT_INTRO,
  FOCUS_AREAS,
  INITIATIVES,
  COLLABORATION_CATEGORIES,
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

export const AminevaImpactPage: FC = () => {
  const { initiativeId } = useParams<{ initiativeId?: string }>();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    "all" | "active" | "planned" | "completed"
  >("all");
  const [expandedInitiativeId, setExpandedInitiativeId] = useState<string | null>(
    initiativeId || "career-development"
  );

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
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent font-semibold text-xs tracking-wider uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Amineva Global Community Platform</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
              Amineva <span className="text-accent">Impact</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              {IMPACT_INTRO.positioning}
            </p>

            <div className="p-4 md:p-6 rounded-2xl border border-border bg-card/60 backdrop-blur text-left max-w-3xl mx-auto space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                <ShieldCheck className="w-4 h-4" />
                <span>Relationship with Amineva Global</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {IMPACT_INTRO.relationship}
              </p>
            </div>
          </motion.div>
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
                className="p-6 rounded-2xl border border-border bg-card hover:border-accent/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-5">
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
            Activities & Documented Engagements
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
              <TabsTrigger value="outcomes" className="text-xs md:text-sm">
                Outcomes & Achievements
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="engagements">
            <div className="grid lg:grid-cols-2 gap-6">
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

          <TabsContent value="outcomes">
            <div className="max-w-3xl mx-auto space-y-3">
              {INITIATIVES.flatMap((init) => init.outcomes || []).map(
                (out, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-card flex items-center gap-3 text-xs md:text-sm text-foreground"
                  >
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span>{out}</span>
                  </div>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
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
                  className="border border-border bg-card rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                >
                  <div
                    onClick={() =>
                      setExpandedInitiativeId(isExpanded ? null : init.id)
                    }
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition"
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

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
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
