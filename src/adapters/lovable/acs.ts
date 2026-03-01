// adapters/lovable/acs.ts
import { createClient } from '@supabase/supabase-js';
import type { ACSAdapter } from "@/core/backend/acs";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

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
};
