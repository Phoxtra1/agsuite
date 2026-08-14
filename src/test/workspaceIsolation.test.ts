/**
 * Workspace cross-user leak regression suite.
 *
 * Simulates two accounts signing in on the SAME browser and asserts that no
 * Workspace surface (Docs, Sheets, Slides, Forms, Drive) ever exposes content
 * created by the other account — neither from the backend nor from local caches.
 *
 * The backend mock deliberately does NOT emulate RLS: every seeded row is
 * visible unless the calling code applies an explicit `owner_id` filter. Any
 * module that forgets to scope its query therefore fails these tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------- backend mock

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

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => makeQuery(String(table)),
    auth: {
      getUser: async () => ({ data: { user: currentUser }, error: null }),
      getSession: async () => ({ data: { session: currentUser ? { user: currentUser } : null }, error: null }),
    },
    storage: { from: () => ({ upload: async () => ({ data: null, error: null }) }) },
    rpc: async () => ({ data: null, error: null }),
  },
}));

import { setWorkspaceUser, wsKey, getWorkspaceUser } from "@/lib/workspace/scope";
import { listDocuments } from "@/lib/workspace/documents";
import { listSheets } from "@/lib/workspace/sheets/documents";
import { listDecks } from "@/lib/workspace/slides/documents";
import { listForms } from "@/lib/workspace/forms/documents";
import { listFolder } from "@/lib/workspace/drive/documents";

// ---------------------------------------------------------------- helpers

const USER_A = { id: "user-a-0000-0000", email: "a@amineva.com" };
const USER_B = { id: "user-b-1111-1111", email: "b@amineva.com" };

function signIn(user: { id: string; email: string } | null) {
  currentUser = user;
  setWorkspaceUser(user?.id ?? null);
}

function stamp(owner: string, id: string, title: string): Row {
  return {
    id,
    owner_id: owner,
    title,
    content_json: {},
    content_text: title,
    workbook: {},
    deck: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function seedAllTables() {
  for (const table of ["workspace_documents", "workspace_sheets", "workspace_slides"]) {
    db[table] = [
      stamp(USER_A.id, `${table}-a`, "A private item"),
      stamp(USER_B.id, `${table}-b`, "B private item"),
    ];
  }
  db.drive_folders = [
    { id: "fold-a", name: "A folder", parent_id: null, owner_id: USER_A.id },
    { id: "fold-b", name: "B folder", parent_id: null, owner_id: USER_B.id },
  ];
  db.drive_files = [
    { id: "file-a", name: "A.pdf", folder_id: null, owner_id: USER_A.id, trashed_at: null, size_bytes: 10 },
    { id: "file-b", name: "B.pdf", folder_id: null, owner_id: USER_B.id, trashed_at: null, size_bytes: 10 },
  ];
}

const titlesOf = (rows: Array<{ title?: string; name?: string }>) =>
  rows.map((r) => r.title ?? r.name ?? "");

beforeEach(() => {
  localStorage.clear();
  Object.keys(db).forEach((k) => delete db[k]);
  seedAllTables();
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  signIn(null);
});

// ---------------------------------------------------------------- tests

describe("Workspace isolation — backend reads are owner-scoped", () => {
  it("Docs never return another account's documents", async () => {
    signIn(USER_A);
    expect(titlesOf(await listDocuments())).toEqual(["A private item"]);
    signIn(USER_B);
    expect(titlesOf(await listDocuments())).toEqual(["B private item"]);
  });

  it("Sheets never return another account's workbooks", async () => {
    signIn(USER_A);
    expect(titlesOf(await listSheets())).toEqual(["A private item"]);
    signIn(USER_B);
    expect(titlesOf(await listSheets())).toEqual(["B private item"]);
  });

  it("Slides never return another account's decks", async () => {
    signIn(USER_A);
    expect(titlesOf(await listDecks())).toEqual(["A private item"]);
    signIn(USER_B);
    expect(titlesOf(await listDecks())).toEqual(["B private item"]);
  });

  it("Drive never lists another account's files or folders", async () => {
    signIn(USER_A);
    let res = await listFolder(null);
    expect(titlesOf(res.files)).toEqual(["A.pdf"]);
    expect(titlesOf(res.folders)).toEqual(["A folder"]);

    signIn(USER_B);
    res = await listFolder(null);
    expect(titlesOf(res.files)).toEqual(["B.pdf"]);
    expect(titlesOf(res.folders)).toEqual(["B folder"]);
  });

  it("signed-out reads expose nothing", async () => {
    signIn(null);
    expect(await listDocuments()).toEqual([]);
    expect(await listSheets()).toEqual([]);
    expect(await listDecks()).toEqual([]);
  });
});

describe("Workspace isolation — local caches are account-scoped", () => {
  it("cache keys are namespaced per account and differ between logins", () => {
    signIn(USER_A);
    const keyA = wsKey("amineva_workspace_docs");
    expect(getWorkspaceUser()).toBe(USER_A.id);
    signIn(USER_B);
    const keyB = wsKey("amineva_workspace_docs");
    expect(keyB).not.toBe(keyA);
    expect(keyB.endsWith(USER_B.id)).toBe(true);
  });

  it("switching accounts purges the previous account's cached content", async () => {
    signIn(USER_A);
    await listDocuments(); // warms A's cache
    const keyA = wsKey("amineva_workspace_docs");
    expect(localStorage.getItem(keyA)).toContain("A private item");

    signIn(USER_B);
    expect(localStorage.getItem(keyA)).toBeNull();
    const docs = await listDocuments();
    expect(JSON.stringify(docs)).not.toContain("A private item");
  });

  it("legacy unscoped caches are never served to a signed-in account", async () => {
    localStorage.setItem(
      "amineva_workspace_docs",
      JSON.stringify([stamp("legacy", "legacy-doc", "Legacy shared doc")])
    );
    signIn(USER_A);
    const docs = await listDocuments();
    expect(JSON.stringify(docs)).not.toContain("Legacy shared doc");
    expect(localStorage.getItem("amineva_workspace_docs")).toBeNull();
  });

  it("Forms content written by one account is invisible to the next", async () => {
    signIn(USER_A);
    localStorage.setItem(wsKey("amineva_forms"), JSON.stringify([{ id: "f1", title: "A survey" }]));
    expect(titlesOf(await listForms() as any)).toEqual(["A survey"]);

    signIn(USER_B);
    expect(await listForms()).toEqual([]);
  });

  it("offline mode still serves only the active account's cache", async () => {
    signIn(USER_A);
    await listDocuments();
    signIn(USER_B);
    await listDocuments();
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const offlineDocs = await listDocuments();
    expect(JSON.stringify(offlineDocs)).not.toContain("A private item");
  });

  it("sign-out leaves no account content readable", async () => {
    signIn(USER_A);
    await listDocuments();
    signIn(null);
    const leaked = Object.keys(localStorage)
      .filter((k) => k.includes(USER_A.id))
      .map((k) => localStorage.getItem(k) ?? "")
      .join("");
    expect(leaked).not.toContain("A private item");
    expect(await listDocuments()).toEqual([]);
  });
});
