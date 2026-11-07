import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import aminevaLogo from "@/assets/amv_global_logo.png";

type CountryLookupResponse = {
  country?: string | null;
};

type RegionDisplayNamesConstructor = new (
  locales?: string | string[],
  options?: { type: "region" },
) => {
  of: (code: string) => string | undefined;
};

const getCountryName = (countryCode: string): string => {
  const normalizedCode = countryCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    return "Worldwide";
  }

  try {
    const DisplayNames = (Intl as unknown as {
      DisplayNames?: RegionDisplayNamesConstructor;
    }).DisplayNames;

    if (DisplayNames) {
      return new DisplayNames(["en"], { type: "region" }).of(normalizedCode) ?? "Worldwide";
    }
  } catch {
    // Keep the footer useful on browsers without regional display-name support.
  }

  return normalizedCode;
};

const companyLinks = [
  { label: "About Us", to: "/about-us" },
  { label: "Information Discovery System", to: "/info-discovery" },
  { label: "Amineva Impact", to: "/impact" },
];

const platformLinks = [
  { label: "Amineva Suite", to: "/explainer/workspace" },
  { label: "Inventra", to: "/apps/inventra" },
  { label: "DataLens", to: "/explainer/datalens" },
  { label: "AgroClimate", to: "/apps/agroclimate" },
  { label: "Adesua", to: "/apps/adesua" },
  { label: "Sikasɛm", to: "/explainer/sikasem" },
  { label: "ABI", to: "/explainer/abi" },
];

const helpLinks = [
  { label: "Support", to: "/support" },
  { label: "FAQs", to: "/faqs" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

export default function GlobalFooter() {
  const [countryName, setCountryName] = useState("Worldwide");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);

    fetch("https://api.country.is/", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Country lookup failed with status ${response.status}`);
        }
        return response.json() as Promise<CountryLookupResponse>;
      })
      .then((data) => {
        if (typeof data.country === "string" && data.country.trim()) {
          setCountryName(getCountryName(data.country));
        }
      })
      .catch(() => {
        // Keep the neutral Worldwide label if location lookup is unavailable.
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

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
            Information Discovery System
          </p>
          <p className="text-sm leading-relaxed text-white/65">
            Amineva Global is an Information Discovery System that organises knowledge into connected subject areas, guided investigations, evidence standards and original sources. It helps people and organisations understand a subject, assess information and identify informed next steps.
          </p>
        </div>

        <nav aria-label="Company links" className="min-w-0">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            Company
          </h2>
          <ul className="space-y-2">
            {companyLinks.map((link) => (
              <li key={link.to}>
                <Link className={linkClass} to={link.to}>{link.label}</Link>
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
            <span>{countryName}</span>
            <span aria-hidden="true">·</span>
            <span>Global outlook</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
