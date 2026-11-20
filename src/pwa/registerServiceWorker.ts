// Register the production service worker after the initial page load.
const SW_URL = "/sw.js";

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

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) =>
        (registration.active?.scriptURL || registration.installing?.scriptURL || "").endsWith(SW_URL)
      )
      .map((registration) => registration.unregister()),
  );
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch((error) => {
      console.warn("[Amineva PWA] Service worker registration failed; online use remains available.", error);
    });
  }, { once: true });
}


/** Return only Amineva's own root-scoped worker, never another site's worker. */
export async function getAminevaServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registrations = await navigator.serviceWorker.getRegistrations();
  return registrations.find((registration) => {
    const workerUrl =
      registration.active?.scriptURL ||
      registration.waiting?.scriptURL ||
      registration.installing?.scriptURL ||
      "";
    if (!workerUrl) return false;
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
  }) ?? null;
}
