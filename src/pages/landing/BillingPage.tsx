import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileText, Receipt, Wallet, CreditCard, BriefcaseBusiness, Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const subscriptionProducts = [
  { name: "AgroClimate", description: "Agricultural and climate intelligence services." },
  { name: "Sikasɛm", description: "Financial operations and management services." },
  { name: "Adesua", description: "Practical learning and education services." },
];

export default function BillingPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-[70vh] bg-background px-5 py-9 text-foreground md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <Wallet className="h-4 w-4" /> Account services
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Payments &amp; Billing</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              View the payment model for each Amineva service and keep billing activity under this account.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="mt-1 font-medium">{user?.email || "Your Amineva account"}</p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <h2 className="font-semibold">Payment processing connection</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The billing area is available in your portal, but a verified payment provider has not yet been connected to this application. No payment will be requested or marked as successful until the provider connection and server-side verification are configured.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-accent" />
              <div>
                <h2 className="font-semibold">Workspace</h2>
                <p className="text-xs text-muted-foreground">Free productivity access</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Amineva Workspace is available through your existing portal account. It does not require a separate paid subscription or another registration.
            </p>
            <Link to="/workspace" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Open Workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-accent" />
              <div>
                <h2 className="font-semibold">Service quotations and invoices</h2>
                <p className="text-xs text-muted-foreground">Info Services model</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Info Services engagements follow a scoped service request, quotation, customer acceptance, invoice and verified payment process—not an automatic recurring subscription.
            </p>
            <Link to="/explainer/info-services" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Explore Info Services <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>

        <section className="mt-7 rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <div>
              <h2 className="font-semibold">Subscription-based services</h2>
              <p className="text-xs text-muted-foreground">Subscription lifecycle will be managed from this account.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {subscriptionProducts.map((product) => (
              <article key={product.name} className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold">{product.name}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{product.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-accent" /> Invoices</div>
            <p className="mt-2 text-sm text-muted-foreground">Invoices will appear here after the billing service is connected and an invoice has been issued to your account.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4 text-accent" /> Payment history</div>
            <p className="mt-2 text-sm text-muted-foreground">Verified payments and transaction references will appear here. No transactions are fabricated or assumed.</p>
          </div>
        </section>
        <div className="mt-8">
          <Link to="/info-discovery" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Compass className="h-4 w-4" /> Return to Info Discovery
          </Link>
        </div>
      </div>
    </main>
  );
}
