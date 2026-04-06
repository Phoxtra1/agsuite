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

/** Ingest a single real event into the ACS data lake + events table */
async function ingestEvent(event: PlatformEvent) {
  const batch_id = `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { data: { user } } = await supabase.auth.getUser();
  const user_id = user?.id ?? null;

  // Insert into raw data lake
  await (supabase.from as any)("acs_raw_data").insert({
    platform: event.platform,
    dataset_type: event.dataset_type,
    raw_payload: event.raw_payload,
    metadata: { source: "live-emitter", version: "2.0" },
    batch_id,
  });

  // Also emit as monitor event
  await supabase.from("acs_events").insert({
    source: event.platform,
    type: `usage:${event.dataset_type}`,
    payload: { batch_id, dataset_type: event.dataset_type },
    user_id,
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
