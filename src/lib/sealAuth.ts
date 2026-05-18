import { supabase } from "@/integrations/supabase/client";

/**
 * Seal Auth — covert admin session manager.
 * Uses secure Supabase native OTP delivery and is_admin_email validation RPC.
 * Session token is stored in sessionStorage (destroyed on tab close).
 */

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

const ADMIN_EMAILS = [
  "admin@amineva.com",
  "oap@amineva.com",
  "info.amineva@gmail.com",
];

export async function requestSealOTP(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // 1. Secretive verification: strictly enforce allowlisted admin emails
    if (!ADMIN_EMAILS.includes(trimmed)) {
      return {
        success: false,
        error: "Access Denied: This account is not authorized.",
      };
    }

    // 2. Trigger native Supabase email OTP (uses standard SMTP delivery)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: false, // Do not allow arbitrary registration
      },
    });
    if (otpError) throw otpError;

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
    const trimmed = email.trim();
    
    // 1. Verify OTP token client-side
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: trimmed,
      token: code,
      type: "email",
    });
    if (verifyError) throw verifyError;

    if (data.session) {
      setSealSession(data.session.access_token, trimmed);
      return { success: true };
    }
    
    return { success: false, error: "Verification failed." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Invalid or expired verification code." };
  }
}
