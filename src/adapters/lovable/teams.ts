// adapters/lovable/teams.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * Fetch teams for a user
 */
export async function getUserTeams(userId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .contains('members', [userId]);

  if (error) throw error;
  return data;
}
