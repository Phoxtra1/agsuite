// src/core/backend/index.ts
// PURPOSE: Runtime backend selector (Appwrite ↔ Lovable)

import type { AuthAdapter } from "./auth"
import type { UsersAdapter } from "./users"
import type { TeamsAdapter } from "./teams"
import type { ACSAdapter, ACSEvent, ACSSyncLog } from "./acs"

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

// Backend selector
const provider = import.meta.env.VITE_BACKEND_PROVIDER ?? "lovable"
const isLovable = provider === "lovable"

// Unified exports (Suite-wide)
export const auth: AuthAdapter = isLovable ? lovableAuth : appwriteAuth
export const users: UsersAdapter = isLovable ? lovableUsers : appwriteUsers
export const teams: TeamsAdapter = isLovable ? lovableTeams : appwriteTeams
export const acs: ACSAdapter = isLovable ? lovableACS : appwriteACS
