import { supabase } from "@/integrations/supabase/client";

/**
 * Seal Auth — covert admin session manager.
 * Supports OTP email authentication as well as Admin ID & PIN creation / login.
 */

const SEAL_KEY = "__s_tk";
const SEAL_EMAIL_KEY = "__s_em";
const SEAL_POSITION_KEY = "__s_pos";
const SEAL_ADMIN_ID_KEY = "__s_aid";
const STORAGE_CREDS_KEY = "__seal_admin_creds";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const ADMIN_EMAILS = [
  "admin@amineva.com",
  "oap@amineva.com",
  "info.amineva@gmail.com",
];

export interface AdminCredential {
  id: string; // Main Admin ID (e.g. AMV-SEC-784920)
  recoveryId: string; // Recovery ID (e.g. AMV-REC-93021482)
  position: string; // Position / Title (e.g. System Manager)
  pin: string; // Secret PIN
  createdAt: string;
}

function generateAlphaNumeric(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Default fallback credential for instant initial admin access if none created yet
const DEFAULT_SYSTEM_CRED: AdminCredential = {
  id: "SM-001-SEC1",
  recoveryId: "RC-999-REC",
  position: "System Manager",
  pin: "1234",
  createdAt: new Date().toISOString(),
};

export function getSealSession(): { token: string; email: string; position?: string; id?: string } | null {
  const token = sessionStorage.getItem(SEAL_KEY) || localStorage.getItem(SEAL_KEY);
  const email = sessionStorage.getItem(SEAL_EMAIL_KEY) || localStorage.getItem(SEAL_EMAIL_KEY);
  const position = sessionStorage.getItem(SEAL_POSITION_KEY) || localStorage.getItem(SEAL_POSITION_KEY) || undefined;
  const id = sessionStorage.getItem(SEAL_ADMIN_ID_KEY) || localStorage.getItem(SEAL_ADMIN_ID_KEY) || undefined;
  if (token && email) return { token, email, position, id };
  return null;
}

export function setSealSession(token: string, email: string, position?: string, id?: string) {
  sessionStorage.setItem(SEAL_KEY, token);
  sessionStorage.setItem(SEAL_EMAIL_KEY, email);
  localStorage.setItem(SEAL_KEY, token);
  localStorage.setItem(SEAL_EMAIL_KEY, email);
  if (position) {
    sessionStorage.setItem(SEAL_POSITION_KEY, position);
    localStorage.setItem(SEAL_POSITION_KEY, position);
  }
  if (id) {
    sessionStorage.setItem(SEAL_ADMIN_ID_KEY, id);
    localStorage.setItem(SEAL_ADMIN_ID_KEY, id);
  }
}

export function clearSealSession() {
  sessionStorage.removeItem(SEAL_KEY);
  sessionStorage.removeItem(SEAL_EMAIL_KEY);
  sessionStorage.removeItem(SEAL_POSITION_KEY);
  sessionStorage.removeItem(SEAL_ADMIN_ID_KEY);
  localStorage.removeItem(SEAL_KEY);
  localStorage.removeItem(SEAL_EMAIL_KEY);
  localStorage.removeItem(SEAL_POSITION_KEY);
  localStorage.removeItem(SEAL_ADMIN_ID_KEY);
}

export function isSealAuthenticated(): boolean {
  return !!getSealSession();
}

/**
 * Retrieve all created Admin Credentials stored in persistence.
 */
export function getStoredAdminCredentials(): AdminCredential[] {
  try {
    const data = localStorage.getItem(STORAGE_CREDS_KEY);
    if (!data) return [DEFAULT_SYSTEM_CRED];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [DEFAULT_SYSTEM_CRED];
  } catch {
    return [DEFAULT_SYSTEM_CRED];
  }
}

/**
 * Create a new Admin Credential with Position, PIN, Main Admin ID (SM-XXX-XXXX) and Recovery ID (RC-XXX-XXX).
 */
export function createAdminCredential(position: string, pin: string): AdminCredential {
  const cleanPos = position.trim() || "System Manager";
  const cleanPin = pin.trim();

  // Generate SM-XXX-XXXX and RC-XXX-XXX
  const mainId = `SM-${generateAlphaNumeric(3)}-${generateAlphaNumeric(4)}`;
  const recoveryId = `RC-${generateAlphaNumeric(3)}-${generateAlphaNumeric(3)}`;

  const newCred: AdminCredential = {
    id: mainId,
    recoveryId,
    position: cleanPos,
    pin: cleanPin,
    createdAt: new Date().toISOString(),
  };

  const current = getStoredAdminCredentials();
  const updated = [newCred, ...current.filter((c) => c.id !== mainId)];
  localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(updated));

  return newCred;
}

/**
 * Authenticate via Admin ID or Recovery ID and PIN.
 */
export function verifyAdminCredentials(
  idOrRecoveryId: string,
  pin: string
): { success: boolean; credential?: AdminCredential; error?: string } {
  const cleanId = idOrRecoveryId.trim().toUpperCase();
  const cleanPin = pin.trim();

  if (!cleanId) {
    return { success: false, error: "Please enter an Admin ID or Recovery ID." };
  }
  if (!cleanPin) {
    return { success: false, error: "Please enter your PIN." };
  }

  const creds = getStoredAdminCredentials();

  // Match main ID or recovery ID (case-insensitive)
  const matched = creds.find(
    (c) => c.id.toUpperCase() === cleanId || c.recoveryId.toUpperCase() === cleanId
  );

  if (!matched) {
    return { success: false, error: "Unrecognized Admin ID or Recovery ID." };
  }

  if (matched.pin !== cleanPin) {
    return { success: false, error: "Invalid Security PIN. Please try again." };
  }

  // Create session
  const mockToken = `seal_id_tk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const emailAlias = `${matched.position.toLowerCase().replace(/[^a-z0-9]/g, ".")}@amineva.com`;
  setSealSession(mockToken, emailAlias, matched.position, matched.id);

  return { success: true, credential: matched };
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

    if (!ADMIN_EMAILS.includes(trimmed)) {
      return {
        success: false,
        error: "Access Denied: This account is not authorized.",
      };
    }

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

    const data = await callSealFunction({ action: "verify", email: trimmed, code });
    if (data?.error) {
      return { success: false, error: data.error };
    }

    if (data?.token) {
      setSealSession(data.token, data.email, "System Administrator", "AMV-OTP-AUTH");
      return { success: true };
    }

    return { success: false, error: "Verification failed." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Invalid or expired verification code." };
  }
}

