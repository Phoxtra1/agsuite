// supabase/functions/acs-ingest/index.ts
// PURPOSE: ACS Intelligence Infrastructure — ingestion, raw data lake, normalization, audit
// Auth: x-acs-api-key header (ACS_INGEST_API_KEY secret) for write actions; health is public

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VALID_PLATFORMS = ["suite", "acs", "coms", "agroclimate", "agstock", "agis", "amniva", "aminevaops", "dipa"] as const;
const VALID_DATASET_TYPES = ["usage", "session", "page_view", "feature", "weather", "inventory", "operations", "environmental", "financial", "crop_advisory", "livestock", "drone", "sensor", "insurance", "forex", "microcredit", "mobile_money"] as const;
const VALID_TRANSFORM_TYPES = ["clean", "normalize", "enrich", "merge", "deduplicate"] as const;

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

function generateBatchId(): string {
  return `batch_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Record<string, unknown> | null = null;
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
  }

  const action = (body?.action as string | undefined) ?? undefined;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  async function getRequester() {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const { data } = await supabase.auth.getUser(token);
    return data.user ?? null;
  }

  // ── Health check (public — no API key required) ─────────────────────────
  if (req.method === "GET" || action === "health") {
    const [eventsRes, rawRes, intRes] = await Promise.all([
      supabase.from("acs_events").select("*", { count: "exact", head: true }),
      supabase.from("acs_raw_data").select("*", { count: "exact", head: true }),
      supabase.from("acs_intelligence_outputs").select("*", { count: "exact", head: true }),
    ]);

    return json({
      status: "online",
      service: "acs-ingest",
      version: "2.0",
      total_events: eventsRes.count ?? 0,
      total_raw_records: rawRes.count ?? 0,
      total_intelligence: intRes.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Live app telemetry (authenticated users, no shared ingest key in browser) ──
  if (action === "telemetry") {
    const user = await getRequester();
    if (!user) return json({ error: "Authentication required for telemetry" }, 401);

    const { platform, dataset_type, raw_payload, metadata, source_ref } = body as {
      platform?: string;
      dataset_type?: string;
      raw_payload?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      source_ref?: string;
    };

    if (!platform || !dataset_type || !raw_payload) {
      return json({ error: "Missing required fields: platform, dataset_type, raw_payload" }, 400);
    }
    if (!VALID_PLATFORMS.includes(platform as any)) {
      return json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(", ")}` }, 400);
    }

    const batch_id = `live_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase
      .from("acs_raw_data")
      .insert([{ platform, dataset_type, raw_payload, metadata: metadata ?? { source: "app-telemetry" }, source_ref: source_ref ?? user.id, batch_id }])
      .select("id")
      .single();

    if (error) return json({ error: error.message }, 500);

    await supabase.from("acs_events").insert([{ source: platform, type: `usage:${dataset_type}`, user_id: user.id, payload: { raw_data_id: data.id, batch_id, route: raw_payload.route ?? null } }]);

    return json({ success: true, batch_id, raw_data_id: data.id });
  }

  // ── API Key Auth (required for all write actions) ───────────────────────
  const apiKey = req.headers.get("x-acs-api-key");
  const expectedKey = Deno.env.get("ACS_INGEST_API_KEY");

  if (!expectedKey || apiKey !== expectedKey) {
    return json({ error: "Unauthorized: invalid or missing ACS API key" }, 401);
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: ENHANCED INGESTION
  // ═══════════════════════════════════════════════════════════════

  // ── Single event ingest (legacy + writes to events table) ─────────────
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

  // ── Batch event ingest (legacy) ───────────────────────────────────────
  if (action === "batch") {
    const events = body!.events as Array<{
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

  // ── Raw data ingest (DATA LAKE — single record) ──────────────────────
  if (action === "ingest") {
    const { platform, dataset_type, raw_payload, metadata, source_ref } = body as {
      platform?: string;
      dataset_type?: string;
      raw_payload?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      source_ref?: string;
    };

    if (!platform || !dataset_type || !raw_payload) {
      return json({ error: "Missing required fields: platform, dataset_type, raw_payload" }, 400);
    }

    if (!VALID_PLATFORMS.includes(platform as any)) {
      return json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(", ")}` }, 400);
    }

    const batch_id = generateBatchId();

    const { data, error } = await supabase
      .from("acs_raw_data")
      .insert([{
        platform,
        dataset_type,
        raw_payload,
        metadata: metadata ?? {},
        source_ref: source_ref ?? null,
        batch_id,
      }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    // Also log as event for real-time monitor
    await supabase.from("acs_events").insert([{
      source: platform,
      type: `raw_ingest:${dataset_type}`,
      payload: { raw_data_id: data.id, batch_id, source_ref },
    }]);

    return json({ success: true, raw_data: data, batch_id });
  }

  // ── Raw data batch ingest (DATA LAKE — bulk) ─────────────────────────
  if (action === "ingest_batch") {
    const records = body!.records as Array<{
      platform: string;
      dataset_type: string;
      raw_payload: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      source_ref?: string;
    }> | undefined;

    if (!Array.isArray(records) || records.length === 0) {
      return json({ error: "records must be a non-empty array" }, 400);
    }
    if (records.length > 500) {
      return json({ error: "Batch limit is 500 records per request" }, 400);
    }

    const batch_id = generateBatchId();

    // Validate all records
    for (const r of records) {
      if (!r.platform || !r.dataset_type || !r.raw_payload) {
        return json({ error: "Each record must have platform, dataset_type, raw_payload" }, 400);
      }
      if (!VALID_PLATFORMS.includes(r.platform as any)) {
        return json({ error: `Invalid platform: ${r.platform}` }, 400);
      }
    }

    const rows = records.map((r) => ({
      platform: r.platform,
      dataset_type: r.dataset_type,
      raw_payload: r.raw_payload,
      metadata: r.metadata ?? {},
      source_ref: r.source_ref ?? null,
      batch_id,
    }));

    const { error, count } = await supabase
      .from("acs_raw_data")
      .insert(rows, { count: "exact" });

    if (error) return json({ error: error.message }, 500);

    // Log batch event
    await supabase.from("acs_events").insert([{
      source: "acs",
      type: "raw_ingest_batch",
      payload: { batch_id, record_count: count ?? rows.length },
    }]);

    return json({ success: true, inserted: count ?? rows.length, batch_id });
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: NORMALIZATION & TRANSFORMATION AUDIT
  // ═══════════════════════════════════════════════════════════════

  // ── Start processing pipeline ────────────────────────────────────────
  if (action === "pipeline_start") {
    const pipeline = body!.pipeline as string | undefined;
    if (!pipeline) return json({ error: "Missing required field: pipeline" }, 400);

    const { data, error } = await supabase
      .from("acs_processing_logs")
      .insert([{
        pipeline,
        status: "running",
        input_count: (body!.input_count as number) ?? 0,
        metadata: (body!.metadata as Record<string, unknown>) ?? {},
      }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, processing_log: data });
  }

  // ── Complete processing pipeline ─────────────────────────────────────
  if (action === "pipeline_complete") {
    const { processing_log_id, output_count, error_message } = body as {
      processing_log_id?: string;
      output_count?: number;
      error_message?: string;
    };

    if (!processing_log_id) return json({ error: "Missing required field: processing_log_id" }, 400);

    const status = error_message ? "failed" : "completed";
    const { data, error } = await supabase
      .from("acs_processing_logs")
      .update({
        status,
        completed_at: new Date().toISOString(),
        output_count: output_count ?? 0,
        error_message: error_message ?? null,
      })
      .eq("id", processing_log_id)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, processing_log: data });
  }

  // ── Log transformation (audit trail) ─────────────────────────────────
  if (action === "transform") {
    const { raw_data_id, processing_log_id, transform_type, input_snapshot, output_snapshot, changes_summary } = body as {
      raw_data_id?: string;
      processing_log_id?: string;
      transform_type?: string;
      input_snapshot?: Record<string, unknown>;
      output_snapshot?: Record<string, unknown>;
      changes_summary?: string;
    };

    if (!transform_type) {
      return json({ error: "Missing required field: transform_type" }, 400);
    }

    if (!VALID_TRANSFORM_TYPES.includes(transform_type as any)) {
      return json({ error: `Invalid transform_type. Must be one of: ${VALID_TRANSFORM_TYPES.join(", ")}` }, 400);
    }

    const { data, error } = await supabase
      .from("acs_transformation_audit")
      .insert([{
        raw_data_id: raw_data_id ?? null,
        processing_log_id: processing_log_id ?? null,
        transform_type,
        input_snapshot: input_snapshot ?? null,
        output_snapshot: output_snapshot ?? null,
        changes_summary: changes_summary ?? null,
      }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, audit: data });
  }

  // ── Store intelligence output ────────────────────────────────────────
  if (action === "intelligence") {
    const { category, title, summary, intelligence, confidence, source_pipeline, source_platforms, valid_from, valid_until } = body as {
      category?: string;
      title?: string;
      summary?: string;
      intelligence?: Record<string, unknown>;
      confidence?: number;
      source_pipeline?: string;
      source_platforms?: string[];
      valid_from?: string;
      valid_until?: string;
    };

    if (!category || !title || !intelligence) {
      return json({ error: "Missing required fields: category, title, intelligence" }, 400);
    }

    const { data, error } = await supabase
      .from("acs_intelligence_outputs")
      .insert([{
        category,
        title,
        summary: summary ?? null,
        intelligence,
        confidence: confidence ?? null,
        source_pipeline: source_pipeline ?? null,
        source_platforms: source_platforms ?? [],
        valid_from: valid_from ?? null,
        valid_until: valid_until ?? null,
      }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, intelligence_output: data });
  }

  // ── Sync session management (legacy) ─────────────────────────────────
  if (action === "sync") {
    const source = body!.source as string | undefined;
    if (!source) return json({ error: "Missing required field: source" }, 400);

    const { data, error } = await supabase
      .from("acs_sync_logs")
      .insert([{ source, status: "syncing", started_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ success: true, sync_id: data.id, sync_log: data });
  }

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
