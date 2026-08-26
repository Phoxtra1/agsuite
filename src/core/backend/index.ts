// src/core/backend/index.ts
// PURPOSE: Unified Native Appwrite Backend Exports

import type { AuthAdapter } from "./auth";
import type { UsersAdapter } from "./users";
import type { TeamsAdapter } from "./teams";
import type { ACSAdapter } from "./acs";

// Appwrite native adapters
import { auth as appwriteAuth } from "@/adapters/appwrite/auth";
import { users as appwriteUsers } from "@/adapters/appwrite/users";
import { teams as appwriteTeams } from "@/adapters/appwrite/teams";
import { acs as appwriteACS } from "@/adapters/appwrite/acs";

export function getAuth(): AuthAdapter {
  return appwriteAuth;
}

export function getUsers(): UsersAdapter {
  return appwriteUsers;
}

export function getTeams(): TeamsAdapter {
  return appwriteTeams;
}

export function getACS(): ACSAdapter {
  return appwriteACS;
}

export const auth: AuthAdapter = appwriteAuth;
export const users: UsersAdapter = appwriteUsers;
export const teams: TeamsAdapter = appwriteTeams;
export const acs: ACSAdapter = appwriteACS;
