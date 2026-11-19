import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ComsSDK } from "@/core/coms/sdk";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Settings, UserRound, Info, RadioTower, CheckCheck, ExternalLink, Wifi, Sprout, ScanBarcode, MonitorSmartphone } from "lucide-react";

type HubTab = "notifications" | "settings" | "account" | "about" | "devices";
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
    { id: "settings", label: "Settings", icon: Settings },
    { id: "account", label: "Account", icon: UserRound },
    { id: "about", label: "App information", icon: Info },
    { id: "devices", label: "Device connections", icon: RadioTower },
  ];

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[88vh] w-[min(760px,calc(100vw-24px))] max-w-none overflow-hidden p-0">
      <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
        <DialogTitle>Amineva application centre</DialogTitle>
        <DialogDescription>Manage your application preferences, account, notifications and compatible device connections.</DialogDescription>
      </DialogHeader>
      <div className="grid min-h-[460px] md:grid-cols-[190px_1fr]">
        <nav className="flex gap-1 overflow-x-auto border-b p-2 md:flex-col md:border-b-0 md:border-r">
          {tabs.map((entry) => { const Icon = entry.icon; return <button key={entry.id} onClick={() => setTab(entry.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition ${tab === entry.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}><Icon className="h-4 w-4" />{entry.label}{entry.id === "notifications" && unread > 0 && <Badge variant="destructive" className="ml-auto">{unread}</Badge>}</button>; })}
        </nav>
        <div className="max-h-[68vh] overflow-y-auto p-4 sm:p-5">
          {tab === "notifications" && <section className="space-y-3">
            <div><h3 className="font-semibold">Notifications</h3><p className="text-xs text-muted-foreground">Messages delivered to your account through Amineva ComsSystem.</p></div>
            {!isAuthenticated ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sign in to view notifications sent to your account.</CardContent></Card> : loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading notifications…</p> : items.length === 0 ? <Card><CardContent className="py-8 text-center"><Bell className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">No notifications yet.</p></CardContent></Card> : items.map((item) => <button key={item.id} onClick={() => void markRead(item)} className={`w-full rounded-xl border p-3 text-left transition hover:bg-muted/60 ${item.is_read ? "border-border" : "border-primary/30 bg-primary/[0.04]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{item.subject || "Amineva notification"}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{item.body}</p><p className="mt-2 text-[10px] text-muted-foreground">{item.source_app || "Amineva"} · {new Date(item.created_at).toLocaleString()}</p></div>{!item.is_read && <Badge>New</Badge>}</div></button>)}
          </section>}
          {tab === "settings" && <section className="space-y-4">
            <div><h3 className="font-semibold">Application settings</h3><p className="text-xs text-muted-foreground">Preferences are saved on this device. Notification delivery still depends on the relevant service and your account settings.</p></div>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Notifications</CardTitle><CardDescription>Choose which notification categories this application should display or prefer.</CardDescription></CardHeader><CardContent className="space-y-4">
              {([["inAppNotifications","In-app notifications","Show messages received through ComsSystem."],["emailNotifications","Email notifications","Your preference for email updates; delivery is controlled by the sending service."],["productUpdates","Product updates","Receive product announcements where supported."]] as const).map(([key,label,desc]) => <div key={key} className="flex items-center justify-between gap-4"><div><Label>{label}</Label><p className="text-xs text-muted-foreground">{desc}</p></div><Switch checked={prefs[key]} onCheckedChange={(v) => updatePref(key,v)} /></div>)}
            </CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Appearance</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Use the theme control on the Amineva dashboard to switch between light and dark appearance.</p></CardContent></Card>
          </section>}
          {tab === "account" && <section className="space-y-4">
            <div><h3 className="font-semibold">Account</h3><p className="text-xs text-muted-foreground">Your Amineva gateway account. Independent products continue to manage their own accounts and sign-in.</p></div>
            {isAuthenticated && user ? <Card><CardContent className="space-y-3 p-4"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Display name</p><p className="text-sm font-medium">{user.name || "Not provided"}</p></div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p><p className="text-sm font-medium">{user.email}</p></div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account identifier</p><p className="break-all font-mono text-xs text-muted-foreground">{user.id}</p></div><p className="border-t pt-3 text-xs text-muted-foreground">Account profile and credentials are managed by the Amineva authentication provider. Product-specific accounts remain separate.</p></CardContent></Card> : <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">You are browsing Amineva without signing in. Workspace sign-in remains separate from independent product accounts.</CardContent></Card>}
          </section>}
          {tab === "about" && <section className="space-y-4">
            <div><h3 className="font-semibold">Application information</h3><p className="text-xs text-muted-foreground">Amineva application identity and runtime information.</p></div>
            <Card><CardContent className="space-y-3 p-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MonitorSmartphone className="h-6 w-6" /></div><div><p className="font-semibold">Amineva</p><p className="text-xs text-muted-foreground">Amineva Global application environment</p></div></div><div className="grid grid-cols-2 gap-3 border-t pt-3"><div><p className="text-[10px] text-muted-foreground">Access mode</p><p className="text-sm">{window.matchMedia("(display-mode: standalone)").matches ? "Installed application" : "Browser / PWA"}</p></div><div><p className="text-[10px] text-muted-foreground">Platform</p><p className="text-sm">{navigator.userAgentData?.platform || navigator.platform || "Unknown"}</p></div></div><p className="text-xs text-muted-foreground">Build version is not yet published by the current deployment. It will appear here once release versioning is connected.</p></CardContent></Card>
          </section>}
          {tab === "devices" && <section className="space-y-4">
            <div><h3 className="font-semibold">Device connections</h3><p className="text-xs text-muted-foreground">A common place to access compatible device integrations as product connectors become available.</p></div>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sprout className="h-4 w-4 text-primary" /> AgroClimate</CardTitle><CardDescription>Farm sensors, weather stations and environmental monitoring devices.</CardDescription></CardHeader><CardContent><Badge variant="outline">Connector integration planned</Badge><p className="mt-2 text-xs text-muted-foreground">Device data will be connected to AgroClimate through supported vendor APIs, gateways or protocols. No device is currently registered through this dashboard.</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScanBarcode className="h-4 w-4 text-primary" /> Inventra</CardTitle><CardDescription>Barcode scanners, RFID readers and inventory terminals.</CardDescription></CardHeader><CardContent><Badge variant="outline">Connector integration planned</Badge><p className="mt-2 text-xs text-muted-foreground">Compatible peripherals will be connected through browser/device APIs or vendor SDKs where supported.</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-primary" /> Info Solutions</CardTitle><CardDescription>Information kiosks and institutional touchscreen terminals.</CardDescription></CardHeader><CardContent><Badge variant="outline">Connector integration planned</Badge><p className="mt-2 text-xs text-muted-foreground">Dedicated terminal integration will be designed for supported operating systems and managed deployments.</p></CardContent></Card>
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">This is the device integration hub interface, not a live hardware pairing service yet. Actual pairing requires each product's connector, supported device protocol and backend integration.</div>
          </section>}
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
