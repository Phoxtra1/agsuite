// src/core/coms/sla.ts
// SLA timer helpers for support tickets. Computes deadlines, remaining time,
// and breach state from the SLA fields populated server-side at insert time.

export type SLAState = "ok" | "at_risk" | "breached" | "met";

export interface TicketLikeForSLA {
  status: string;
  priority: string;
  created_at: string;
  first_response_at?: string | null;
  last_replied_at?: string | null;
  resolved_at?: string | null;
  sla_first_response_minutes?: number | null;
  sla_resolution_minutes?: number | null;
}

const FALLBACK_FIRST_RESPONSE: Record<string, number> = {
  urgent: 60, high: 240, normal: 480, low: 1440,
};
const FALLBACK_RESOLUTION: Record<string, number> = {
  urgent: 240, high: 1440, normal: 4320, low: 10080,
};

function deadline(start: string, minutes: number): Date {
  return new Date(new Date(start).getTime() + minutes * 60_000);
}

function classify(remainingMs: number, totalMs: number): SLAState {
  if (remainingMs <= 0) return "breached";
  if (remainingMs / totalMs <= 0.2) return "at_risk";
  return "ok";
}

export function firstResponseSLA(t: TicketLikeForSLA) {
  const minutes = t.sla_first_response_minutes ?? FALLBACK_FIRST_RESPONSE[t.priority] ?? 480;
  const due = deadline(t.created_at, minutes);
  const responded = t.first_response_at || t.last_replied_at;

  if (responded) {
    const respondedMs = new Date(responded).getTime() - new Date(t.created_at).getTime();
    const totalMs = minutes * 60_000;
    return {
      due,
      minutes,
      respondedAt: new Date(responded),
      state: respondedMs <= totalMs ? ("met" as SLAState) : ("breached" as SLAState),
      remainingMs: 0,
    };
  }

  const remainingMs = due.getTime() - Date.now();
  return {
    due,
    minutes,
    respondedAt: null,
    state: classify(remainingMs, minutes * 60_000),
    remainingMs,
  };
}

export function resolutionSLA(t: TicketLikeForSLA) {
  const minutes = t.sla_resolution_minutes ?? FALLBACK_RESOLUTION[t.priority] ?? 4320;
  const due = deadline(t.created_at, minutes);
  const resolved = t.resolved_at || (t.status === "resolved" || t.status === "closed" ? null : null);

  if (resolved) {
    const resolvedMs = new Date(resolved).getTime() - new Date(t.created_at).getTime();
    const totalMs = minutes * 60_000;
    return {
      due,
      minutes,
      resolvedAt: new Date(resolved),
      state: resolvedMs <= totalMs ? ("met" as SLAState) : ("breached" as SLAState),
      remainingMs: 0,
    };
  }

  const remainingMs = due.getTime() - Date.now();
  return {
    due,
    minutes,
    resolvedAt: null,
    state: classify(remainingMs, minutes * 60_000),
    remainingMs,
  };
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) {
    const overdueMin = Math.round(-ms / 60_000);
    if (overdueMin < 60) return `${overdueMin}m overdue`;
    if (overdueMin < 1440) return `${Math.round(overdueMin / 60)}h overdue`;
    return `${Math.round(overdueMin / 1440)}d overdue`;
  }
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min}m left`;
  if (min < 1440) return `${Math.round(min / 60)}h left`;
  return `${Math.round(min / 1440)}d left`;
}

export const slaStateColor: Record<SLAState, string> = {
  ok: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  at_risk: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  breached: "bg-destructive/15 text-destructive",
  met: "bg-muted text-muted-foreground",
};
