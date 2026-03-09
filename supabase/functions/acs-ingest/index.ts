// supabase/functions/acs-ingest/index.ts
// PURPOSE: ACS Ingest endpoint — accepts events from external sync apps (AGStock, AGIS, etc.)
// Auth: x-acs-api-key header (ACS_INGEST_API_KEY secret)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-acs-api-key",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── API Key Auth ───────────────────────────────────────────────────────────
  const apiKey = req.headers.get("x-acs-api-key");
  const expectedKey = Deno.env.get("ACS_INGEST_API_KEY");

  if (!expectedKey || apiKey !== expectedKey) {
    return json({ error: "Unauthorized: invalid or missing ACS API key" }, 401);
  }

  // ── Supabase client (service role — bypasses RLS for ingest) ──────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action as string | undefined;

  // ── Health check ──────────────────────────────────────────────────────────
  if (req.method === "GET" || action === "health") {
    const { count } = await supabase
      .from("acs_events")
      .select("*", { count: "exact", head: true });
    return json({
      status: "online",
      service: "acs-ingest",
      total_events: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Single event ingest ───────────────────────────────────────────────────
  if (action === "event") {
    const { source, type, payload } = body as {
      source?: string;
      type?: string;
      payload?: Record<string, unknown>;
    };

    if (!source || !type) {
      return json({ error: "Missing required fields: source, type" }, 400);
    }

    const { data, error } = await supabase
      .from("acs_events")
      .insert([{ source, type, payload: payload ?? {} }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, event: data });
  }

  // ── Batch event ingest ────────────────────────────────────────────────────
  if (action === "batch") {
    const events = body.events as Array<{
      source: string;
      type: string;
      payload?: Record<string, unknown>;
    }> | undefined;

    if (!Array.isArray(events) || events.length === 0) {
      return json({ error: "events must be a non-empty array" }, 400);
    }
    if (events.length > 500) {
      return json({ error: "Batch limit is 500 events per request" }, 400);
    }

    const rows = events.map((e) => ({
      source: e.source,
      type: e.type,
      payload: e.payload ?? {},
    }));

    const { error, count } = await supabase
      .from("acs_events")
      .insert(rows, { count: "exact" });

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, inserted: count ?? rows.length });
  }

  // ── Start sync session ────────────────────────────────────────────────────
  if (action === "sync") {
    const source = body.source as string | undefined;
    if (!source) return json({ error: "Missing required field: source" }, 400);

    const { data, error } = await supabase
      .from("acs_sync_logs")
      .insert([{ source, status: "syncing", started_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, sync_id: data.id, sync_log: data });
  }

  // ── Complete sync session ─────────────────────────────────────────────────
  if (action === "sync_complete") {
    const { sync_id, records_synced, error_message } = body as {
      sync_id?: string;
      records_synced?: number;
      error_message?: string;
    };

    if (!sync_id) return json({ error: "Missing required field: sync_id" }, 400);

    const status = error_message ? "failed" : "completed";
    const { data, error } = await supabase
      .from("acs_sync_logs")
      .update({
        status,
        completed_at: new Date().toISOString(),
        records_synced: records_synced ?? 0,
        error_message: error_message ?? null,
      })
      .eq("id", sync_id)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, sync_log: data });
  }

  return json({ error: `Unknown action: ${action ?? "(none)"}` }, 400);
});
