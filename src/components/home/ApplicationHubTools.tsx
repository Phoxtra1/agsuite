import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { ComsSDK } from "@/core/coms/sdk";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Settings, UserRound, Info, ArrowLeft, X, Sun, Moon, Check } from "lucide-react";

type HubTab = "notifications" | "settings" | "account" | "app-info";
type InboxItem = { id: string; subject: string; body: string; source_app: string | null; created_at: string; is_read: boolean; type: string; };

const PREF_KEY = "amineva_application_preferences_v1";
type Preferences = { emailNotifications: boolean; productUpdates: boolean; inAppNotifications: boolean; };
const DEFAULT_PREFS: Preferences = { emailNotifications: true, productUpdates: true, inAppNotifications: true };
function readPreferences(): Preferences {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") }; }
  catch { return DEFAULT_PREFS; }
}

export function ApplicationHubTools({ open, onOpenChange, initialTab = "notifications" }: {
  open: boolean; onOpenChange: (open: boolean) => void; initialTab?: HubTab;
}) {
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(readPreferences);

  useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);

  useEffect(() => {
    if (!open || tab !== "notifications" || !isAuthenticated || !user?.id) return;
    let active = true;
    setLoading(true);
    const load = async () => {
      const { data, error } = await supabase.from("inbound_messages").select("id,subject,body,source_app,created_at,is_read,type,target_user_id").eq("target_user_id", user.id).eq("channel", "in-app").order("created_at", { ascending: false }).limit(50);
      if (active && !error && data) setItems(data as InboxItem[]);
      if (active) setLoading(false);
    };
    void load();
    const unsubscribe = ComsSDK.subscribeToInbox((payload: any) => {
      if (!active) return;
      if (payload.eventType === "INSERT" && payload.new?.target_user_id === user.id && payload.new?.channel === "in-app") {
        setItems((current) => [payload.new as InboxItem, ...current.filter((item) => item.id !== payload.new.id)].slice(0, 50));
      } else if (payload.eventType === "UPDATE" && payload.new?.target_user_id === user.id) {
        setItems((current) => current.map((item) => item.id === payload.new.id ? payload.new as InboxItem : item));
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [open, tab, isAuthenticated, user?.id]);

  const updatePref = (key: keyof Preferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
  };

  const markRead = async (item: InboxItem) => {
    if (item.is_read) return;
    const { error } = await supabase.from("inbound_messages").update({ is_read: true }).eq("id", item.id).eq("target_user_id", user?.id);
    if (!error) setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
  };

  const unread = items.filter((item) => !item.is_read).length;
  const tabs: { id: HubTab; label: string; icon: React.ElementType }[] = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Preferences", icon: Settings },
    { id: "account", label: "Account", icon: UserRound },
    { id: "app-info", label: "App information", icon: Info },
  ];

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to Solutions" onClick={() => navigate("/explore")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="min-w-0"><h1 className="truncate text-base font-semibold">Settings</h1><p className="text-xs text-muted-foreground">Manage your Amineva account and preferences</p></div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/explore")}><X className="mr-2 h-4 w-4" /> Close</Button>
      </div>
    </header>
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:py-8">
      <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {tabs.map((entry) => { const Icon = entry.icon; return <button key={entry.id} onClick={() => setTab(entry.id)} className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition md:w-full ${tab === entry.id ? "border-primary/30 bg-primary/10 font-semibold text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}><Icon className="h-4 w-4" />{entry.label}{entry.id === "notifications" && unread > 0 && <Badge variant="destructive" className="ml-auto">{unread}</Badge>}</button>; })}
      </nav>
      <div className="min-w-0 space-y-5">
        {tab === "notifications" && <section className="space-y-3">
          <div><h2 className="text-xl font-semibold">Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Messages delivered to your account through Amineva ComsSystem.</p></div>
          {!isAuthenticated ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sign in to view notifications sent to your account.</CardContent></Card> : loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading notifications…</p> : items.length === 0 ? <Card><CardContent className="py-8 text-center"><Bell className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">No notifications yet.</p></CardContent></Card> : items.map((item) => <button key={item.id} onClick={() => void markRead(item)} className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/60 ${item.is_read ? "border-border" : "border-primary/30 bg-primary/[0.04]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{item.subject || "Amineva notification"}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{item.source_app || "Amineva"} · {new Date(item.created_at).toLocaleString()}</p></div>{!item.is_read && <Badge>New</Badge>}</div></button>)}
        </section>}
        {tab === "settings" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Preferences</h2><p className="mt-1 text-sm text-muted-foreground">Control the notifications and appearance preferences for your Amineva account.</p></div>
          <Card><CardHeader><CardTitle className="text-base">Notifications</CardTitle><CardDescription>Choose which types of updates you prefer to receive.</CardDescription></CardHeader><CardContent className="space-y-5">
            {([["inAppNotifications","In-app notifications","Show messages received through Amineva."],["emailNotifications","Email notifications","Your preference for email updates; delivery is controlled by the sending service."],["productUpdates","Product updates","Receive product announcements where supported."]] as const).map(([key,label,desc]) => <div key={key} className="flex items-center justify-between gap-4"><div><Label>{label}</Label><p className="mt-1 text-sm text-muted-foreground">{desc}</p></div><Switch checked={prefs[key]} onCheckedChange={(v) => updatePref(key,v)} /></div>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>Choose light or dark mode for the Amineva software environment.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setTheme("light")} aria-pressed={theme === "light"} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${theme === "light" ? "border-primary bg-primary/5 text-foreground" : "border-border hover:bg-muted"}`}><span className="flex items-center gap-3"><Sun className="h-5 w-5" /><span className="text-sm font-medium">Light mode</span></span>{theme === "light" && <Check className="h-4 w-4 text-primary" />}</button>
            <button type="button" onClick={() => setTheme("dark")} aria-pressed={theme === "dark"} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${theme === "dark" ? "border-primary bg-primary/5 text-foreground" : "border-border hover:bg-muted"}`}><span className="flex items-center gap-3"><Moon className="h-5 w-5" /><span className="text-sm font-medium">Dark mode</span></span>{theme === "dark" && <Check className="h-4 w-4 text-primary" />}</button>
          </div></CardContent></Card>
        </section>}
        {tab === "account" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Account</h2><p className="mt-1 text-sm text-muted-foreground">Your Amineva account details.</p></div>
          {isAuthenticated && user ? <Card><CardContent className="space-y-4 p-5"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display name</p><p className="mt-1 text-sm font-medium">{user.name || "Not provided"}</p></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email address</p><p className="mt-1 text-sm font-medium">{user.email}</p></div><p className="border-t pt-4 text-sm text-muted-foreground">Your account credentials are securely managed by Amineva. Individual applications may maintain their own account profiles where required.</p></CardContent></Card> : <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">You are browsing Amineva without signing in. Sign in to view your account details.</CardContent></Card>}
        </section>}
        {tab === "app-info" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">App information</h2><p className="mt-1 text-sm text-muted-foreground">Basic information about this software.</p></div>
          <Card><CardContent className="divide-y divide-border p-0">
            <div className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-sm text-muted-foreground">Software</span><span className="text-sm font-medium">Amoeba</span></div>
            <div className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-sm text-muted-foreground">Version</span><span className="text-sm font-medium">0.1.0</span></div>
            <div className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-sm text-muted-foreground">Developer</span><span className="text-sm font-medium">Amoeba Global</span></div>
          </CardContent></Card>
        </section>}
      </div>
    </div>
  </main>;
}
