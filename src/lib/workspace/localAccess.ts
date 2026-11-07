/**
 * Trusted-device offline access for Amineva Workspace.
 *
 * This is a device-local unlock, not a cloud auth session. It never creates an
 * online identity, token, or product entitlement. The passphrase verifier is
 * salted and derived with PBKDF2; the passphrase itself is never persisted.
 *
 * This gate protects against casual access to an already-open browser profile.
 * It is not full disk encryption: browser-profile/OS access can still expose
 * locally stored Workspace data. Use device encryption and an OS login too.
 */
import { getWorkspaceUser } from "@/lib/workspace/scope";

const DB_NAME = "amineva-workspace-access";
const DB_VERSION = 1;
const STORE = "profiles";
const LAST_PROFILE_KEY = "amineva_offline_profile_id";
const ITERATIONS = 310_000;
const MIN_PASSPHRASE_LENGTH = 12;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

interface OfflineProfile {
  userId: string;
  email: string;
  salt: string;
  verifier: string;
  createdAt: string;
  failedAttempts: number;
  lockedUntil: number;
}

let offlineMode = false;

export function setWorkspaceOfflineMode(enabled: boolean) {
  offlineMode = enabled;
}

export function isWorkspaceOfflineMode() {
  return offlineMode;
}

function requireCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Secure device unlock is not available in this browser context. Open Amineva over HTTPS or use a supported browser.");
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function deriveVerifier(passphrase: string, salt: Uint8Array): Promise<string> {
  requireCrypto();
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = fromBase64(a);
  const right = fromBase64(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support trusted-device storage."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open trusted-device storage."));
    request.onblocked = () => reject(new Error("Close older Amineva tabs and retry device setup."));
  });
}

async function getProfile(userId: string): Promise<OfflineProfile | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const request = tx.objectStore(STORE).get(userId);
  const profile = await new Promise<OfflineProfile | null>((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as OfflineProfile | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return profile;
}

async function saveProfile(profile: OfflineProfile): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(profile);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not save offline access."));
    tx.onabort = () => reject(tx.error || new Error("Offline access setup was cancelled."));
  });
  db.close();
}

export async function getOfflineAccessProfile(): Promise<{ userId: string; email: string } | null> {
  let lastUserId = "";
  try { lastUserId = localStorage.getItem(LAST_PROFILE_KEY) || ""; } catch { /* unavailable */ }
  if (!lastUserId) lastUserId = getWorkspaceUser();
  if (!lastUserId || lastUserId === "anon" || lastUserId === "local-user") return null;
  const profile = await getProfile(lastUserId);
  return profile ? { userId: profile.userId, email: profile.email } : null;
}

export async function hasOfflineAccess(userId: string): Promise<boolean> {
  return !!(await getProfile(userId));
}

/** Remember which enrolled account was most recently used on this device. */
export function selectOfflineAccessProfile(userId: string): void {
  if (!userId || userId === "anon" || userId === "local-user") return;
  try { localStorage.setItem(LAST_PROFILE_KEY, userId); } catch { /* optional */ }
}

export async function enrollOfflineWorkspace(userId: string, email: string, passphrase: string): Promise<void> {
  if (!userId || userId === "anon" || userId === "local-user") {
    throw new Error("A real, authenticated account is required to enable offline access.");
  }
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Use a device passphrase of at least ${MIN_PASSPHRASE_LENGTH} characters.`);
  }
  requireCrypto();
  const salt = randomBytes(16);
  const verifier = await deriveVerifier(passphrase, salt);
  await saveProfile({
    userId,
    email: email || "",
    salt: toBase64(salt),
    verifier,
    createdAt: new Date().toISOString(),
    failedAttempts: 0,
    lockedUntil: 0,
  });
  try { localStorage.setItem(LAST_PROFILE_KEY, userId); } catch { /* optional */ }
  offlineMode = false;
}

export async function unlockOfflineWorkspace(passphrase: string): Promise<{ userId: string; email: string }> {
  requireCrypto();
  const profileRef = await getOfflineAccessProfile();
  if (!profileRef) throw new Error("Offline access has not been enabled for this device.");
  const profile = await getProfile(profileRef.userId);
  if (!profile) throw new Error("Offline access profile is no longer available.");

  if (profile.lockedUntil > Date.now()) {
    const seconds = Math.ceil((profile.lockedUntil - Date.now()) / 1000);
    throw new Error(`Too many attempts. Try again in ${seconds} seconds.`);
  }

  const candidate = await deriveVerifier(passphrase, fromBase64(profile.salt));
  if (!constantTimeEqual(candidate, profile.verifier)) {
    const failedAttempts = profile.failedAttempts + 1;
    await saveProfile({
      ...profile,
      failedAttempts: failedAttempts >= MAX_ATTEMPTS ? 0 : failedAttempts,
      lockedUntil: failedAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : profile.lockedUntil,
    });
    throw new Error(failedAttempts >= MAX_ATTEMPTS
      ? "Too many incorrect passphrases. This device is temporarily locked for one minute."
      : "The device passphrase is incorrect.");
  }

  await saveProfile({ ...profile, failedAttempts: 0, lockedUntil: 0 });
  try { localStorage.setItem(LAST_PROFILE_KEY, profile.userId); } catch { /* optional */ }
  offlineMode = true;
  return { userId: profile.userId, email: profile.email };
}

export async function disableOfflineWorkspace(userId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(userId);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not remove offline access."));
  });
  db.close();
  try {
    if (localStorage.getItem(LAST_PROFILE_KEY) === userId) localStorage.removeItem(LAST_PROFILE_KEY);
  } catch { /* optional */ }
  offlineMode = false;
}
