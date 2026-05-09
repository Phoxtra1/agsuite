/**
 * App Access — centralized authorization check.
 *
 * Authentication (Supabase Auth) only verifies WHO the user is.
 * This module verifies WHETHER they may enter the current app.
 */
import { supabase } from "@/integrations/supabase/client";

export interface AppAccess {
  allowed: boolean;
  appId?: string;
  appSlug: string;
  role?: string;
  permissions?: Record<string, unknown>;
}

export async function loadAppAccess(userId: string, appSlug: string): Promise<AppAccess> {
  // Single query joining user_app_access -> applications, scoped to (user, slug, active).
  const { data, error } = await supabase
    .from("user_app_access")
    .select("role, permissions, active, app_id, applications!inner(id, app_slug, status)")
    .eq("user_id", userId)
    .eq("active", true)
    .eq("applications.app_slug", appSlug)
    .eq("applications.status", "active")
    .maybeSingle();

  if (error) {
    console.error("[appAccess] lookup failed", error);
    return { allowed: false, appSlug };
  }
  if (!data) return { allowed: false, appSlug };

  return {
    allowed: true,
    appSlug,
    appId: data.app_id as string,
    role: data.role as string,
    permissions: (data.permissions as Record<string, unknown>) ?? {},
  };
}
