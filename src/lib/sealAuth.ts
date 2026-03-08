/**
 * Seal Auth — covert admin session manager.
 * Backend-agnostic: talks to edge functions via fetch with anon key.
 * Session token is stored in sessionStorage (destroyed on tab close).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
    const data = await callSealFunction({ action: "request", email });
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
    const data = await callSealFunction({ action: "verify", email, code });
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
