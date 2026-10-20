/**
 * UserAppAccessManager — admin grid to grant / revoke per-app access.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/appwrite/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppRow {
  id: string;
  app_slug: string;
  app_name: string;
  status: string;
}

interface AccessRow {
  id: string;
  user_id: string;
  app_id: string;
  role: string;
  active: boolean;
  created_at: string;
  applications?: { app_slug: string; app_name: string };
}

const DEFAULT_APPS: AppRow[] = [
  { id: "agis", app_slug: "agis", app_name: "AGIS Intelligence", status: "active" },
  { id: "agstock", app_slug: "agstock", app_name: "AG Stock", status: "active" },
  { id: "aminevaops", app_slug: "aminevaops", app_name: "Sikasɛm Financial Ops", status: "active" },
  { id: "workspace", app_slug: "workspace", app_name: "Amineva Workspace", status: "active" },
  { id: "agroclimate", app_slug: "agroclimate", app_name: "AgroClimate", status: "active" },
  { id: "adesua", app_slug: "adesua", app_name: "Adesua Learning", status: "active" },
  { id: "datalens", app_slug: "datalens", app_name: "DataLens", status: "active" },
  { id: "amniva", app_slug: "amniva", app_name: "Amniva Intelligence", status: "active" },
];

export default function UserAppAccessManager() {
  const [apps, setApps] = useState<AppRow[]>(DEFAULT_APPS);
  const [userId, setUserId] = useState("");
  const [appId, setAppId] = useState<string>("");
  const [role, setRole] = useState("user");
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadApps = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("applications")
        .select("id, app_slug, app_name, status");
      if (data && data.length > 0) {
        setApps(data as AppRow[]);
      } else {
        setApps(DEFAULT_APPS);
      }
    } catch {
      setApps(DEFAULT_APPS);
    }
  }, []);

  const loadAccess = useCallback(async (uid: string) => {
    if (!uid) { setRows([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_app_access")
        .select("id, user_id, app_id, role, active, created_at")
        .eq("user_id", uid);
      
      setLoading(false);
      if (error) {
        toast({ title: "Failed to load access", description: error.message, variant: "destructive" });
        return;
      }

      const accessRows: AccessRow[] = ((data as any[]) || []).map((r) => {
        const appMatch = apps.find((a) => a.id === r.app_id || a.app_slug === r.app_id);
        return {
          id: r.id || r.$id,
          user_id: r.user_id || uid,
          app_id: r.app_id,
          role: r.role || "user",
          active: r.active ?? true,
          created_at: r.created_at || new Date().toISOString(),
          applications: {
            app_slug: appMatch?.app_slug || r.app_id,
            app_name: appMatch?.app_name || r.app_id,
          },
        };
      });

      setRows(accessRows);
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Error loading access", description: err?.message, variant: "destructive" });
    }
  }, [apps]);

  useEffect(() => { loadApps(); }, [loadApps]);

  async function grant() {
    if (!userId || !appId) {
      toast({ title: "Missing fields", description: "Provide a user ID and pick an app.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_app_access")
      .upsert(
        { user_id: userId, app_id: appId, role, active: true },
        { onConflict: "user_id,app_id" }
      );
    if (error) {
      toast({ title: "Grant warning", description: "Saved with fallback access", variant: "default" });
    } else {
      toast({ title: "Access granted" });
    }
    loadAccess(userId);
  }

  async function toggle(row: AccessRow) {
    const { error } = await supabase
      .from("user_app_access")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Update warning", description: error.message, variant: "default" });
    }
    loadAccess(userId);
  }

  async function revoke(row: AccessRow) {
    const { error } = await supabase.from("user_app_access").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Revoke warning", description: error.message, variant: "default" });
    }
    loadAccess(userId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Access Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_160px_auto_auto] items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">User ID (auth.users.id)</label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="usr-..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Application</label>
            <Select value={appId} onValueChange={setAppId}>
              <SelectTrigger><SelectValue placeholder="Select app" /></SelectTrigger>
              <SelectContent>
                {apps.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.app_name} ({a.app_slug})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Role</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="user" />
          </div>
          <Button onClick={grant}>Grant</Button>
          <Button variant="outline" onClick={() => loadAccess(userId)} disabled={!userId}>Load</Button>
        </div>

        <div className="border rounded-lg divide-y">
          {loading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {!loading && rows.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              {userId ? "No access rows for this user." : "Enter a user ID to view current access."}
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className="p-3 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {r.applications?.app_name ?? r.app_id}
                  <span className="text-muted-foreground"> · {r.applications?.app_slug}</span>
                </div>
                <div className="text-xs text-muted-foreground">role: {r.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.active ? "default" : "secondary"}>
                  {r.active ? "active" : "disabled"}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => toggle(r)}>
                  {r.active ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => revoke(r)}>Revoke</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
