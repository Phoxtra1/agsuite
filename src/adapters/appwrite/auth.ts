// src/adapters/appwrite/auth.ts
import { account, ID } from "@/lib/appwrite";
import type { AuthAdapter } from "@/core/backend/auth";

export const auth: AuthAdapter = {
  async login(email: string, password: string) {
    return await account.createEmailPasswordSession(email, password);
  },

  async logout() {
    await account.deleteSession("current");
  },

  async getSession() {
    try {
      return await account.get();
    } catch {
      return null;
    }
  },

  async register(email: string, password: string, name?: string) {
    return await account.create(ID.unique(), email, password, name);
  },
};
