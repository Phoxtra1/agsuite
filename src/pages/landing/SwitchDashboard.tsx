import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  AlertCircle,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Layers3,
  ReceiptText,
  Repeat2,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BillingView = "invoices" | "subscriptions" | "payments";

const connectedProducts = [
  { name: "Inventra", description: "Inventory, sales and customer invoices" },
  { name: "DataLens", description: "Service quotations, invoices and verified payments" },
  { name: "SikaSem", description: "Approved financial-product billing records" },
  { name: "AgroClimate", description: "Agricultural service billing, where applicable" },
  { name: "Adesua", description: "Education service billing, where applicable" },
];

const viewCopy: Record<BillingView, { title: string; description: string; empty: string }> = {
  invoices: {
    title: "No invoices to display",
    description: "Invoices issued by connected Amineva applications will appear here with their due dates, balances and originating application.",
    empty: "Invoices will appear here when an application billing feed is connected.",
  },
  subscriptions: {
    title: "No subscriptions to display",
    description: "Active, paused, past-due and cancelled subscriptions will be consolidated here. Products that do not use subscriptions will not appear as subscriptions.",
    empty: "Subscription records will appear here when an application billing feed is connected.",
  },
  payments: {
    title: "No payments to display",
    description: "Only payments verified by the originating application backend will be shown. Switch does not process payments or infer success from browser redirects.",
    empty: "Verified payment records will appear here when an application billing feed is connected.",
  },
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof ReceiptText;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

export default function SwitchDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<BillingView>("invoices");
  const [application, setApplication] = useState("all");
  const [search, setSearch] = useState("");
  const activeCopy = viewCopy[activeView];

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return connectedProducts.filter((product) => {
      const matchesApplication = application === "all" || product.name === application;
      const matchesSearch = !term || `${product.name} ${product.description}`.toLowerCase().includes(term);
      return matchesApplication && matchesSearch;
    });
  }, [application, search]);

  return (
    <main className="min-h-[75vh] bg-background px-4 py-7 text-foreground sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              <Layers3 className="h-3.5 w-3.5" /> Amineva Global · Account finance
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Amineva Switch</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              One place to monitor invoices, subscriptions and verified payments across your Amineva applications.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground">Account</p>
            <p className="mt-1 max-w-[260px] truncate font-medium">{user?.email || "Your Amineva account"}</p>
          </div>
        </header>

        <section aria-label="Billing connection status" className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-semibold">Application billing feeds are not connected yet</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The Switch dashboard is ready to display consolidated billing records, but the secure server-side ingestion and read API have not been enabled. No live invoices, subscriptions or payments are available here yet. This page will not invent totals or transaction history.
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Billing overview" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Outstanding invoices" value="—" detail="Awaiting connected invoice data" icon={ReceiptText} />
          <MetricCard label="Paid this month" value="—" detail="Verified payment totals only" icon={CircleDollarSign} />
          <MetricCard label="Active subscriptions" value="—" detail="Across connected applications" icon={Repeat2} />
          <MetricCard label="Recent transactions" value="—" detail="Latest verified payment activity" icon={CreditCard} />
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold">Billing records</h2>
              <p className="mt-1 text-sm text-muted-foreground">Browse the consolidated billing view by record type.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Application</span>
              <select
                aria-label="Filter by application"
                value={application}
                onChange={(event) => setApplication(event.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All applications</option>
                {connectedProducts.map((product) => <option key={product.name} value={product.name}>{product.name}</option>)}
              </select>
            </label>
          </div>

          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as BillingView)} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-3 sm:inline-grid sm:w-auto">
              <TabsTrigger value="invoices" className="gap-2"><FileText className="h-4 w-4" /> Invoices</TabsTrigger>
              <TabsTrigger value="subscriptions" className="gap-2"><Repeat2 className="h-4 w-4" /> Subscriptions</TabsTrigger>
              <TabsTrigger value="payments" className="gap-2"><Wallet className="h-4 w-4" /> Payments</TabsTrigger>
            </TabsList>
            {(["invoices", "subscriptions", "payments"] as BillingView[]).map((view) => (
              <TabsContent key={view} value={view} className="mt-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{viewCopy[view].title.replace("No ", "").replace(" to display", "")}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{viewCopy[view].description}</p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        aria-label="Search applications"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search applications"
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 border-b border-border bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Application</span>
                    <span className="hidden sm:block">Record</span>
                    <span className="hidden sm:block">Status</span>
                    <span className="text-right">Activity</span>
                  </div>
                  {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <div key={product.name} className="grid grid-cols-4 items-center gap-3 border-b border-border px-4 py-4 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground sm:hidden">{product.description}</p>
                      </div>
                      <span className="hidden text-sm text-muted-foreground sm:block">{product.description}</span>
                      <span className="hidden sm:inline-flex"><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Not connected</span></span>
                      <span className="text-right text-xs text-muted-foreground">No feed</span>
                    </div>
                  )) : (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">No applications match this filter.</div>
                  )}
                  <div className="flex flex-col items-center px-5 py-10 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      {view === "invoices" ? <FileText className="h-5 w-5" /> : view === "subscriptions" ? <Repeat2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                    </span>
                    <p className="mt-4 font-medium">{activeCopy.title}</p>
                    <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">{activeCopy.empty}</p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <h2 className="font-semibold">Application connections</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Each product keeps its own payment provider and remains the source of truth for its billing records.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" /> Setup pending
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connectedProducts.map((product) => (
              <article key={product.name} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{product.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{product.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground">Pending</span>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Switch is a billing visibility layer. Payments, refunds and subscription changes remain with the originating application.</p>
          <Link to="/info-discovery" className="inline-flex items-center gap-1 font-medium text-foreground hover:text-accent">
            Return to Info Discovery <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
