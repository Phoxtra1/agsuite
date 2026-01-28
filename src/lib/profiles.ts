import { ID, Query } from "appwrite";
import { account, databases } from "./appwrite";

const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID as string;
const PROFILES_ID = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID as string;

export type ProductKey = "hub" | "agstock" | "agis" | "ops" | "amniva" | "explore";

export type ProfileDoc = {
  $id: string;
  userId: string;
  onboardingComplete: boolean;
  primaryProduct: ProductKey | null;
  enabledProducts: ProductKey[];
};

export async function getCurrentUser() {
  return account.get(); // throws if not logged in
}

export async function getProfileByUserId(userId: string): Promise<ProfileDoc | null> {
  const res = await databases.listDocuments(DB_ID, PROFILES_ID, [
    Query.equal("userId", userId),
    Query.limit(1),
  ]);
  return (res.documents?.[0] as unknown as ProfileDoc) ?? null;
}

export async function ensureProfile(userId: string): Promise<ProfileDoc> {
  const existing = await getProfileByUserId(userId);
  if (existing) return existing;

  const created = await databases.createDocument(DB_ID, PROFILES_ID, ID.unique(), {
    userId,
    onboardingComplete: false,
    primaryProduct: null,
    enabledProducts: [],
  });

  return created as unknown as ProfileDoc;
}

export async function completeOnboarding(profileId: string, primary: ProductKey) {
  const enabled = primary === "explore" ? [] : [primary];

  const updated = await databases.updateDocument(DB_ID, PROFILES_ID, profileId, {
    onboardingComplete: true,
    primaryProduct: primary,
    enabledProducts: enabled,
  });

  return updated as unknown as ProfileDoc;
}
