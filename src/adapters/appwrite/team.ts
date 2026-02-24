// src/adapters/appwrite/teams.ts
// PURPOSE: Team & membership management via Appwrite Teams API

import { teams as appwriteTeams } from "@/lib/appwrite";

export const teams = {
  async inviteMember(email: string, role: string) {
    await appwriteTeams.createMembership(
      import.meta.env.VITE_APPWRITE_TEAM_ID,
      email,
      [role],
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
