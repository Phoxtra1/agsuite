// src/adapters/appwrite/users.ts
import { account } from "@/lib/appwrite";
import type { UsersAdapter } from "@/core/backend/users";

export const users: UsersAdapter = {
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
};
