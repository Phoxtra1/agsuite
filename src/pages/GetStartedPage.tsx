import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { PUBLIC_AUTH_PAUSED, publicEntryPath } from "@/lib/auth/availability";
import { Compass, BriefcaseBusiness } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthCard from "@/components/home/AuthCard";
import type { ProductData } from "@/types/product";

const portalAccount: ProductData = {
  id: "information-discovery",
  name: "Info Discovery",
  shortName: "Amineva Global",
  description: "Explore Info Discovery.",
  status: "live",
  order: 0,
};

export default function GetStartedPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [authTab, setAuthTab] = useState<"signin" | "register">(
    params.get("mode") === "register" ? "register" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    if (PUBLIC_AUTH_PAUSED) return;
    if (!isLoading && isAuthenticated) navigate("/info-discovery", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (PUBLIC_AUTH_PAUSED) return <Navigate to={publicEntryPath(params.get("returnTo"))} replace />;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-5 py-10 text-foreground md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:gap-16">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Compass className="h-4 w-4" />
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Welcome to Amineva Global
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground">
            Sign in to continue to your selected service.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <Compass className="h-5 w-5 text-accent" />
              <h2 className="mt-3 text-sm font-semibold">Info Discovery</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Explore connected subjects, investigation guides and original sources.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <BriefcaseBusiness className="h-5 w-5 text-accent" />
              <h2 className="mt-3 text-sm font-semibold">Workspace</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Open Docs, Sheets, Slides, Forms and Drive without a second login.</p>
            </div>
          </div>
        </section>

        <section className="w-full" aria-label="Sign in or create an account">
          <AuthCard
            product={portalAccount}
            authTab={authTab}
            setAuthTab={setAuthTab}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onChangeSelection={() => navigate("/", { replace: true })}
          />
        </section>
      </div>
    </main>
  );
}
