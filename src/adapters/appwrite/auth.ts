// src/adapters/appwrite/auth.ts
// PURPOSE: Appwrite authentication adapter for Amineva Suite

import { account } from "@/lib/appwrite"; // ← use your existing Appwrite account instance

export const auth = {
  async login(email: string, password: string) {
    return await account.createEmailSession(email, password);
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
    return await account.create(
      "unique()",
      email,
      password,
      name
    );
  },
};
