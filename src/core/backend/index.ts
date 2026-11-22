// src/core/backend/index.ts
// PURPOSE: Unified Native Appwrite Backend Exports

import type { AuthAdapter } from "./auth";
import type { UsersAdapter } from "./users";
import type { TeamsAdapter } from "./teams";

// Appwrite native adapters
import { auth as appwriteAuth } from "@/adapters/appwrite/auth";
import { users as appwriteUsers } from "@/adapters/appwrite/users";
import { teams as appwriteTeams } from "@/adapters/appwrite/teams";

export function getAuth(): AuthAdapter {
  return appwriteAuth;
}

export function getUsers(): UsersAdapter {
  return appwriteUsers;
}

export function getTeams(): TeamsAdapter {
  return appwriteTeams;
}

export const auth: AuthAdapter = appwriteAuth;
export const users: UsersAdapter = appwriteUsers;
export const teams: TeamsAdapter = appwriteTeams;
