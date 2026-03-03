// adapters/lovable/users.ts
import { supabase } from "@/integrations/supabase/client";
import type { UsersAdapter } from "@/core/backend/users";

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
