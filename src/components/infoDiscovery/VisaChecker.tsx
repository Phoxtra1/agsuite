import React, { useState } from "react";
import { Plane, ExternalLink, ShieldCheck, ArrowRight, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOfficialVisaPortal, type VisaPortalInfo } from "@/lib/infoDiscovery/visaChecker";

interface VisaCheckerProps {
  countries: { iso2Code: string; name: string }[];
  defaultDestination?: string;
}

export function VisaChecker({ countries, defaultDestination = "" }: VisaCheckerProps) {
  const [passportCode, setPassportCode] = useState("GH");
  const [destinationCode, setDestinationCode] = useState(defaultDestination || "GB");
  const [portalInfo, setPortalInfo] = useState<VisaPortalInfo | null>(() => {
    const dest = defaultDestination || "GB";
    const destCountry = countries.find((c) => c.iso2Code === dest);
    return getOfficialVisaPortal("GH", dest, destCountry?.name || dest);
  });

  const handleCheck = (e?: React.FormEvent) => {
    e?.preventDefault();
    const destCountry = countries.find((c) => c.iso2Code === destinationCode);
    const destName = destCountry?.name || destinationCode;
    const res = getOfficialVisaPortal(passportCode, destinationCode, destName);
    setPortalInfo(res);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 md:p-6 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Plane className="h-4 w-4 text-primary" />
            <span>Official Visa & Entry Authority Checker</span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            A passport nationality + destination check for Travel that links directly to the responsible official government authority.
          </p>
        </div>
        <Badge variant="outline">Official Government Endpoints</Badge>
      </div>

      <form onSubmit={handleCheck} className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="passport-country" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Passport Nationality
          </label>
          <select
            id="passport-country"
            value={passportCode}
            onChange={(e) => {
              setPassportCode(e.target.value);
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {countries.map((c) => (
              <option key={c.iso2Code} value={c.iso2Code}>
                {c.name} ({c.iso2Code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="travel-destination" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Travel Destination
          </label>
          <select
            id="travel-destination"
            value={destinationCode}
            onChange={(e) => {
              setDestinationCode(e.target.value);
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {countries.map((c) => (
              <option key={c.iso2Code} value={c.iso2Code}>
                {c.name} ({c.iso2Code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90">
            Check Authority <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </form>

      {portalInfo && (
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{portalInfo.portalName}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Direct Government Link
            </Badge>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">{portalInfo.guidanceText}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={portalInfo.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Open Official Government Portal <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Compass className="h-3 w-3" />
              Never pay third-party intermediaries before checking the official government domain.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
