// src/core/backend/index.ts
// PURPOSE: Runtime backend selector (Appwrite ↔ Lovable) — reactive to toggle changes

import type { AuthAdapter } from "./auth"
import type { UsersAdapter } from "./users"
import type { TeamsAdapter } from "./teams"
import type { ACSAdapter } from "./acs"
import BackendManager from "./BackendManager"

// Appwrite adapters
import { auth as appwriteAuth } from "@/adapters/appwrite/auth"
import { users as appwriteUsers } from "@/adapters/appwrite/users"
import { teams as appwriteTeams } from "@/adapters/appwrite/teams"
import { acs as appwriteACS } from "@/adapters/appwrite/acs"

// Lovable / Supabase adapters
import { auth as lovableAuth } from "@/adapters/lovable/auth"
import { users as lovableUsers } from "@/adapters/lovable/users"
import { teams as lovableTeams } from "@/adapters/lovable/teams"
import { acs as lovableACS } from "@/adapters/lovable/acs"

// Getter functions — always read current backend at call time
function pick<T>(lovable: T, appwrite: T): T {
  return BackendManager.isLovable() ? lovable : appwrite;
}

/** Get the current auth adapter (call at usage time, not import time) */
export function getAuth(): AuthAdapter {
  return pick(lovableAuth, appwriteAuth);
}

/** Get the current users adapter */
export function getUsers(): UsersAdapter {
  return pick(lovableUsers, appwriteUsers);
}

/** Get the current teams adapter */
export function getTeams(): TeamsAdapter {
  return pick(lovableTeams, appwriteTeams);
}

/** Get the current ACS adapter */
export function getACS(): ACSAdapter {
  return pick(lovableACS, appwriteACS);
}

// Legacy static exports for backward compatibility — these resolve at call time via proxy
export const auth: AuthAdapter = new Proxy({} as AuthAdapter, {
  get(_, prop) { return (getAuth() as any)[prop]; },
});

export const users: UsersAdapter = new Proxy({} as UsersAdapter, {
  get(_, prop) { return (getUsers() as any)[prop]; },
});

export const teams: TeamsAdapter = new Proxy({} as TeamsAdapter, {
  get(_, prop) { return (getTeams() as any)[prop]; },
});

export const acs: ACSAdapter = new Proxy({} as ACSAdapter, {
  get(_, prop) { return (getACS() as any)[prop]; },
});
