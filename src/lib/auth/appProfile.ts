/**
 * App Profile — strict per-(user, app) profile loader.
 *
 * Hard rules:
 *  - Always filter by BOTH user_id AND app_id.
 *  - Never `.limit(1)` without filters; never load "first record".
 *  - Never reuse a profile fetched from a previous user/app.
 */
import { supabase } from "@/integrations/supabase/client";

export interface AppProfile {
  id: string;
  user_id: string;
  app_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  metadata: Record<string, unknown>;
}

export async function loadAppProfile(
  userId: string,
  appId: string
): Promise<AppProfile | null> {
  if (!userId || !appId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, app_id, display_name, avatar_url, role, status, metadata")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();

  if (error) {
    console.error("[appProfile] load failed", error);
    return null;
  }
  return (data as AppProfile) ?? null;
}
