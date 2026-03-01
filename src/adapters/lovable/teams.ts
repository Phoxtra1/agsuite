// adapters/lovable/teams.ts
import { createClient } from '@supabase/supabase-js';
import type { TeamsAdapter } from "@/core/backend/teams";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export const teams: TeamsAdapter = {
  async inviteMember(email: string, role: string) {
    const { error } = await supabase.from('team_members').insert([
      { email, role, invited_at: new Date().toISOString() },
    ]);
    if (error) throw error;
  },

  async removeMember(userId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  },

  async listMembers() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*');
    if (error) throw error;
    return data ?? [];
  },
};
