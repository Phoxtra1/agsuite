import { supabase } from "@/integrations/supabase/client";

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

export function formatAuthError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as any).message as string;
    if (msg.includes("Invalid login")) return "Invalid email or password.";
    if (msg.includes("Email not confirmed")) return "Please verify your email before signing in.";
    if (msg.includes("already registered")) return "This email is already registered.";
    return msg;
  }
  return "An unexpected error occurred.";
}
