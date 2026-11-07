/**
 * App Access — centralized authorization check via Appwrite.
 *
 * Authentication verifies WHO the user is.
 * This module verifies WHICH modules/apps they may enter.
 */
import { databases, APPWRITE_DB_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { supabase, activeBackendProvider } from "@/integrations/appwrite/client";

const DB_ID = APPWRITE_DB_ID;
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
    if (activeBackendProvider === "supabase") {
      const { data: rows, error } = await supabase
        .from(MODULE_ACCESS_COLLECTION_ID)
        .select("moduleId, granted")
        .eq("userId", userId)
        .eq("moduleId", appSlug)
        .limit(1);
      if (!error && rows && rows.length > 0) {
        const row = rows[0] as { moduleId?: string; granted?: boolean };
        return {
          allowed: row.granted ?? true,
          appSlug,
          appId: row.moduleId as string,
          role: "user",
          permissions: {},
        };
      }
    } else {
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
    }

    // Check user metadata / prefs registered_product for per-app isolation
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (user && user.id === userId) {
      const regProduct =
        user.user_metadata?.registered_product ||
        user.user_metadata?.registered_app ||
        user.app_metadata?.registered_product;

      if (regProduct && appSlug !== "suite" && regProduct !== appSlug) {
        return {
          allowed: false,
          appSlug,
          role: "user",
          permissions: {},
        };
      }
    }

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
