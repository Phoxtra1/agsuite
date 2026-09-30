import { ID } from "appwrite";
import { account } from "@/lib/appwrite";

type AppwriteErrorLike = {
  code?: number;
  type?: string;
  message?: string;
  response?: unknown;
};

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Error; appwrite?: AppwriteErrorLike };

function toError(err: unknown): { error: Error; appwrite?: AppwriteErrorLike } {
  if (err instanceof Error) {
    const anyErr = err as unknown as AppwriteErrorLike;
    return { error: err, appwrite: anyErr };
  }

  const message = typeof err === "string" ? err : "Unknown error";
  const e = new Error(message);
  return { error: e, appwrite: err as AppwriteErrorLike };
}

export function formatAuthError(err: unknown): string {
  const { error, appwrite } = toError(err);
  const msg = error?.message || "Authentication failed";

  // Browser/network/CORS failures typically show as TypeError: Failed to fetch
  if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
    return "Unable to connect to authentication server. Please check your internet connection and try again.";
  }

  if (msg.includes("Invalid credentials") || msg.includes("user_invalid_credentials")) {
    return "Invalid email or password.";
  }

  const code = appwrite?.code;
  const type = appwrite?.type;
  if (code || type) {
    return `${msg}${code ? ` (code ${code})` : ""}${type ? ` [${type}]` : ""}`;
  }
  return msg;
}

/**
 * getSession() → returns current session or null
 * Rule: do not call getUser() until this returns a session.
 */
export async function getSession() {
  console.log("SESSION_CHECK_START");
  try {
    const session = await account.getSession("current");
    console.log("SESSION_FOUND");
    return session;
  } catch (err: unknown) {
    const { appwrite, error } = toError(err);

    // If unauthenticated, treat as "no session" rather than a hard error
    if (appwrite?.code === 401 || appwrite?.type === "user_unauthorized") {
      console.log("SESSION_NONE");
      return null;
    }

    // Network/CORS: still surface; callers can show on screen
    console.log("SESSION_NONE");
    throw error;
  }
}

export async function getUser() {
  // Hard rule: never call before confirming a session exists.
  const session = await getSession();
  if (!session) return null;
  return account.get();
}

export async function register(email: string, password: string, name?: string) {
  console.log("REGISTER_START");
  try {
    await account.create(ID.unique(), email.trim(), password, name);
    await account.createEmailPasswordSession(email.trim(), password);
    // Confirm session exists (deterministic)
    const session = await getSession();
    if (!session) throw new Error("Session could not be confirmed after registration");
    console.log("REGISTER_OK");
    return session;
  } catch (err) {
    console.log("REGISTER_FAIL", err);
    throw err;
  }
}

export async function login(email: string, password: string) {
  console.log("LOGIN_START");
  try {
    await account.createEmailPasswordSession(email.trim(), password);
    const session = await getSession();
    if (!session) throw new Error("Session could not be confirmed after login");
    console.log("LOGIN_OK");
    return session;
  } catch (err) {
    console.log("LOGIN_FAIL", err);
    throw err;
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
  } catch {
    // no-op
  }
}
