import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import aminevaLogo from "@/assets/amv_global_logo.png";
import { useVisitorLocation } from "@/hooks/useVisitorLocation";

const companyLinks = [
  { label: "About Us", to: "/about-us" },
  { label: "Info Discovery", to: "/info-discovery" },
  { label: "Amineva Impact", to: "/impact" },
];

const platformLinks = [
  { label: "Inventra", to: "/apps/inventra" },
  { label: "Info Services", to: "/explainer/info-services" },
  { label: "AgroClimate", to: "/apps/agroclimate" },
  { label: "Adesua", to: "/apps/adesua" },
  { label: "Sikasɛm", to: "/explainer/sikasem" },
  { label: "Dipa AI", to: "" },
];

const helpLinks = [
  { label: "Support", to: "/support" },
  { label: "FAQs", to: "/faqs" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

export default function GlobalFooter() {
  const { locationLabel } = useVisitorLocation();

  const linkClass =
    "text-sm text-white/70 transition-colors duration-150 hover:text-amber-300 focus-visible:outline-none focus-visible:text-amber-300";

  return (
    <footer className="relative mt-16 border-t border-white/10 bg-[#101D32] text-white">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-7 px-6 py-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.85fr_1.55fr_0.85fr] lg:gap-8 lg:py-9">
        <div className="max-w-xs">
          <Link to="/" className="mb-3 inline-flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
            <img
              src={aminevaLogo}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 rounded-full object-contain"
            />
            <span className="text-base font-semibold tracking-tight text-white">
              Amineva Global
            </span>
          </Link>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-amber-300">
            Info Discovery
          </p>
          <p className="text-sm leading-relaxed text-white/65">
            Amineva Global is an Info Discovery system that helps people explore subjects and find reliable information.
          </p>
        </div>

        <nav aria-label="Company links" className="min-w-0">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            Company
          </h2>
          <ul className="space-y-2">
            {companyLinks.map((link) => (
              <li key={link.to}>
                {link.to ? <Link className={linkClass} to={link.to}>{link.label}</Link> : <span className={linkClass}>{link.label}</span>}
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Products and platforms" className="min-w-0">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            Products &amp; Platforms
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {platformLinks.map((link) => (
              <li key={link.to}>
                <Link className={linkClass} to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Support and legal links" className="min-w-0">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            Help &amp; Legal
          </h2>
          <ul className="space-y-2">
            {helpLinks.map((link) => (
              <li key={link.to}>
                <Link className={linkClass} to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Amineva Global. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5" aria-live="polite">
            <MapPin className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            <span>{locationLabel}</span>
            <span aria-hidden="true">·</span>
            <span>Global outlook</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
