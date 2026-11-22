import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "amineva_pwa_install_dismissed_v2";

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isAppleMobile(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as InstallPromptEvent;
      setInstallEvent(promptEvent);
      if (!dismissed) setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari does not expose beforeinstallprompt; provide its manual install steps.
    if (!dismissed && isAppleMobile()) setVisible(true);

    // On browsers without an install event, offer browser-specific guidance rather
    // than pretending that a native install dialog can be opened programmatically.
    const fallbackTimer = window.setTimeout(() => {
      if (!dismissed && !isStandalone()) setVisible(true);
    }, 1800);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setShowInstructions(false);
  };

  const install = async () => {
    if (!installEvent) {
      setShowInstructions(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") setVisible(false);
    else setShowInstructions(true);
  };

  if (installed || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] mx-auto w-[calc(100%-2rem)] max-w-md" role="dialog" aria-label="Install Amineva">
      <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/amv_logo.png" alt="" className="h-12 w-12 rounded-xl object-contain" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Install Amineva</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add Amineva to your phone, tablet or computer for quick access as an app.
            </p>
          </div>
          <button type="button" onClick={dismiss} aria-label="Close install prompt" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted">✕</button>
        </div>
        {showInstructions && (
          <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
            {isAppleMobile()
              ? "In Safari, tap Share, then choose “Add to Home Screen” and confirm."
              : "Open your browser menu and choose “Install app” or “Add to Home Screen”. If that option is unavailable, this browser may not support PWA installation."}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => void install()} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {showInstructions ? "Show install steps" : "Install app"}
          </button>
          <button type="button" onClick={dismiss} className="rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-muted">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
