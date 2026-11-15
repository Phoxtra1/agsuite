import React, { FC, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  Heart,
  HeartHandshake,
  School,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IMPACT_INTRO, IMPACT_VIDEO_ID, SCHOOL_ACTIVITY_IMAGES } from "@/data/impact";

const FEATURED_IMPACT_PHOTO =
  SCHOOL_ACTIVITY_IMAGES.find((photo) => photo.url === "/saleria1.jpg") ?? SCHOOL_ACTIVITY_IMAGES[0];

export const AminevaImpactPage: FC = () => {
  useEffect(() => {
    document.title = "Amineva Impact | A Social Initiative of Amineva Global";
  }, []);

  return (
    <main className="min-h-screen w-full overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#101d32] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 right-0 h-[36rem] w-[36rem] rounded-full bg-amber-400/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:py-20 lg:min-h-[620px] lg:grid-cols-[1.04fr_0.96fr] lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Heart className="h-3.5 w-3.5" />
              A social initiative of Amineva Global
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              People · Education · Opportunity
            </p>
            <h1 className="mt-4 max-w-2xl text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Amineva <span className="text-amber-300">Impact</span>
            </h1>
            <p className="mt-5 max-w-xl text-2xl font-semibold leading-snug text-white sm:text-3xl">
              Open doors. Expand possibility.
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/70 md:text-lg">
              Creating access to knowledge, opportunities and support for people and communities.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/impact/career-development">
                <Button size="lg" className="gap-2 bg-amber-300 text-[#14243a] hover:bg-amber-200">
                  Explore the active programme
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#our-mission">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/25 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
                >
                  Why Amineva Impact
                </Button>
              </a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/15 pt-6">
              <div>
                <p className="text-3xl font-bold text-white">5</p>
                <p className="mt-1 text-xs text-white/55">Schools engaged</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">600+</p>
                <p className="mt-1 max-w-[150px] text-xs leading-relaxed text-white/55">
                  Learners reached during one school visit
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-2 rounded-[2rem] border border-white/15 bg-white/[0.04]"
            />
            <figure className="group relative aspect-[4/4.2] overflow-hidden rounded-[1.7rem] border border-white/15 bg-slate-900 shadow-2xl sm:aspect-[5/4.2]">
              <img
                src={FEATURED_IMPACT_PHOTO.url}
                alt={FEATURED_IMPACT_PHOTO.altText}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081321]/90 via-transparent to-[#081321]/10" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                  <span className="h-px w-7 bg-amber-300" />
                  The work in action
                </span>
                <p className="mt-3 max-w-md text-xl font-semibold leading-snug text-white sm:text-2xl">
                  {FEATURED_IMPACT_PHOTO.title}
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">
                  {FEATURED_IMPACT_PHOTO.caption}
                </p>
              </figcaption>
            </figure>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3 text-[#14243a] shadow-xl sm:-left-7 sm:px-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Compass className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Current programme
                </span>
                <span className="mt-0.5 block text-sm font-bold">Career Development</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="UNESCO Global Education Coalition membership status"
        className="mx-auto max-w-7xl px-6 pt-8"
      >
        <div className="flex flex-col gap-4 rounded-2xl bg-[#003B7A] px-5 py-5 text-white shadow-sm sm:flex-row sm:items-center sm:px-7">
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-white px-3 py-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/2e/Logo_UNESCO_2021.svg"
              alt="UNESCO"
              className="h-9 w-auto"
              loading="lazy"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
              Member of UNESCO Global Education Coalition
            </p>
            <p className="mt-0.5 text-base font-bold">Approval confirmed</p>
            <p className="mt-1 text-sm leading-relaxed text-white/85">
              Amineva Global has received confirmation of approval to join UNESCO&apos;s Global
              Education Coalition. Its public profile on the Coalition&apos;s website is awaiting
              publication.
            </p>
          </div>
        </div>
      </section>

      <section id="our-mission" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div className="max-w-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Target className="h-6 w-6" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">Our mission</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Purpose that starts with people.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">{IMPACT_INTRO.mission}</p>
          </div>
          <div className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">What guides our work</p>
            <h3 className="mt-3 text-2xl font-bold md:text-3xl">The commitments behind every programme.</h3>
            <ul className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {IMPACT_INTRO.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-sm leading-7 text-muted-foreground">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="our-focus-areas"
        className="relative overflow-hidden border-y border-border bg-muted/25 px-6 py-16 md:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Where the work begins
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Our active programme</h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-muted-foreground">
              Amineva Impact will grow as new needs and partnerships take shape. Our first active
              programme is focused on helping learners understand the choices that can shape their
              future.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-[#101d32] text-white shadow-xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full border border-white/10"
            />
            <div className="grid lg:grid-cols-[1fr_0.9fr]">
              <div className="relative z-10 flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <Badge className="w-fit border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  First active programme
                </Badge>
                <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                  Education · Career awareness · Exploration
                </p>
                <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
                  Career Development and Exploration
                </h3>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                  Helping basic-school learners discover their strengths, explore a wider range of
                  career possibilities and make more informed decisions about education and future
                  work.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/impact/career-development">
                    <Button className="gap-2 bg-amber-300 text-[#14243a] hover:bg-amber-200">
                      Discover the programme
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a
                    href="#programme-film"
                    className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Watch the programme film
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              <div id="programme-film" className="relative min-h-[280px] overflow-hidden lg:min-h-[440px]">
                <div className="absolute inset-0">
                  <iframe
                    className="h-full w-full"
                    src={"https://www.youtube.com/embed/" + IMPACT_VIDEO_ID}
                    title="Career Development and Exploration Program video"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 border-l border-white/10 bg-gradient-to-r from-[#101d32]/20 to-transparent" />
              </div>
            </div>
            <div className="grid gap-5 border-t border-white/15 px-7 py-6 sm:grid-cols-3 sm:px-10 lg:px-12">
              <div className="flex items-center gap-3">
                <School className="h-5 w-5 shrink-0 text-amber-200" />
                <span className="text-sm text-white/75">
                  <strong className="block text-xl text-white">5</strong>
                  Schools engaged
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 shrink-0 text-amber-200" />
                <span className="text-sm text-white/75">
                  <strong className="block text-xl text-white">600+</strong>
                  Learners at one school visit
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 shrink-0 text-amber-200" />
                <span className="text-sm text-white/75">
                  <strong className="block text-base text-white">Basic schools</strong>
                  Primary and Junior High
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background px-6 py-14 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-border bg-card p-7 sm:p-9 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Work with us</p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              Help extend the reach of meaningful programmes.
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              We welcome conversations with schools, institutions, professionals, businesses and
              community partners interested in supporting responsible social and educational work.
            </p>
          </div>
          <Link to="/support">
            <Button className="shrink-0 gap-2">
              Partner with Amineva Impact
              <HeartHandshake className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AminevaImpactPage;
