/**
 * Seal Auth — covert admin session manager.
 * Backend-agnostic: only talks to edge functions via supabase client.
 * Session token is stored in sessionStorage (destroyed on tab close).
 */

import { supabase } from "@/integrations/supabase/client";

const SEAL_KEY = "__s_tk";
const SEAL_EMAIL_KEY = "__s_em";

export function getSealSession(): { token: string; email: string } | null {
  const token = sessionStorage.getItem(SEAL_KEY);
  const email = sessionStorage.getItem(SEAL_EMAIL_KEY);
  if (token && email) return { token, email };
  return null;
}

export function setSealSession(token: string, email: string) {
  sessionStorage.setItem(SEAL_KEY, token);
  sessionStorage.setItem(SEAL_EMAIL_KEY, email);
}

export function clearSealSession() {
  sessionStorage.removeItem(SEAL_KEY);
  sessionStorage.removeItem(SEAL_EMAIL_KEY);
}

export function isSealAuthenticated(): boolean {
  return !!getSealSession();
}

export async function requestSealOTP(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-seal-auth", {
      body: { action: "request", email },
    });
    if (error) return { success: false, error: "Email not valid" };
    if (data?.error) return { success: false, error: data.error };
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function verifySealOTP(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-seal-auth", {
      body: { action: "verify", email, code },
    });
    if (error) return { success: false, error: "Verification failed" };
    if (data?.error) return { success: false, error: data.error };
    if (data?.token) {
      setSealSession(data.token, data.email);
      return { success: true };
    }
    return { success: false, error: "Verification failed" };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}
