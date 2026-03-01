// src/adapters/appwrite/acs.ts
import { databases, ID } from "@/lib/appwrite";
import type { ACSAdapter } from "@/core/backend/acs";

const DATABASE_ID = import.meta.env.VITE_ACS_DATABASE_ID ?? "agsuite-db2";
const COLLECTION_ID = import.meta.env.VITE_ACS_COLLECTION_ID ?? "acs_events";

export const acs: ACSAdapter = {
  async sendEvent(event) {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        source: event.source,
        type: event.type,
        payload: event.payload ?? {},
        created_at: event.timestamp ?? Date.now(),
      }
    );
  },
};
