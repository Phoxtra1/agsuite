// adapters/lovable/acs.ts
import { supabase } from "@/integrations/supabase/client";
import type { ACSAdapter } from "@/core/backend/acs";

export const acs: ACSAdapter = {
  async sendEvent(event) {
    // Use type assertion since acs_events table will be created via migration
    const { error } = await (supabase as any).from('acs_events').insert([
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
