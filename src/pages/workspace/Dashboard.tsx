import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WORKSPACE_MODULES } from "@/lib/workspace/modules";
import { useWorkspaceSession } from "@/components/workspace/WorkspaceGate";
import { Sparkles, FileText, Sheet, Presentation, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { listDocuments } from "@/lib/workspace/documents";
import { listSheets } from "@/lib/workspace/sheets/documents";
import { listDecks } from "@/lib/workspace/slides/documents";
import { listForms } from "@/lib/workspace/forms/documents";

interface RecentItem {
  id: string;
  title: string;
  kind: "Doc" | "Sheet" | "Slides" | "Form";
  route: string;
  updated: number;
  icon: typeof FileText;
}

export default function WorkspaceDashboard() {
  const navigate = useNavigate();
  const { userId, email, profile } = useWorkspaceSession();
  const displayName = profile?.display_name || email || "there";
  const first = displayName.split("@")[0];

  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [counts, setCounts] = useState({ docs: 0, sheets: 0, slides: 0, forms: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRecent([]);
    setCounts({ docs: 0, sheets: 0, slides: 0, forms: 0 });

    (async () => {
      const [docs, sheets, decks, forms] = await Promise.all([
        listDocuments().catch(() => []),
        listSheets().catch(() => []),
        listDecks().catch(() => []),
        listForms().catch(() => []),
      ]);
      if (cancelled) return;

      const items: RecentItem[] = [
        ...docs.map((d: any) => ({
          id: d.id,
          title: d.title || "Untitled document",
          kind: "Doc" as const,
          route: `/workspace/docs/${d.id}`,
          updated: new Date(d.updated_at).getTime(),
          icon: FileText,
        })),
        ...sheets.map((s: any) => ({
          id: s.id,
          title: s.title || "Untitled sheet",
          kind: "Sheet" as const,
          route: `/workspace/sheets/${s.id}`,
          updated: new Date(s.updated_at).getTime(),
          icon: Sheet,
        })),
        ...decks.map((s: any) => ({
          id: s.id,
          title: s.title || "Untitled presentation",
          kind: "Slides" as const,
          route: `/workspace/slides/${s.id}`,
          updated: new Date(s.updated_at).getTime(),
          icon: Presentation,
        })),
        ...forms.map((f: any) => ({
          id: f.id,
          title: f.title || "Untitled form",
          kind: "Form" as const,
          route: `/workspace/forms/${f.id}`,
          updated: new Date(f.updatedAt ?? f.updated_at ?? Date.now()).getTime(),
          icon: ClipboardList,
        })),
      ].sort((a, b) => b.updated - a.updated);

      setCounts({
        docs: docs.length,
        sheets: sheets.length,
        slides: decks.length,
        forms: forms.length,
      });
      setRecent(items.slice(0, 6));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const stats = [
    { label: "Documents", value: counts.docs },
    { label: "Sheets", value: counts.sheets },
    { label: "Presentations", value: counts.slides },
    { label: "Forms", value: counts.forms },
  ];

  return (
    <div className="max-w-6xl mx-auto p-5 sm:p-8">
      <header className="mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-medium mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Amineva Workspace
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, {first}.</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {email ? <>Signed in as <span className="font-medium text-foreground">{email}</span>. Everything below belongs to this account only.</> : "Guest Workspace · Saved on this device"}
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-2xl border border-border bg-card">
            <div className="text-2xl font-bold text-foreground">{loading ? "—" : s.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Recent work
        </h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading your work…</div>
        ) : recent.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Nothing here yet — create your first document, sheet or presentation below.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={() => navigate(r.route)}
                  className="text-left p-4 rounded-2xl border border-border bg-card hover:border-accent/60 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-wider">{r.kind}</span>
                  </div>
                  <div className="font-medium text-foreground truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(r.updated).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Tools
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WORKSPACE_MODULES.map((m) => {
            const Icon = m.icon;
            const active = m.status === "active";
            return (
              <button
                key={m.id}
                onClick={() => {
                  if (active && m.route) navigate(m.route);
                  else
                    toast({
                      title: `${m.name} is coming soon`,
                      description: "We'll let you know the moment it's ready.",
                    });
                }}
                className={`text-left p-5 rounded-2xl border transition group ${
                  active
                    ? "border-border bg-card hover:border-accent/60 hover:shadow-md"
                    : "border-dashed border-border bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${m.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{m.name}</h3>
                  {!active && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
