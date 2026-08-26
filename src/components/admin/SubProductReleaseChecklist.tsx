import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/appwrite/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, RefreshCw, Rocket } from "lucide-react";

interface AppRow {
  id: string;
  app_slug: string;
  app_name: string;
  app_type: string;
  status: string;
}

type ChecklistState = Record<string, { env: boolean; gate: boolean }>;

const STORAGE_KEY = "suite_release_checklist";

const loadState = (): ChecklistState => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export default function SubProductReleaseChecklist() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [state, setState] = useState<ChecklistState>(() => loadState());
  const [loading, setLoading] = useState(false);

  const loadApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select("id, app_slug, app_name, app_type, status")
      .neq("app_slug", "suite")
      .order("app_name");
    setApps((data as AppRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const completion = useMemo(() => {
    const total = apps.length * 2;
    const done = apps.reduce((sum, app) => {
      const row = state[app.app_slug];
      return sum + (row?.env ? 1 : 0) + (row?.gate ? 1 : 0);
    }, 0);
    return { done, total };
  }, [apps, state]);

  const toggle = (slug: string, key: "env" | "gate") => {
    setState((current) => ({
      ...current,
      [slug]: {
        env: current[slug]?.env ?? false,
        gate: current[slug]?.gate ?? false,
        [key]: !(current[slug]?.[key] ?? false),
      },
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Sub-product Release Checklist
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={completion.done === completion.total && completion.total > 0 ? "default" : "secondary"}>
            {completion.done}/{completion.total} ready
          </Badge>
          <Button variant="ghost" size="icon" onClick={loadApps} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {apps.map((app) => {
          const row = state[app.app_slug] ?? { env: false, gate: false };
          const ready = row.env && row.gate;
          return (
            <div key={app.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">{app.app_name}</div>
                  <code className="text-xs text-muted-foreground">VITE_APP_SLUG={app.app_slug}</code>
                </div>
                <Badge variant={ready ? "default" : "outline"} className="gap-1">
                  {ready ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {ready ? "Release ready" : "Blocked"}
                </Badge>
              </div>

              <label className="flex items-start gap-3 text-sm text-foreground">
                <Checkbox checked={row.env} onCheckedChange={() => toggle(app.app_slug, "env")} />
                <span>Deployment environment is set to <code>VITE_APP_SLUG={app.app_slug}</code>.</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-foreground">
                <Checkbox checked={row.gate} onCheckedChange={() => toggle(app.app_slug, "gate")} />
                <span>Protected routes are wrapped with <code>AppAuthGate</code> before dashboard rendering.</span>
              </label>
            </div>
          );
        })}

        {!loading && apps.length === 0 && (
          <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            No enrolled sub-products found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
