// src/adapters/appwrite/users.ts
// PURPOSE: User profile adapter using Appwrite

import { account, users as appwriteUsers } from "@/lib/appwrite";

export const users = {
  async getCurrentUser() {
    try {
      return await account.get();
    } catch {
      return null;
    }
  },

  async updateProfile(data: Record<string, any>) {
    if (data.name) {
      await account.updateName(data.name);
    }
    if (data.password) {
      await account.updatePassword(data.password);
    }
  },

  async listUsers() {
    // ⚠️ Admin-only (Console usage)
    const result = await appwriteUsers.list();
    return result.users;
  },
};
