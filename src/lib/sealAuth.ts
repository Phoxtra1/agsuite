import { supabase } from "@/integrations/supabase/client";

/**
 * Seal Auth — covert admin session manager.
 * Talk to custom admin-seal-auth Edge Function via fetch with anon key.
 * Session token is stored in sessionStorage (destroyed on tab close).
 */

const SEAL_KEY = "__s_tk";
const SEAL_EMAIL_KEY = "__s_em";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const ADMIN_EMAILS = [
  "admin@amineva.com",
  "oap@amineva.com",
  "info.amineva@gmail.com",
];

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

async function callSealFunction(body: Record<string, string>): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-seal-auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function requestSealOTP(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // 1. Secretive client-side verification check
    if (!ADMIN_EMAILS.includes(trimmed)) {
      return {
        success: false,
        error: "Access Denied: This account is not authorized.",
      };
    }

    // 2. Delegate OTP generation and ComsSystem email delivery to the Edge Function
    const data = await callSealFunction({ action: "request", email: trimmed });
    if (data?.error) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to trigger security code." };
  }
}

export async function verifySealOTP(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = email.trim().toLowerCase();
    
    // 1. Verify code via server-side custom Edge Function check
    const data = await callSealFunction({ action: "verify", email: trimmed, code });
    if (data?.error) {
      return { success: false, error: data.error };
    }

    if (data?.token) {
      setSealSession(data.token, data.email);
      return { success: true };
    }
    
    return { success: false, error: "Verification failed." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Invalid or expired verification code." };
  }
}
