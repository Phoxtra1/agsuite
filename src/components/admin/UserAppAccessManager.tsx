/**
 * UserAppAccessManager — admin grid to grant / revoke per-app access.
 *
 * This is the only UI for assigning user_app_access rows. Granting a row
 * automatically provisions the matching per-app profile (DB trigger).
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
  applications: { app_slug: string; app_name: string };
}

export default function UserAppAccessManager() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [userId, setUserId] = useState("");
  const [appId, setAppId] = useState<string>("");
  const [role, setRole] = useState("user");
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadApps = useCallback(async () => {
    const { data } = await supabase
      .from("applications")
      .select("id, app_slug, app_name, status")
      .order("app_name");
    setApps((data as AppRow[]) ?? []);
  }, []);

  const loadAccess = useCallback(async (uid: string) => {
    if (!uid) { setRows([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_app_access")
      .select("id, user_id, app_id, role, active, created_at, applications(app_slug, app_name)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to load access", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data as unknown as AccessRow[]) ?? []);
  }, []);

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
      toast({ title: "Grant failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Access granted" });
    loadAccess(userId);
  }

  async function toggle(row: AccessRow) {
    const { error } = await supabase
      .from("user_app_access")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    loadAccess(userId);
  }

  async function revoke(row: AccessRow) {
    const { error } = await supabase.from("user_app_access").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Revoke failed", description: error.message, variant: "destructive" });
      return;
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
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid" />
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
