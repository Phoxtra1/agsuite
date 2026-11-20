import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { ComsSDK } from "@/core/coms/sdk";
import { getAminevaServiceWorkerRegistration } from "@/pwa/registerServiceWorker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Settings, UserRound, Info, ArrowLeft, X, Sun, Moon, Check, Shield, Smartphone, RefreshCw, Save, Lock, LogOut } from "lucide-react";

type HubTab = "notifications" | "settings" | "account" | "updates" | "security" | "permissions" | "app-info";
type InboxItem = { id: string; subject: string; body: string; source_app: string | null; created_at: string; is_read: boolean; type: string; };
const PREF_KEY = "amineva_application_preferences_v1";
type Preferences = { emailNotifications: boolean; productUpdates: boolean; inAppNotifications: boolean; };
const DEFAULT_PREFS: Preferences = { emailNotifications: true, productUpdates: true, inAppNotifications: true };
function readPreferences(): Preferences {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") }; }
  catch { return DEFAULT_PREFS; }
}
type PermissionState = "granted" | "denied" | "prompt" | "unsupported" | "unknown";
const APP_VERSION = "0.1.0";

export function ApplicationHubTools({ open, onOpenChange, initialTab = "notifications" }: {
  open: boolean; onOpenChange: (open: boolean) => void; initialTab?: HubTab;
}) {
  const { user, isAuthenticated, updateProfile, updateAppPreferences, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(readPreferences);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateState, setUpdateState] = useState("Checking update support…");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, PermissionState>>({});
  const [permissionBusy, setPermissionBusy] = useState("");

  useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);
  useEffect(() => { setDisplayName(user?.name || ""); }, [user?.name]);

  useEffect(() => {
    const accountPrefs = user?.preferences;
    if (!accountPrefs || typeof accountPrefs !== "object") return;
    const next = { ...readPreferences(), ...accountPrefs };
    setPrefs(next);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
    if (accountPrefs.theme === "light" || accountPrefs.theme === "dark") setTheme(accountPrefs.theme);
  }, [user?.preferences, setTheme]);

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
        setItems(current => [payload.new as InboxItem, ...current.filter(item => item.id !== payload.new.id)].slice(0, 50));
      } else if (payload.eventType === "UPDATE" && payload.new?.target_user_id === user.id) {
        setItems(current => current.map(item => item.id === payload.new.id ? payload.new as InboxItem : item));
      }
    });
    return () => { active = false; unsubscribe(); };
  }, [open, tab, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!open || tab !== "updates") return;
    let active = true;
    let currentRegistration: ServiceWorkerRegistration | null = null;
    let installingWorker: ServiceWorker | null = null;
    const handleWorkerState = () => {
      if (!active || !installingWorker) return;
      if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
        setUpdateState("A new Amineva version has been downloaded and is ready.");
        setRegistration(currentRegistration);
      } else if (installingWorker.state === "installing") {
        setUpdateState("An Amineva update is downloading.");
      }
    };
    const handleUpdateFound = () => {
      installingWorker = currentRegistration?.installing ?? null;
      installingWorker?.addEventListener("statechange", handleWorkerState);
      handleWorkerState();
    };

    if (!("serviceWorker" in navigator)) {
      setRegistration(null);
      setUpdateState("This browser does not support service-worker updates.");
      return;
    }

    getAminevaServiceWorkerRegistration().then(reg => {
      if (!active) return;
      currentRegistration = reg;
      setRegistration(reg);
      if (!reg) {
        setUpdateState("No Amineva service worker is registered on this device.");
        return;
      }
      setUpdateState(reg.waiting
        ? "An Amineva update is ready to install."
        : reg.installing
          ? "An Amineva update is downloading."
          : "Amineva update service is active. Updates are normally applied automatically.");
      reg.addEventListener("updatefound", handleUpdateFound);
      if (reg.installing) {
        installingWorker = reg.installing;
        installingWorker.addEventListener("statechange", handleWorkerState);
      }
    }).catch(() => {
      if (active) setUpdateState("Unable to inspect Amineva update status on this device.");
    });

    return () => {
      active = false;
      currentRegistration?.removeEventListener("updatefound", handleUpdateFound);
      installingWorker?.removeEventListener("statechange", handleWorkerState);
    };
  }, [open, tab]);

  useEffect(() => {
    if (!open || tab !== "permissions") return;
    let active = true;
    const names = ["notifications", "geolocation", "camera", "microphone"] as const;
    Promise.all(names.map(async name => {
      try {
        if (!navigator.permissions?.query) return [name, "unknown"] as const;
        const result = await navigator.permissions.query({ name: name as PermissionName });
        return [name, result.state] as const;
      } catch { return [name, "unsupported"] as const; }
    })).then(entries => { if (active) setPermissions(Object.fromEntries(entries) as Record<string, PermissionState>); });
    return () => { active = false; };
  }, [open, tab]);

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
    if (isAuthenticated) {
      try {
        await updateAppPreferences({ ...next, theme });
        setMessage("Preference saved to your Amineva account.");
      } catch (error: any) {
        setMessage(error?.message || "Preference saved on this device, but account sync failed.");
      }
    }
  };

  const updateTheme = async (nextTheme: "light" | "dark") => {
    setTheme(nextTheme);
    if (!isAuthenticated) return;
    try {
      await updateAppPreferences({ ...prefs, theme: nextTheme });
      setMessage("Appearance preference saved to your Amineva account.");
    } catch (error: any) {
      setMessage(error?.message || "Appearance saved on this device, but account sync failed.");
    }
  };

  const markRead = async (item: InboxItem) => {
    if (item.is_read) return;
    const { error } = await supabase.from("inbound_messages").update({ is_read: true }).eq("id", item.id).eq("target_user_id", user?.id);
    if (!error) setItems(current => current.map(entry => entry.id === item.id ? { ...entry, is_read: true } : entry));
  };

  const saveProfile = async () => {
    setSavingProfile(true); setMessage("");
    try { await updateProfile(displayName); setMessage("Display name updated."); }
    catch (error: any) { setMessage(error?.message || "Could not update profile."); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    setMessage("");
    if (password.length < 8) { setMessage("Use a password with at least 8 characters."); return; }
    if (password !== confirmPassword) { setMessage("The passwords do not match."); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword(""); setConfirmPassword(""); setMessage("Password updated successfully.");
    } catch (error: any) { setMessage(error?.message || "Could not update password."); }
    finally { setSavingPassword(false); }
  };

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const reg = await getAminevaServiceWorkerRegistration();
      if (!reg) { setRegistration(null); setUpdateState("No Amineva service worker was found for this application. Other site workers are ignored."); return; }
      setRegistration(reg);
      await reg.update();
      setUpdateState(reg.waiting ? "An update is ready to install." : reg.installing ? "An update is downloading. This screen will refresh its status when you reopen it." : "Update check completed. No waiting Amineva update was found.");
    } catch { setUpdateState("Update check failed. Check your internet connection and try again."); }
    finally { setCheckingUpdate(false); }
  };

  const installUpdate = () => {
    const waiting = registration?.waiting;
    if (!waiting) return;
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { once: true });
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  const requestPermission = async (kind: "notifications" | "location" | "camera" | "microphone") => {
    setPermissionBusy(kind);
    try {
      let state: PermissionState = "unknown";
      if (kind === "notifications") {
        if (!("Notification" in window)) state = "unsupported";
        else { const result = await Notification.requestPermission(); state = result === "default" ? "prompt" : result; }
      } else if (kind === "location") {
        if (!navigator.geolocation) state = "unsupported";
        else await new Promise<void>((resolve, reject) => navigator.geolocation.getCurrentPosition(() => resolve(), error => reject(error), { timeout: 10000 }));
        state = "granted";
      } else {
        if (!navigator.mediaDevices?.getUserMedia) state = "unsupported";
        else {
          const stream = await navigator.mediaDevices.getUserMedia(kind === "camera" ? { video: true } : { audio: true });
          stream.getTracks().forEach(track => track.stop());
          state = "granted";
        }
      }
      setPermissions(current => ({ ...current, [kind === "location" ? "geolocation" : kind]: state }));
      setMessage(state === "granted" ? `${kind} permission granted for this browser.` : `${kind} permission: ${state}.`);
    } catch (error: any) {
      const state = error?.name === "NotAllowedError" ? "denied" : error?.name === "NotFoundError" ? "unsupported" : "unknown";
      setPermissions(current => ({ ...current, [kind === "location" ? "geolocation" : kind]: state }));
      setMessage(error?.message || `Could not request ${kind} permission.`);
    } finally { setPermissionBusy(""); }
  };

  const unread = useMemo(() => items.filter(item => !item.is_read).length, [items]);
  const visibleItems = prefs.inAppNotifications ? items : [];
  const tabs: { id: HubTab; label: string; icon: React.ElementType }[] = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Preferences", icon: Settings },
    { id: "account", label: "Account & profile", icon: UserRound },
    { id: "updates", label: "Application updates", icon: RefreshCw },
    { id: "security", label: "Security", icon: Shield },
    { id: "permissions", label: "Device permissions", icon: Smartphone },
    { id: "app-info", label: "App information", icon: Info },
  ];
  const permissionRows = [
    ["notifications", "Notifications", "Browser notifications for supported Amineva features.", "notifications"],
    ["location", "Location", "Location access when a feature explicitly needs it.", "geolocation"],
    ["camera", "Camera", "Camera access for supported capture and scanning features.", "camera"],
    ["microphone", "Microphone", "Microphone access for supported voice features.", "microphone"],
  ] as const;

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
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[230px_minmax(0,1fr)] md:py-8">
      <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {tabs.map(entry => { const Icon = entry.icon; return <button key={entry.id} onClick={() => { setTab(entry.id); setMessage(""); }} className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition md:w-full ${tab === entry.id ? "border-primary/30 bg-primary/10 font-semibold text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}><Icon className="h-4 w-4" />{entry.label}{entry.id === "notifications" && unread > 0 && <Badge variant="destructive" className="ml-auto">{unread}</Badge>}</button>; })}
      </nav>
      <div className="min-w-0 space-y-5">
        {message && <div role="status" className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">{message}</div>}
        {tab === "notifications" && <section className="space-y-3">
          <div><h2 className="text-xl font-semibold">Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Messages delivered to your account through Amineva ComsSystem.</p></div>
          {!isAuthenticated ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sign in to view notifications sent to your account.</CardContent></Card> : !prefs.inAppNotifications ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">In-app notifications are hidden by your current preference. Turn them on under Preferences to view your inbox.</CardContent></Card> : loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading notifications…</p> : visibleItems.length === 0 ? <Card><CardContent className="py-8 text-center"><Bell className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">No notifications yet.</p></CardContent></Card> : visibleItems.map(item => <button key={item.id} onClick={() => void markRead(item)} className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/60 ${item.is_read ? "border-border" : "border-primary/30 bg-primary/[0.04]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold">{item.subject || "Amineva notification"}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{item.source_app || "Amineva"} · {new Date(item.created_at).toLocaleString()}</p></div>{!item.is_read && <Badge>New</Badge>}</div></button>)}
        </section>}
        {tab === "settings" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Preferences</h2><p className="mt-1 text-sm text-muted-foreground">Choose how Amineva behaves on this device.</p></div>
          <Card><CardHeader><CardTitle className="text-base">Notifications</CardTitle><CardDescription>These preferences are currently saved on this device. Email and product-announcement delivery controls still depend on the sending services.</CardDescription></CardHeader><CardContent className="space-y-5">
            {([[ "inAppNotifications", "In-app notifications", "Show messages received through Amineva." ],[ "emailNotifications", "Email notifications", "Your preference for email updates." ],[ "productUpdates", "Product updates", "Your preference for product announcements." ]] as const).map(([key,label,desc]) => <div key={key} className="flex items-center justify-between gap-4"><div><Label>{label}</Label><p className="mt-1 text-sm text-muted-foreground">{desc}</p></div><Switch checked={prefs[key]} onCheckedChange={value => updatePref(key,value)} /></div>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>Choose light or dark mode for the Amineva software environment.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => void updateTheme("light")} aria-pressed={theme === "light"} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${theme === "light" ? "border-primary bg-primary/5 text-foreground" : "border-border hover:bg-muted"}`}><span className="flex items-center gap-3"><Sun className="h-5 w-5" /><span className="text-sm font-medium">Light mode</span></span>{theme === "light" && <Check className="h-4 w-4 text-primary" />}</button>
            <button type="button" onClick={() => void updateTheme("dark")} aria-pressed={theme === "dark"} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${theme === "dark" ? "border-primary bg-primary/5 text-foreground" : "border-border hover:bg-muted"}`}><span className="flex items-center gap-3"><Moon className="h-5 w-5" /><span className="text-sm font-medium">Dark mode</span></span>{theme === "dark" && <Check className="h-4 w-4 text-primary" />}</button>
          </div></CardContent></Card>
        </section>}
        {tab === "account" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Account & profile</h2><p className="mt-1 text-sm text-muted-foreground">Manage the profile details attached to your Amineva account.</p></div>
          {isAuthenticated && user ? <Card><CardHeader><CardTitle className="text-base">Profile details</CardTitle><CardDescription>Your name is stored in your Amineva authentication profile. Your sign-in email is read-only here.</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="profile-name">Display name</Label><input id="profile-name" value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={80} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
            <div className="space-y-2"><Label>Email address</Label><div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{user.email}</div></div>
            <Button onClick={() => void saveProfile()} disabled={savingProfile || !displayName.trim() || displayName.trim() === user.name}><Save className="mr-2 h-4 w-4" />{savingProfile ? "Saving…" : "Save profile"}</Button>
            <p className="border-t pt-4 text-sm text-muted-foreground">Profile image upload is not enabled in this build because the account profile storage destination and access policies have not yet been verified. No image will be stored in browser metadata.</p>
          </CardContent></Card> : <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sign in to manage your account profile.</CardContent></Card>}
        </section>}
        {tab === "updates" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Application updates</h2><p className="mt-1 text-sm text-muted-foreground">Check the installed Amineva application for a newer release.</p></div>
          <Card><CardHeader><CardTitle className="text-base">Update status</CardTitle><CardDescription>Installed application version: {APP_VERSION}</CardDescription></CardHeader><CardContent className="space-y-4">
            <p className="text-sm">{updateState}</p>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void checkForUpdates()} disabled={checkingUpdate}><RefreshCw className={`mr-2 h-4 w-4 ${checkingUpdate ? "animate-spin" : ""}`} />{checkingUpdate ? "Checking…" : "Check for updates"}</Button>{registration?.waiting && <Button onClick={installUpdate}>Install update and restart</Button>}</div>
            <p className="text-xs text-muted-foreground">The application currently uses its service-worker update mechanism. If no service worker is registered, update availability cannot be checked from this screen.</p>
          </CardContent></Card>
        </section>}
        {tab === "security" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Security</h2><p className="mt-1 text-sm text-muted-foreground">Protect your Amineva sign-in and active account session.</p></div>
          {!isAuthenticated ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sign in to manage account security.</CardContent></Card> : <>
            <Card><CardHeader><CardTitle className="text-base">Change password</CardTitle><CardDescription>Choose a strong password that you do not use elsewhere.</CardDescription></CardHeader><CardContent className="space-y-3">
              <div className="space-y-1"><Label htmlFor="new-password">New password</Label><input id="new-password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="space-y-1"><Label htmlFor="confirm-password">Confirm new password</Label><input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <Button onClick={() => void changePassword()} disabled={savingPassword || !password || !confirmPassword}><Lock className="mr-2 h-4 w-4" />{savingPassword ? "Updating…" : "Update password"}</Button>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Sign out</CardTitle><CardDescription>End this Amineva session on the current device.</CardDescription></CardHeader><CardContent><Button variant="destructive" onClick={() => void logout().then(() => navigate("/"))}><LogOut className="mr-2 h-4 w-4" />Sign out of this device</Button></CardContent></Card>
            <Card><CardContent className="py-4 text-sm text-muted-foreground">Multi-factor authentication and remote session management are not yet available. Sensitive actions must not treat the legacy step-up check as verified; it now fails closed until a real server-verified MFA flow is implemented.</CardContent></Card>
          </>}
        </section>}
        {tab === "permissions" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">Device permissions</h2><p className="mt-1 text-sm text-muted-foreground">Review and request access only when a supported feature needs it. Browser and operating-system settings remain authoritative.</p></div>
          <Card><CardContent className="divide-y divide-border p-0">
            {permissionRows.map(([kind,label,desc,key]) => <div key={kind} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{desc}</p><p className="mt-1 text-xs text-muted-foreground">Status: {permissions[key] || "Not checked"}</p></div><Button size="sm" variant="outline" disabled={permissionBusy === kind} onClick={() => void requestPermission(kind)}>{permissionBusy === kind ? "Requesting…" : "Request access"}</Button></div>)}
          </CardContent></Card>
          <p className="text-xs text-muted-foreground">This page cannot revoke permissions granted by the browser or operating system. To revoke access, use the site permissions in your browser or device settings. Bluetooth and file-system access are requested by individual features when supported, not granted globally here.</p>
        </section>}
        {tab === "app-info" && <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">App information</h2><p className="mt-1 text-sm text-muted-foreground">Basic information about this software.</p></div>
          <Card><CardContent className="divide-y divide-border p-0">
            <div className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-sm text-muted-foreground">Software</span><span className="text-sm font-medium">Amineva</span></div>
            <div className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-sm text-muted-foreground">Version</span><span className="text-sm font-medium">{APP_VERSION}</span></div>
            <div className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-sm text-muted-foreground">Developer</span><span className="text-sm font-medium">Amineva Global</span></div>
          </CardContent></Card>
        </section>}
      </div>
    </div>
  </main>;
}
