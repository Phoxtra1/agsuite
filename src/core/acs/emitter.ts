// src/core/acs/emitter.ts
// PURPOSE: ACS real-time usage tracker — captures actual platform interactions
// (page views, feature usage, session activity) from live user sessions.
// No dummy/simulated data — only real usage telemetry.

import { supabase } from "@/integrations/supabase/client";

type PlatformEvent = {
  platform: string;
  dataset_type: string;
  raw_payload: Record<string, any>;
};

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTrackedPath: string | null = null;

/** Ingest a single real event into the ACS data lake + events table */
async function ingestEvent(event: PlatformEvent) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.functions.invoke("acs-ingest", {
    body: {
      action: "telemetry",
      platform: event.platform,
      dataset_type: event.dataset_type,
      raw_payload: event.raw_payload,
      metadata: { source: "app-telemetry", version: "3.0" },
      source_ref: user.id,
    },
  });
}

/** Track a user's active session — emits a heartbeat with real session data */
async function emitSessionHeartbeat() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Only track authenticated sessions

  const currentPath = window.location.pathname;
  const activePlatform = detectPlatformFromRoute(currentPath);
  if (!activePlatform) return; // Not on a trackable platform page

  await ingestEvent({
    platform: activePlatform,
    dataset_type: "session",
    raw_payload: {
      route: currentPath,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      session_type: "active",
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
    },
  });
}

/** Track route changes as real page-view telemetry. */
async function emitPageView(path = window.location.pathname) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const activePlatform = detectPlatformFromRoute(path);
  if (!activePlatform) return;

  await ingestEvent({
    platform: activePlatform,
    dataset_type: "page_view",
    raw_payload: {
      route: path,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || null,
    },
  });
}

/** Detect which Amineva platform the user is currently using based on route */
function detectPlatformFromRoute(path: string): string | null {
  if (path.includes("/suite/acs")) return "acs";
  if (path.includes("/suite/coms")) return "coms";
  if (path.includes("/suite/admin")) return "aminevaops";
  if (path.includes("/suite")) return "suite";
  if (path.includes("/agstock")) return "agstock";
  if (path.includes("/agis")) return "agis";
  if (path.includes("/agroclimate")) return "agroclimate";
  if (path.includes("/odeneho")) return "odeneho";
  return null;
}

// ── Public API for product-specific event tracking ──────────

/**
 * Track a specific product event. Call this from any product module
 * to log real usage data into the ACS data lake.
 *
 * Example:
 *   ACSEmitter.track("agstock", "sale", { total: 150, items: 3 });
 */
export const ACSEmitter = {
  async track(platform: string, eventType: string, payload: Record<string, any>) {
    try {
      await ingestEvent({ platform, dataset_type: eventType, raw_payload: payload });
    } catch (err) {
      console.warn(`[ACS] Failed to track ${platform}:${eventType}`, err);
    }
  },

  trackPageView(path?: string) {
    const route = path ?? window.location.pathname;
    if (route === lastTrackedPath) return;
    lastTrackedPath = route;
    emitPageView(route).catch(() => {});
  },
};

/** Start ACS usage tracking. Call once when ACS module mounts. */
export function startACSEmitter() {
  if (intervalId) return; // Already running

  // Emit session heartbeat every 60 seconds (real usage only)
  intervalId = setInterval(() => {
    emitSessionHeartbeat().catch(() => {});
  }, 60_000);

  // Initial heartbeat
  emitSessionHeartbeat().catch(() => {});

  console.log("[ACS] Live usage tracking started — 60s heartbeat");
}

/** Stop ACS emitter. Call on unmount. */
export function stopACSEmitter() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[ACS] Usage tracking stopped");
  }
}
