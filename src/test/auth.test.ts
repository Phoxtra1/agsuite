import { describe, it, expect } from "vitest";
import { formatAuthError, isAlreadyRegisteredError } from "@/lib/auth";
import { formatAuthError as formatAppwriteAuthError } from "@/lib/auth/appwriteAuth";
import { supabase } from "@/integrations/appwrite/client";

describe("Amineva Auth Error Handling", () => {
  it("formats 'Failed to fetch' error into a friendly network error message", () => {
    const err = new TypeError("Failed to fetch");
    const formatted = formatAuthError(err);
    expect(formatted).toContain("Unable to connect to authentication server");
    expect(formatted).not.toEqual("Failed to fetch");
  });

  it("formats invalid credentials error correctly", () => {
    const err = new Error("Invalid credentials");
    const formatted = formatAuthError(err);
    expect(formatted).toBe("Invalid email or password.");
  });

  it("identifies already registered errors correctly", () => {
    const err409 = new Error("A user with the same email already exists (code 409)");
    expect(isAlreadyRegisteredError(err409)).toBe(true);

    const errType = { message: "user_already_exists" };
    expect(isAlreadyRegisteredError(errType)).toBe(true);

    const otherErr = new Error("Invalid password");
    expect(isAlreadyRegisteredError(otherErr)).toBe(false);
  });

  it("formats Appwrite auth error nicely", () => {
    const err = new TypeError("Failed to fetch");
    const formatted = formatAppwriteAuthError(err);
    expect(formatted).toContain("Unable to connect to authentication server");
  });

  it("handles signUp offline / fallback behavior gracefully when disabled auth is active", async () => {
    const res = await supabase.auth.signUp({
      email: "test_resilient_user@example.com",
      password: "password12345",
      options: { data: { name: "Test Resilient User" } },
    });

    expect(res).toBeDefined();
    // Either a session/user is created or a structured error is returned, never throws raw unhandled exception
    if (res.data?.user) {
      expect(res.data.user.email).toBe("test_resilient_user@example.com");
    } else {
      expect(res.error?.message).toBeDefined();
    }
  });
});
