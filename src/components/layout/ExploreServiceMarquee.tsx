import { ArrowUpRight, BriefcaseBusiness, Compass, GraduationCap, Layers3, Leaf, Wallet, BrainCircuit, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  { label: "Info Solutions", href: "https://info.amineva.com", external: true, Icon: Compass },
  { label: "Career & Education", href: "/explore/career-education", Icon: GraduationCap },
  { label: "AgroClimate", href: "https://agro.amineva.com", external: true, Icon: Leaf },
  { label: "DataLens", status: "In development", Icon: Sparkles },
  { label: "Sikasem", href: "https://ops.amineva.com", external: true, Icon: Wallet },
  { label: "Inventra", href: "https://stock.amineva.com", external: true, Icon: Package },
  { label: "Dipa", href: "https://ode.amineva.com", external: true, Icon: BrainCircuit },
  { label: "Amineva Workspace", href: "/workspace", Icon: Layers3 },
];

function ServiceItem({ service }: { service: typeof services[number] }) {
  const Icon = service.Icon;
  const content = (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.045] px-4 py-2 text-xs font-medium text-white/85 transition-colors hover:border-amber-300/50 hover:bg-white/[0.09] hover:text-white">
      <Icon className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
      <span>{service.label}</span>
      {service.status ? (
        <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">{service.status}</span>
      ) : (
        <ArrowUpRight className="h-3 w-3 text-white/45" aria-hidden="true" />
      )}
    </span>
  );

  if (!service.href) return <span>{content}</span>;
  if (service.external) {
    return <a href={service.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${service.label}`}>{content}</a>;
  }
  return <Link to={service.href} aria-label={`Open ${service.label}`}>{content}</Link>;
}

export default function ExploreServiceMarquee() {
  return (
    <section className="explore-service-marquee relative overflow-hidden border-t border-white/10 bg-[#101D32] py-3.5 text-white" aria-label="Amineva Global services">
      <div className="mx-auto mb-2 flex max-w-7xl items-center gap-2 px-5 sm:px-6">
        <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Explore our services</p>
      </div>
      <div className="explore-marquee-viewport">
        <div className="explore-marquee-track">
          <div className="explore-marquee-group">
            {services.map((service) => <ServiceItem key={service.label} service={service} />)}
          </div>
          <div className="explore-marquee-group" aria-hidden="true">
            {services.map((service) => (
              <span key={service.label} className="pointer-events-none">{/* visual duplicate for a seamless loop */}<span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.045] px-4 py-2 text-xs font-medium text-white/85"><service.Icon className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /><span>{service.label}</span>{service.status && <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">{service.status}</span>}{!service.status && <ArrowUpRight className="h-3 w-3 text-white/45" aria-hidden="true" />}</span></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
