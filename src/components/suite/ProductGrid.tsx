import { useEffect, useMemo, useState } from "react";
import { ensureProfile, getCurrentUser, type ProfileDoc } from "../lib/profile";

// If you already have your own icon components, swap these.
// lucide-react is common; if you don’t have it installed, tell me and I’ll rewrite icons as SVG inline.
import { Globe, Boxes, BarChart3, ShieldCheck, Settings, Clock } from "lucide-react";

type ProductKey = "hub" | "agis" | "agstock" | "amniva" | "ops";
type ProductStatus = "live" | "coming_soon" | "off";

type ProductItem = {
  key: ProductKey;
  name: string;
  url?: string; // ops can be undefined since not created yet
  enabled: boolean;
  status: ProductStatus;
  description: string;
  icon: React.ReactNode;
};

const PRODUCTS: ProductItem[] = [
  {
    key: "hub",
    name: "AG Hub",
    url: "https://hub.amineva.com",
    enabled: true,
    status: "live",
    description: "Reports, insights & publications.",
    icon: <Globe size={28} />,
  },
  {
    key: "agis",
    name: "AG App",
    url: "https://app.amineva.com",
    enabled: true,
    status: "live",
    description: "Intelligence system and operational tools.",
    icon: <Boxes size={28} />,
  },
  {
    key: "ops",
    name: "AG Ops",
    url: undefined,
    enabled: false,
    status: "coming_soon",
    description: "Service operations tools (coming soon).",
    icon: <Clock size={28} />,
  },
  {
    key: "agstock",
    name: "AG Stock",
    url: "https://stock.amineva.com",
    enabled: true,
    status: "live",
    description: "Stock & inventory management.",
    icon: <BarChart3 size={28} />,
  },
  {
    key: "amniva",
    name: "Amniva",
    url: "https://www.amniva.io",
    enabled: false,
    status: "off",
    description: "Verify & predictions (currently inactive).",
    icon: <ShieldCheck size={28} />,
  },
];

function statusBadge(status: ProductStatus) {
  if (status === "live") return { label: "Live", tone: "live" as const };
  if (status === "coming_soon") return { label: "Coming Soon", tone: "soon" as const };
  return { label: "Off", tone: "off" as const };
}

export function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileDoc | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        const prof = await ensureProfile(user.$id);
        setProfile(prof);

        // If onboarding not complete, send back to AppEntry (your Step 2 route)
        if (!prof.onboardingComplete) {
          window.location.href = "/";
          return;
        }
      } catch {
        window.location.href = "/login";
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const enabledSet = useMemo(() => new Set(profile?.enabledProducts ?? []), [profile]);

  function canOpen(p: ProductItem) {
    // 1) globally enabled
    if (!p.enabled) return false;
    // 2) user enabledProducts must include it (prevents wandering)
    if (!enabledSet.has(p.key as any)) return false;
    // 3) must be live with a url
    if (p.status !== "live") return false;
    if (!p.url) return false;
    return true;
  }

  function handleOpen(p: ProductItem) {
    if (canOpen(p)) {
      window.location.href = p.url!;
      return;
    }

    // Messages kept simple and user-friendly
    if (!enabledSet.has(p.key as any)) {
      alert("This product isn’t active for your account yet.");
      return;
    }
    if (!p.enabled || p.status === "off") {
      alert("This product is currently turned off.");
      return;
    }
    if (p.status === "coming_soon") {
      alert("This product is coming soon.");
      return;
    }
    alert("This product is not available right now.");
  }

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!profile) return null;

  const isAdmin = (profile as any).isAdmin === true; // only if you add isAdmin to profile later

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Products</h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Click a product to continue.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => (window.location.href = "/settings/products")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}
          >
            <Settings size={18} />
            Product Settings
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {PRODUCTS.map((p) => {
          const badge = statusBadge(p.status);
          const clickable = canOpen(p);

          return (
            <div
              key={p.key}
              onClick={() => handleOpen(p)}
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                padding: 18,
                cursor: clickable ? "pointer" : "not-allowed",
                opacity: p.enabled ? 1 : 0.65,
                transition: "transform 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (clickable) (e.currentTarget.style.transform = "translateY(-2px)");
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {p.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.75, marginTop: 3 }}>{p.description}</div>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background:
                      badge.tone === "live"
                        ? "rgba(255,255,255,0.08)"
                        : badge.tone === "soon"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.03)",
                    opacity: 0.95,
                  }}
                >
                  {badge.label}
                </span>

                {!enabledSet.has(p.key as any) && (
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Not assigned</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
