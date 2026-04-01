// src/adapters/appwrite/acs.ts
// Appwrite ACS adapter — functional stub that connects to Appwrite databases.
// Returns empty/mock data when Appwrite project is not reachable, logs warnings instead of crashing.

import type { ACSAdapter, ACSEvent, ACSSyncLog } from "@/core/backend/acs";

let appwriteAvailable: boolean | null = null;

async function checkAppwrite(): Promise<boolean> {
  if (appwriteAvailable !== null) return appwriteAvailable;
  try {
    const { databases } = await import("@/lib/appwrite");
    // Try a lightweight operation to test connectivity
    await databases.listDocuments("acs_db", "events", []);
    appwriteAvailable = true;
  } catch {
    appwriteAvailable = false;
    console.warn("[Appwrite ACS] Appwrite is not reachable. Using graceful fallback.");
  }
  return appwriteAvailable;
}

// Reset check on each toggle so reconnection is re-tested
export function resetAppwriteCheck() {
  appwriteAvailable = null;
}

export const acs: ACSAdapter = {
  async sendEvent(event) {
    const ok = await checkAppwrite();
    if (!ok) {
      console.warn("[Appwrite ACS] sendEvent skipped — Appwrite not reachable.");
      return;
    }
    const { databases, ID } = await import("@/lib/appwrite");
    await databases.createDocument("acs_db", "events", ID.unique(), {
      source: event.source,
      type: event.type,
      payload: JSON.stringify(event.payload ?? {}),
      created_at: new Date().toISOString(),
    });
  },

  async fetchEvents(filters) {
    const ok = await checkAppwrite();
    if (!ok) {
      return { data: [], count: 0 };
    }
    try {
      const { databases } = await import("@/lib/appwrite");
      const { Query } = await import("appwrite");
      const queries: string[] = [Query.orderDesc("created_at")];

      if (filters?.source) queries.push(Query.equal("source", filters.source));
      if (filters?.limit) queries.push(Query.limit(filters.limit));
      if (filters?.offset) queries.push(Query.offset(filters.offset));

      const res = await databases.listDocuments("acs_db", "events", queries);
      const data: ACSEvent[] = res.documents.map((doc: any) => ({
        id: doc.$id,
        source: doc.source,
        type: doc.type,
        payload: typeof doc.payload === "string" ? JSON.parse(doc.payload) : doc.payload,
        created_at: doc.created_at ?? doc.$createdAt,
        user_id: doc.user_id ?? null,
      }));
      return { data, count: res.total };
    } catch (err) {
      console.warn("[Appwrite ACS] fetchEvents failed:", err);
      return { data: [], count: 0 };
    }
  },

  async fetchSyncLogs(source) {
    const ok = await checkAppwrite();
    if (!ok) return [];
    try {
      const { databases } = await import("@/lib/appwrite");
      const { Query } = await import("appwrite");
      const queries: string[] = [Query.orderDesc("created_at"), Query.limit(20)];
      if (source) queries.push(Query.equal("source", source));

      const res = await databases.listDocuments("acs_db", "sync_logs", queries);
      return res.documents.map((doc: any) => ({
        id: doc.$id,
        source: doc.source,
        status: doc.status,
        started_at: doc.started_at ?? doc.$createdAt,
        completed_at: doc.completed_at ?? null,
        records_synced: doc.records_synced ?? null,
        error_message: doc.error_message ?? null,
        created_at: doc.$createdAt,
        user_id: doc.user_id ?? null,
      })) as ACSSyncLog[];
    } catch (err) {
      console.warn("[Appwrite ACS] fetchSyncLogs failed:", err);
      return [];
    }
  },

  async triggerSync(source) {
    const ok = await checkAppwrite();
    if (!ok) {
      // Return a mock sync log so UI doesn't break
      const mockLog: ACSSyncLog = {
        id: `mock-${Date.now()}`,
        source,
        status: "completed",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        records_synced: 0,
        error_message: "Appwrite not reachable — mock sync",
        created_at: new Date().toISOString(),
        user_id: null,
      };
      return mockLog;
    }
    const { databases, ID } = await import("@/lib/appwrite");
    const doc = await databases.createDocument("acs_db", "sync_logs", ID.unique(), {
      source,
      status: "syncing",
      started_at: new Date().toISOString(),
    });
    return {
      id: doc.$id,
      source: doc.source,
      status: doc.status,
      started_at: doc.started_at,
      completed_at: null,
      records_synced: null,
      error_message: null,
      created_at: doc.$createdAt,
      user_id: null,
    } as ACSSyncLog;
  },

  subscribeEvents(callback) {
    try {
      const client = require("@/lib/appwrite").default;
      const unsub = client.subscribe(
        "databases.acs_db.collections.events.documents",
        (response: any) => {
          if (response.events?.some((e: string) => e.includes(".create"))) {
            const doc = response.payload;
            callback({
              id: doc.$id,
              source: doc.source,
              type: doc.type,
              payload: typeof doc.payload === "string" ? JSON.parse(doc.payload) : doc.payload,
              created_at: doc.created_at ?? doc.$createdAt,
              user_id: doc.user_id ?? null,
            });
          }
        }
      );
      return () => unsub();
    } catch {
      console.warn("[Appwrite ACS] Realtime subscription not available.");
      return () => {};
    }
  },

  // Phase 1 & 2 stubs — Appwrite adapter not yet implemented for data lake
  async fetchRawData() { return { data: [], count: 0 }; },
  async fetchProcessingLogs() { return []; },
  async fetchIntelligence() { return { data: [], count: 0 }; },
  async fetchTransformationAudit() { return []; },
  subscribeIntelligence() { return () => {}; },
};
