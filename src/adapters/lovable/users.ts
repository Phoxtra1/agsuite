// adapters/lovable/users.ts
import { createClient } from '@supabase/supabase-js';
import type { UsersAdapter } from "@/core/backend/users";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export const users: UsersAdapter = {
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  },

  async updateProfile(data: Record<string, any>) {
    const { error } = await supabase.auth.updateUser({
      data,
    });
    if (error) throw error;
  },
};
