// src/adapters/appwrite/teams.ts
import { appwriteTeams } from "@/lib/appwrite";
import type { TeamsAdapter } from "@/core/backend/teams";

export const teams: TeamsAdapter = {
  async inviteMember(email: string, role: string) {
    await appwriteTeams.createMembership(
      import.meta.env.VITE_APPWRITE_TEAM_ID,
      [role],
      email,
      undefined,
      undefined,
      `${window.location.origin}/invite`
    );
  },

  async removeMember(userId: string) {
    await appwriteTeams.deleteMembership(
      import.meta.env.VITE_APPWRITE_TEAM_ID,
      userId
    );
  },

  async listMembers() {
    const res = await appwriteTeams.listMemberships(
      import.meta.env.VITE_APPWRITE_TEAM_ID
    );
    return res.memberships;
  },
};
