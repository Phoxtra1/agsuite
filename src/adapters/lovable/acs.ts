// adapters/lovable/acs.ts
import { supabase } from "@/integrations/supabase/client";
import type { ACSAdapter, ACSEvent, ACSSyncLog } from "@/core/backend/acs";

export const acs: ACSAdapter = {
  async sendEvent(event) {
    const { error } = await supabase.from('acs_events').insert([
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
      .from('acs_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.source) {
      query = query.eq('source', filters.source);
    }
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
      .from('acs_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ACSSyncLog[];
  },

  async triggerSync(source) {
    const { data, error } = await supabase
      .from('acs_sync_logs')
      .insert([
        {
          source,
          status: 'syncing',
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) throw error;

    // Simulate sync completion (in production, an edge function would handle this)
    setTimeout(async () => {
      await supabase
        .from('acs_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_synced: Math.floor(Math.random() * 50) + 1,
        })
        .eq('id', data.id);
    }, 2000);

    return data as ACSSyncLog;
  },

  subscribeEvents(callback) {
    const channel = supabase
      .channel('acs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'acs_events' },
        (payload) => {
          callback(payload.new as ACSEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
