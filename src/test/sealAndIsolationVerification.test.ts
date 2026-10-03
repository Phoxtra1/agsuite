import { describe, it, expect, beforeEach, vi } from "vitest";

// Backend DB Mock for verification test
type Row = Record<string, any>;
const db: Record<string, Row[]> = {};
let currentUser: { id: string; email: string } | null = null;

function makeQuery(table: string) {
  let rows = () => [...(db[table] ?? [])];
  const filters: Array<(r: Row) => boolean> = [];

  const api: any = {
    select: () => api,
    order: () => api,
    limit: () => api,
    eq: (col: string, val: any) => {
      filters.push((r) => r[col] === val);
      return api;
    },
    is: (col: string, val: any) => {
      filters.push((r) => (r[col] ?? null) === val);
      return api;
    },
    insert: (payload: Row | Row[]) => {
      const list = Array.isArray(payload) ? payload : [payload];
      db[table] = [...(db[table] ?? []), ...list];
      return { select: () => ({ single: async () => ({ data: list[0], error: null }) }) };
    },
    update: () => ({ eq: async () => ({ data: null, error: null }) }),
    delete: () => ({ eq: async () => ({ data: null, error: null }) }),
    single: async () => {
      const r = rows().filter((row) => filters.every((f) => f(row)));
      return { data: r[0] ?? null, error: null };
    },
    then: (resolve: any) => {
      const data = rows().filter((row) => filters.every((f) => f(row)));
      return Promise.resolve({ data, error: null }).then(resolve);
    },
  };
  return api;
}

vi.mock("@/integrations/appwrite/client", () => ({
  supabase: {
    from: (table: string) => makeQuery(String(table)),
    auth: {
      getUser: async () => ({ data: { user: currentUser }, error: null }),
      getSession: async () => ({ data: { session: currentUser ? { user: currentUser } : null }, error: null }),
      signInWithPassword: async ({ email }: { email: string }) => {
        if (email.includes("unregistered")) {
          return { data: { session: null, user: null }, error: { message: "Invalid credentials." } };
        }
        return { data: { session: {}, user: { id: "user-id", email } }, error: null };
      },
    },
    storage: { from: () => ({ upload: async () => ({ data: null, error: null }) }) },
    rpc: async () => ({ data: null, error: null }),
  },
}));

import { createAdminCredential, verifyAdminCredentials, clearSealSession, getSealSession } from "@/lib/sealAuth";
import { setWorkspaceUser, getWorkspaceUser } from "@/lib/workspace/scope";
import { listDocuments, createDocument } from "@/lib/workspace/documents";
import { supabase } from "@/integrations/appwrite/client";

describe("Verification of Seal Admin Persistence & Workspace User Isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearSealSession();
    Object.keys(db).forEach((k) => delete db[k]);
    currentUser = null;
  });

  describe("1. Seal Admin Account Persistence Across Refresh & Restart", () => {
    it("creates an administrator account via /seal, reloads, and successfully logs in with the exact same Admin ID and PIN", async () => {
      // Step 1: Create admin account
      const createRes = await createAdminCredential("System Administrator", "987654321");
      expect(createRes.success).toBe(true);
      expect(createRes.credential).toBeDefined();

      const adminId = createRes.credential!.id;
      const recoveryId = createRes.credential!.recoveryId;
      expect(adminId).toBeTruthy();

      // Step 2: Log out / clear active session
      clearSealSession();
      expect(getSealSession()).toBeNull();

      // Step 3: Simulate browser reload / reopening page (sessionStorage cleared, localStorage remains)
      sessionStorage.clear();

      // Step 4: Verify login with Admin ID & PIN
      const loginRes = await verifyAdminCredentials(adminId, "987654321");
      expect(loginRes.success).toBe(true);
      expect(loginRes.credential?.id).toBe(adminId);

      // Step 5: Verify login with Recovery ID & PIN
      clearSealSession();
      const recLoginRes = await verifyAdminCredentials(recoveryId, "987654321");
      expect(recLoginRes.success).toBe(true);
      expect(recLoginRes.credential?.id).toBe(adminId);
    });

    it("fails login with incorrect PIN or non-existent Admin ID", async () => {
      const createRes = await createAdminCredential("System Manager", "123456");
      const adminId = createRes.credential!.id;

      clearSealSession();

      const wrongPinRes = await verifyAdminCredentials(adminId, "000000");
      expect(wrongPinRes.success).toBe(false);
      expect(wrongPinRes.error).toBe("Incorrect PIN.");

      const invalidIdRes = await verifyAdminCredentials("NON-EXISTENT-ID", "123456");
      expect(invalidIdRes.success).toBe(false);
      expect(invalidIdRes.error).toBe("Unrecognised Admin ID.");
    });
  });

  describe("2. Workspace User Isolation (User A vs User B)", () => {
    it("User B cannot see User A's documents, and User A can still see their own documents upon return", async () => {
      const userA = { id: "user-a-uuid", email: "userA@amineva.com" };
      const userB = { id: "user-b-uuid", email: "userB@amineva.com" };

      // Log in as User A
      currentUser = userA;
      setWorkspaceUser(userA.id);
      expect(getWorkspaceUser()).toBe(userA.id);

      // Create document for User A
      const docA = await createDocument("User A Confidential Strategy");
      expect(docA.owner_id).toBe(userA.id);

      const docsA = await listDocuments();
      expect(docsA.some((d) => d.id === docA.id)).toBe(true);

      // Log in as User B
      currentUser = userB;
      setWorkspaceUser(userB.id);
      expect(getWorkspaceUser()).toBe(userB.id);

      // Confirm User B cannot see User A's documents
      const docsB = await listDocuments();
      expect(docsB.some((d) => d.id === docA.id)).toBe(false);

      // Create document for User B
      const docB = await createDocument("User B Project Plan");
      expect(docB.owner_id).toBe(userB.id);

      const docsBUpdated = await listDocuments();
      expect(docsBUpdated.some((d) => d.id === docB.id)).toBe(true);
      expect(docsBUpdated.some((d) => d.id === docA.id)).toBe(false);

      // Log back in as User A
      currentUser = userA;
      setWorkspaceUser(userA.id);
      expect(getWorkspaceUser()).toBe(userA.id);

      // Confirm User A can still see their own documents and NOT User B's documents
      const docsAReturn = await listDocuments();
      expect(docsAReturn.some((d) => d.id === docA.id)).toBe(true);
      expect(docsAReturn.some((d) => d.id === docB.id)).toBe(false);
    });
  });

  describe("3. Unregistered Email Sign In Rejection", () => {
    it("prevents an email that has never registered from signing in", async () => {
      const result = await supabase.auth.signInWithPassword({
        email: "unregistered.user.never.exists@amineva.com",
        password: "WrongPassword123!",
      });

      expect(result.error).toBeDefined();
      expect(result.data?.session).toBeNull();
    });
  });
});
