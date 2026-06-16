import { useNavigate } from "react-router-dom";
import { WORKSPACE_MODULES } from "@/lib/workspace/modules";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function WorkspaceDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth() as any;
  const first = (user?.email || "there").split("@")[0];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-medium mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Workspace · Data Intelligence Hub
        </div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {first}.</h1>
        <p className="text-muted-foreground mt-1">
          Your unified surface for productivity and structured intelligence.
        </p>
      </header>

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
