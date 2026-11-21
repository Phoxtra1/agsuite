// Register and actively update Amineva's root-scoped production worker.
// HTML and the worker script are served with no-cache headers (see vercel.json),
// so a deployment cannot leave clients pinned to an obsolete asset manifest.
const SW_URL = "/sw.js";
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const RELOAD_KEY = "__amv_sw_controller_reload";

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

function isAminevaWorker(registration: ServiceWorkerRegistration): boolean {
  const workerUrls = [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter(Boolean) as string[];
  return workerUrls.some((workerUrl) => {
    try {
      const script = new URL(workerUrl);
      const scope = new URL(registration.scope);
      return script.origin === window.location.origin &&
        script.pathname === SW_URL &&
        scope.origin === window.location.origin &&
        scope.pathname === "/";
    } catch {
      return false;
    }
  });
}

async function unregisterAppWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations.filter(isAminevaWorker).map((registration) => registration.unregister()),
  );
}

function reloadOnceAfterControllerChange(): void {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  } catch {
    // If storage is unavailable, don't risk an uncontrolled reload loop.
  }
}

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener("load", () => {
    let handledControllerChange = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (handledControllerChange) return;
      handledControllerChange = true;
      reloadOnceAfterControllerChange();
    });

    void navigator.serviceWorker.register(SW_URL, {
      scope: "/",
      updateViaCache: "none",
    }).then((registration) => {
      // Check immediately after startup and whenever the app returns to the
      // foreground. The periodic check covers long-lived installed PWAs.
      const update = () => {
        if (navigator.onLine) void registration.update().catch((error) => {
          console.warn("[Amineva PWA] Update check failed; current app remains available.", error);
        });
      };
      update();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") update();
      });
      window.setInterval(update, UPDATE_CHECK_INTERVAL_MS);
    }).catch((error) => {
      console.warn("[Amineva PWA] Service worker registration failed; online use remains available.", error);
    });
  }, { once: true });
}

/** Return only Amineva's own root-scoped worker, never another site's worker. */
export async function getAminevaServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registrations = await navigator.serviceWorker.getRegistrations();
  return registrations.find(isAminevaWorker) ?? null;
}
