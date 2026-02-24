// src/adapters/appwrite/acs.ts
// PURPOSE: Amineva Central Server (ACS) adapter using Appwrite

import { databases, ID } from "@/lib/appwrite";

const DATABASE_ID = import.meta.env.VITE_ACS_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_ACS_COLLECTION_ID;

export const acs = {
  async log(data: {
    app: string;
    action: string;
    payload?: Record<string, any>;
    createdAt?: number;
  }) {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        app: data.app,
        action: data.action,
        payload: data.payload ?? {},
        createdAt: data.createdAt ?? Date.now(),
      }
    );
  },
};
