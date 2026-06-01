// adapters/lovable/acs.ts
import { supabase } from "@/integrations/supabase/client";
import type {
  ACSAdapter,
  ACSEvent,
  ACSSyncLog,
  ACSRawData,
  ACSProcessingLog,
  ACSIntelligenceOutput,
  ACSTransformationAudit,
} from "@/core/backend/acs";

export const acs: ACSAdapter = {
  // ── Legacy event layer ────────────────────────────────────────────────
  async sendEvent(event) {
    const { error } = await supabase.from("acs_events").insert([
      {
        source: event.source,
        type: event.type,
        payload: event.payload ?? {},
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
  },

  async fetchEvents(filters) {
    let query = supabase
      .from("acs_events")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.source) query = query.eq("source", filters.source);
    if (filters?.search) {
      query = query.or(
        `source.ilike.%${filters.search}%,type.ilike.%${filters.search}%`
      );
    }
    if (filters?.limit) {
      const offset = filters.offset ?? 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as ACSEvent[], count: count ?? 0 };
  },

  async fetchSyncLogs(source) {
    let query = supabase
      .from("acs_sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (source) query = query.eq("source", source);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ACSSyncLog[];
  },

  async triggerSync(source) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sign in required to create an ACS sync snapshot");

    // 1. Trigger high-fidelity server-side ETL sync on actual platform profiles & activities
    try {
      const { error: rpcError } = await (supabase.rpc as any)("sync_acs_data_lake", { caller_uid: user.id });
      if (rpcError) throw rpcError;
    } catch (rpcErr) {
      console.warn("ACS server sync RPC failed or missing, running client-side fallback:", rpcErr);
    }

    const { data, error } = await supabase
      .from("acs_sync_logs")
      .insert([{ source, status: "syncing", started_at: new Date().toISOString(), user_id: user.id }])
      .select()
      .single();
    if (error) throw error;

    const [rawRes, eventRes] = await Promise.all([
      (supabase.from as any)("acs_raw_data").select("id", { count: "exact", head: true }).eq("platform", source),
      supabase.from("acs_events").select("id", { count: "exact", head: true }).eq("source", source),
    ]);

    const recordsSynced = (rawRes.count ?? 0) + (eventRes.count ?? 0);
    const { data: completed, error: updateError } = await supabase
      .from("acs_sync_logs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        records_synced: recordsSynced,
        error_message: rawRes.error?.message || eventRes.error?.message || null,
      })
      .eq("id", data.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return completed as ACSSyncLog;
  },

  subscribeEvents(callback) {
    const channel = supabase
      .channel("acs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "acs_events" },
        (payload) => callback(payload.new as ACSEvent)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  // ── Phase 1: Data Lake ────────────────────────────────────────────────
  async fetchRawData(filters) {
    let query = (supabase.from as any)("acs_raw_data")
      .select("*", { count: "exact" })
      .order("ingested_at", { ascending: false });

    if (filters?.platform) query = query.eq("platform", filters.platform);
    if (filters?.dataset_type) query = query.eq("dataset_type", filters.dataset_type);
    if (filters?.limit) {
      const offset = filters.offset ?? 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as ACSRawData[], count: count ?? 0 };
  },

  async fetchProcessingLogs(filters) {
    let query = (supabase.from as any)("acs_processing_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 20);

    if (filters?.pipeline) query = query.eq("pipeline", filters.pipeline);
    if (filters?.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ACSProcessingLog[];
  },

  async fetchIntelligence(filters) {
    let query = (supabase.from as any)("acs_intelligence_outputs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.limit) {
      const offset = filters.offset ?? 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as ACSIntelligenceOutput[], count: count ?? 0 };
  },

  // ── Phase 2: Audit ────────────────────────────────────────────────────
  async fetchTransformationAudit(filters) {
    let query = (supabase.from as any)("acs_transformation_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 50);

    if (filters?.raw_data_id) query = query.eq("raw_data_id", filters.raw_data_id);
    if (filters?.processing_log_id) query = query.eq("processing_log_id", filters.processing_log_id);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ACSTransformationAudit[];
  },

  subscribeIntelligence(callback) {
    const channel = supabase
      .channel("acs-intelligence-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "acs_intelligence_outputs" },
        (payload) => callback(payload.new as ACSIntelligenceOutput)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
};
