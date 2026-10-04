import { functions as appwriteFunctions, account, ID } from "@/lib/appwrite";

/**
 * Seal Auth — covert admin session manager.
 * Supports OTP email authentication as well as Admin ID & PIN creation / login.
 */

const SEAL_KEY = "__s_tk";
const SEAL_EMAIL_KEY = "__s_em";
const SEAL_POSITION_KEY = "__s_pos";
const SEAL_ADMIN_ID_KEY = "__s_aid";
const STORAGE_CREDS_KEY = "__seal_admin_creds";
const CLIENT_CREDS_DB_KEY = "__seal_admin_credentials_db";

const SUITE_FUNCTION_ID =
  (import.meta as any).env?.VITE_SUITE_FUNCTION_ID || "agsuite";

const ADMIN_EMAILS = [
  "admin@amineva.com",
  "oap@amineva.com",
  "info.amineva@gmail.com",
];

export interface AdminCredential {
  id: string; // Main Admin ID (e.g. SM-001-SEC1)
  recoveryId: string; // Recovery ID (e.g. RC-849-REC)
  position: string; // Position / Title (e.g. System Manager)
  pin: string; // Secret PIN
  createdAt: string;
}

interface StoredClientCred {
  adminId: string;
  recoveryId: string;
  position: string;
  pinSalt: string;
  pinHash: string;
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

async function hashPinClient(salt: string, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}${pin}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientCredsDb(): StoredClientCred[] {
  try {
    const raw = localStorage.getItem(CLIENT_CREDS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveClientCredsDb(db: StoredClientCred[]) {
  try {
    localStorage.setItem(CLIENT_CREDS_DB_KEY, JSON.stringify(db));
  } catch {}
}

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
 * All Seal admin calls run on the self-hosted Appwrite function `agSuite`.
 * No third-party backend is contacted.
 */
async function callSealFunction(body: Record<string, unknown>): Promise<any> {
  try {
    const execution = await appwriteFunctions.createExecution(
      SUITE_FUNCTION_ID,
      JSON.stringify({ scope: "admin-seal-auth", ...body })
    );
    if (execution.status === "failed") {
      return { error: "Admin service unavailable. Please try again." };
    }
    try {
      return JSON.parse(execution.responseBody || "{}");
    } catch {
      return { error: "Unexpected response from admin service." };
    }
  } catch (err: any) {
    return { error: err?.message || "Could not reach the admin service." };
  }
}

/**
 * One-time migration: push any legacy browser-stored admin credentials to the
 * backend (where PINs are hashed), then wipe them from this device.
 */
async function migrateLegacyCredentials(): Promise<void> {
  try {
    const data = localStorage.getItem(STORAGE_CREDS_KEY);
    if (!data) return;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.removeItem(STORAGE_CREDS_KEY);
      return;
    }
    const result = await callSealFunction({ action: "id-migrate", credentials: parsed });
    if (result?.success) {
      localStorage.removeItem(STORAGE_CREDS_KEY);
    }
  } catch {
    /* best-effort */
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Admin IDs are real accounts on the self-hosted Appwrite server.
 *   Admin ID     → account  <admin-id>@seal.amineva.com
 *   Recovery ID  → account  <recovery-id>@seal.amineva.com (same PIN)
 * The PIN is verified by Appwrite itself (hashed server-side, rate-limited),
 * so credentials are permanent and work from any browser or device.
 * ────────────────────────────────────────────────────────────────────────── */
const SEAL_DOMAIN = "seal.amineva.com";
const sealEmail = (id: string) => `${id.trim().toLowerCase()}@${SEAL_DOMAIN}`;
const sealPassword = (pin: string) => `AmvSeal!${pin}!v1`;

function friendlyAuthError(err: any, fallback: string): string {
  const code = err?.code;
  const msg = String(err?.message || "");
  if (code === 429 || /rate limit/i.test(msg)) return "Too many attempts. Please wait a few minutes and try again.";
  if (code === 401 || /invalid credentials/i.test(msg)) return "Incorrect Admin ID or PIN.";
  if (/failed to fetch|network/i.test(msg)) return "Could not reach the server. Check your connection.";
  return msg || fallback;
}

async function startSealAccountSession(id: string, pin: string) {
  await account.deleteSession("current").catch(() => null);
  await account.createEmailPasswordSession(sealEmail(id), sealPassword(pin));
  return account.get();
}

async function registerSealAccount(id: string, pin: string, position: string, prefs: Record<string, unknown>) {
  await account.deleteSession("current").catch(() => null);
  await account.create(ID.unique(), sealEmail(id), sealPassword(pin), position.slice(0, 120));
  await account.createEmailPasswordSession(sealEmail(id), sealPassword(pin));
  await account.updatePrefs({ seal: true, position, createdAt: new Date().toISOString(), ...prefs });
}

/**
 * Create a new Admin Credential on the Appwrite server.
 */
export async function createAdminCredential(
  position: string,
  pin: string
): Promise<{ success: boolean; credential?: AdminCredential; error?: string }> {
  const cleanPos = position.trim() || "System Administrator";
  const cleanPin = pin.trim();

  if (!/^\d{4,12}$/.test(cleanPin)) {
    return { success: false, error: "PIN must be 4–12 digits." };
  }

  const adminId = `SM-${generateAlphaNumeric(3)}-${generateAlphaNumeric(4)}`;
  const recoveryId = `RC-${generateAlphaNumeric(3)}-${generateAlphaNumeric(3)}`;
  const createdAt = new Date().toISOString();

  try {
    // Recovery account first, then the main account so its session stays active.
    await registerSealAccount(recoveryId, cleanPin, cleanPos, { sealRecoveryOf: adminId });
    await registerSealAccount(adminId, cleanPin, cleanPos, { adminId, recoveryId });
  } catch (err: any) {
    await account.deleteSession("current").catch(() => null);
    return { success: false, error: friendlyAuthError(err, "Could not create credential.") };
  }

  return {
    success: true,
    credential: { id: adminId, recoveryId, position: cleanPos, pin: "", createdAt },
  };
}

/** Legacy: credentials that were only ever stored in this browser. */
async function matchLegacyLocalCred(cleanId: string, cleanPin: string): Promise<StoredClientCred | null> {
  const db = getClientCredsDb();
  const matched = db.find((c) => c.adminId.toUpperCase() === cleanId || c.recoveryId.toUpperCase() === cleanId);
  if (!matched) return null;
  return (await hashPinClient(matched.pinSalt, cleanPin)) === matched.pinHash ? matched : null;
}

/**
 * Authenticate via Admin ID or Recovery ID and PIN — verified by the Appwrite server.
 */
export async function verifyAdminCredentials(
  idOrRecoveryId: string,
  pin: string
): Promise<{ success: boolean; credential?: AdminCredential; error?: string }> {
  const cleanId = idOrRecoveryId.trim().toUpperCase();
  const cleanPin = pin.trim();

  if (!cleanId) return { success: false, error: "Please enter an Admin ID or Recovery ID." };
  if (!cleanPin) return { success: false, error: "Please enter your PIN." };

  let user: any;
  try {
    user = await startSealAccountSession(cleanId, cleanPin);
  } catch (err: any) {
    // An ID created earlier that only lived in this browser: move it to the server once.
    const legacy = err?.code === 401 ? await matchLegacyLocalCred(cleanId, cleanPin) : null;
    if (!legacy) return { success: false, error: friendlyAuthError(err, "Authentication failed.") };
    try {
      await registerSealAccount(legacy.recoveryId, cleanPin, legacy.position, { sealRecoveryOf: legacy.adminId });
    } catch { /* may already exist */ }
    try {
      await registerSealAccount(legacy.adminId, cleanPin, legacy.position, {
        adminId: legacy.adminId,
        recoveryId: legacy.recoveryId,
      });
    } catch { /* may already exist */ }
    try {
      user = await startSealAccountSession(cleanId, cleanPin);
      saveClientCredsDb(getClientCredsDb().filter((c) => c.adminId !== legacy.adminId));
    } catch (e: any) {
      return { success: false, error: friendlyAuthError(e, "Authentication failed.") };
    }
  }

  const prefs = user?.prefs || {};
  if (!prefs.seal) {
    await account.deleteSession("current").catch(() => null);
    return { success: false, error: "Unrecognised Admin ID." };
  }
  const adminId = String(prefs.sealRecoveryOf || prefs.adminId || cleanId);
  const position = String(prefs.position || user?.name || "System Administrator");
  const emailAlias = `${position.toLowerCase().replace(/[^a-z0-9]/g, ".")}@amineva.com`;
  const token = `seal_${user.$id}_${Date.now().toString(36)}`;
  setSealSession(token, emailAlias, position, adminId);

  return {
    success: true,
    credential: {
      id: adminId,
      recoveryId: String(prefs.recoveryId || (prefs.sealRecoveryOf ? cleanId : "")),
      position,
      pin: "",
      createdAt: String(prefs.createdAt || user?.$createdAt || ""),
    },
  };
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
