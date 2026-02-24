// adapters/lovable/acs.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * Send event to ACS
 */
export async function sendEvent(event: {
  type: string;
  payload?: any;
}) {
  const { error } = await supabase.from('acs_events').insert([
    {
      type: event.type,
      payload: event.payload ?? {},
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;
}
