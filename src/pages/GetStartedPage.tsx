import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Compass, ShieldCheck, Wallet, BriefcaseBusiness } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthCard from "@/components/home/AuthCard";
import type { ProductData } from "@/types/product";

const portalAccount: ProductData = {
  id: "information-discovery",
  name: "Info Discovery",
  shortName: "Amineva Global",
  description: "One account for Info Discovery, Workspace and Payments & Billing.",
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
    if (!isLoading && isAuthenticated) navigate("/info-discovery", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-5 py-10 text-foreground md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:gap-16">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Compass className="h-4 w-4" /> Amineva Global account
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            One account. One Info Discovery portal.
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground">
            Sign in or create your account once. You will enter Info Discovery first, with Workspace and Payments &amp; Billing available from the same portal and the same signed-in account.
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
            <div className="rounded-2xl border border-border bg-card p-4">
              <Wallet className="h-5 w-5 text-accent" />
              <h2 className="mt-3 text-sm font-semibold">Payments &amp; Billing</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Manage service quotations, invoices and payment records from the same account.</p>
            </div>
          </div>
          <p className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
            Your account is the shared sign-in for the portal. Individual products may keep their own operational systems.
          </p>
        </section>

        <section className="w-full" aria-label="Sign in or create an Amineva Global account">
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
          <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
            After successful sign-in, Info Discovery opens. Workspace does not ask you to register or sign in again.
          </p>
        </section>
      </div>
    </main>
  );
}
