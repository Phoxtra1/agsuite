/**
 * App Access — centralized authorization check via Appwrite.
 *
 * Authentication verifies WHO the user is.
 * This module verifies WHICH modules/apps they may enter.
 */
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DB_ID = (import.meta as any).env?.VITE_DB_ID || "agsuite-db2";
const MODULE_ACCESS_COLLECTION_ID = "module_access";

export interface AppAccess {
  allowed: boolean;
  appId?: string;
  appSlug: string;
  role?: string;
  permissions?: Record<string, unknown>;
}

export async function loadAppAccess(userId: string, appSlug: string): Promise<AppAccess> {
  try {
    const res = await databases.listDocuments(DB_ID, MODULE_ACCESS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.equal("moduleId", appSlug),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) {
      const doc = res.documents[0];
      return {
        allowed: doc.granted ?? true,
        appSlug,
        appId: doc.moduleId as string,
        role: "user",
        permissions: {},
      };
    }

    // Default allow for Suite users
    return {
      allowed: true,
      appSlug,
      role: "user",
      permissions: {},
    };
  } catch (error) {
    console.error("[appAccess] Appwrite lookup failed:", error);
    return { allowed: true, appSlug };
  }
}
