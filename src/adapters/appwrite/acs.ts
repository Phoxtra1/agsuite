// src/adapters/appwrite/acs.ts
// DEACTIVATED: Appwrite adapter kept for future reconnection.
// All methods throw a descriptive error when called while Appwrite is inactive.

import type { ACSAdapter, ACSEvent, ACSSyncLog } from "@/core/backend/acs";

const INACTIVE_MSG = "Appwrite ACS adapter is deactivated. Switch backend to 'lovable' or reactivate Appwrite.";

export const acs: ACSAdapter = {
  async sendEvent() {
    console.warn(INACTIVE_MSG);
    throw new Error(INACTIVE_MSG);
  },

  async fetchEvents() {
    console.warn(INACTIVE_MSG);
    return { data: [], count: 0 };
  },

  async fetchSyncLogs() {
    console.warn(INACTIVE_MSG);
    return [];
  },

  async triggerSync(source: string): Promise<ACSSyncLog> {
    console.warn(INACTIVE_MSG);
    throw new Error(INACTIVE_MSG);
  },

  subscribeEvents() {
    console.warn(INACTIVE_MSG);
    return () => {};
  },
};
