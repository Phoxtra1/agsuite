import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Globe2,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import amvLogo from "@/assets/amv_global_logo.png";
import discoverySearch from "@/assets/info-discovery/discovery-search.svg";
import connectedKnowledge from "@/assets/info-discovery/connected-knowledge.svg";
import researchInsight from "@/assets/info-discovery/research-insight.svg";
import worldOfIdeas from "@/assets/info-discovery/world-of-ideas.svg";

type RegionState = { countryId: string; countryLabel: string };

function readRegionFromStorage(): RegionState | null {
  try {
    const raw = localStorage.getItem("agstock_region");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const countryId = String(parsed?.countryId || "").trim();
    const countryLabel = String(parsed?.countryLabel || "").trim();
    if (!countryId || !countryLabel) return null;
    return { countryId, countryLabel };
  } catch {
    return null;
  }
}

function getTimeZone(countryId: string): string {
  const id = (countryId || "").toLowerCase();
  switch (id) {
    case "ashanti":
    case "ghana": return "Africa/Accra";
    case "nigeria": return "Africa/Lagos";
    case "kenya": return "Africa/Nairobi";
    case "south-africa": return "Africa/Johannesburg";
    case "cfa-zone": return "Africa/Abidjan";
    case "finland": return "Europe/Helsinki";
    case "united-kingdom": return "Europe/London";
    default: return "Etc/UTC";
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [settingsOpen]);

  const region = useMemo(() => readRegionFromStorage(), []);
  const timeZone = useMemo(() => getTimeZone(region?.countryId || "ghana"), [region]);
  const localTime = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(now),
    [now, timeZone],
  );
  const localDate = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "long", year: "numeric" }).format(now),
    [now, timeZone],
  );

  const enterPortal = () => navigate(isAuthenticated ? "/info-discovery" : "/get-started?mode=register");

  return (
    <main className="min-h-screen w-full bg-background lg:grid lg:grid-cols-[minmax(340px,0.92fr)_minmax(0,1.08fr)]">
      <section
        aria-label="Amineva Global"
        className="relative isolate flex min-h-[380px] flex-col overflow-hidden bg-[#111e34] px-6 py-7 text-white md:min-h-[460px] md:px-9 lg:min-h-screen lg:px-10"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_28%,rgba(90,110,170,0.25),transparent_42%),linear-gradient(145deg,#111e34,#182944_60%,#101d32)]" />
        <div className="flex items-center gap-3">
          <img src={amvLogo} alt="Amineva Global" className="h-12 w-12 rounded-full object-contain" />
          <div>
            <p className="text-base font-semibold tracking-wide">Amineva Global</p>
            <p className="text-[11px] text-white/60">Information Discovery System</p>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="relative flex h-[min(70vw,390px)] w-[min(70vw,390px)] items-center justify-center">
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                className="absolute rounded-full border border-white/10"
                style={{ inset: `${ring * 34}px` }}
              />
            ))}
            <div className="absolute h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
              <Compass className="h-8 w-8 text-accent" />
            </div>
            {[
              { top: "8%", left: "48%", icon: BookOpen, label: "Knowledge" },
              { top: "47%", left: "0%", icon: Search, label: "Research" },
              { top: "45%", right: "0%", icon: ShieldCheck, label: "Evidence" },
              { bottom: "7%", left: "40%", icon: Globe2, label: "Sources" },
            ].map((item) => (
              <div
                key={item.label}
                className="absolute flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-xs text-white/80 shadow-lg backdrop-blur"
                style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
              >
                <item.icon className="h-4 w-4 text-accent" /> {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-2xl font-semibold tracking-tight">{localTime}</p>
            <p className="mt-1 text-xs text-white/60">{localDate} · {region?.countryLabel || "Worldwide"}</p>
          </div>
          <p className="max-w-[190px] text-right text-xs leading-5 text-white/60">
            Connected subjects. Traceable sources. Clearer understanding.
          </p>
        </div>
      </section>

      <section className="flex min-w-0 flex-col px-5 py-6 text-foreground sm:px-8 md:py-8 lg:px-10 lg:py-9">
        <header className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 text-sm font-medium text-muted-foreground">
          <button type="button" onClick={() => navigate("/info-discovery")} className="text-foreground transition hover:text-primary">Information Discovery</button>
          <button type="button" onClick={() => navigate("/about-us")} className="transition hover:text-foreground">About Us</button>
          <button type="button" onClick={() => navigate("/faqs")} className="transition hover:text-foreground">FAQs</button>
          <button type="button" onClick={() => navigate("/support")} className="transition hover:text-foreground">Support</button>
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
              className="inline-flex items-center gap-1.5 transition hover:text-foreground"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-border bg-card p-3 shadow-xl"
                >
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
                  <button
                    type="button"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={enterPortal}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {isAuthenticated ? "Open Portal" : "Get Started"}
          </button>
        </header>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10 lg:py-14">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <Compass className="h-4 w-4" /> Information Discovery System
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl xl:text-5xl">
            Discover information. Understand the evidence. Make informed next steps.
          </h1>
          <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
            Amineva Global is an Information Discovery System. It organises knowledge into connected subject areas, guided investigation topics, key questions, evidence standards and original sources. It helps people and organisations move from a broad question to a clearer understanding of what is known, where information comes from, what remains uncertain, and what should be examined next.
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            Rather than treating information as disconnected pages or asking people to accept an unsupported answer, the system provides a structured route through context, evidence and authoritative source material. Practical tools and services are introduced only when they genuinely support the next step.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">Structured discovery</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Move from a broad subject to focused investigation questions.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">Evidence and provenance</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Understand who published information, its context and limitations.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <Globe2 className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">Original sources</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Follow references to the organisations and institutions responsible for source information.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">Practical next steps</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Find relevant tools, services and pathways where they fit the subject.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/info-discovery")}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Explore Information Discovery <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={enterPortal}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold transition hover:bg-muted"
            >
              {isAuthenticated ? "Enter your portal" : "Get Started"}
            </button>
          </div>
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Amineva Global. All rights reserved.</span>
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate("/terms")} className="hover:text-foreground">Terms of Service</button>
            <button type="button" onClick={() => navigate("/privacy")} className="hover:text-foreground">Privacy Policy</button>
          </div>
        </footer>
      </section>
    </main>
  );
}
