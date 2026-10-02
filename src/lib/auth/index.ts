import { supabase } from "@/integrations/appwrite/client";

export type AuthResult<T> = { data: T } | { error: string };

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function register(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function isAlreadyRegisteredError(err: unknown): boolean {
  if (err && typeof err === "object" && "message" in err) {
    const msg = ((err as any).message as string).toLowerCase();
    return (
      msg.includes("already registered") ||
      msg.includes("user already registered") ||
      msg.includes("already exists") ||
      msg.includes("user_already_exists") ||
      msg.includes("409")
    );
  }
  return false;
}

export function formatAuthError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const rawMsg = (err as any).message as string;
    const lower = rawMsg.toLowerCase();

    if (
      lower.includes("failed to fetch") ||
      lower.includes("networkerror") ||
      lower.includes("network error") ||
      lower.includes("load failed") ||
      lower.includes("connection refused")
    ) {
      return "Unable to connect to authentication server. Please check your internet connection and try again.";
    }

    if (
      lower.includes("invalid login") ||
      lower.includes("invalid credentials") ||
      lower.includes("user_invalid_credentials") ||
      lower.includes("invalid password")
    ) {
      return "Invalid email or password.";
    }

    if (lower.includes("email not confirmed") || lower.includes("unverified")) {
      return "Please verify your email address before signing in.";
    }

    if (isAlreadyRegisteredError(err)) {
      return "This email is already registered. Please sign in.";
    }

    return rawMsg;
  }
  return "An unexpected error occurred. Please try again.";
}
