import { createClient } from "@supabase/supabase-js";

const env = (import.meta as any).env || {};
const supabaseUrl = String(env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(
  env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * The Amineva account/portal authentication client is Supabase-only.
 * The local placeholder prevents an import-time crash in an unconfigured
 * preview, but auth actions must call assertSupabaseConfigured() before use.
 * It is not a fallback identity provider and never contacts Appwrite.
 */
const clientUrl = supabaseUrl || "https://supabase-not-configured.invalid";
const clientKey = supabaseAnonKey || "supabase-public-key-not-configured";

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
  global: {
    headers: { "X-Amineva-Client": "Amineva-Global" },
  },
});

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deployment environment."
    );
  }
}

export default supabase;
