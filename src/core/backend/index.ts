// src/core/backend/index.ts
// PURPOSE: Runtime backend selector (Appwrite ↔ Lovable)

import type { AuthAdapter } from "./auth"
import type { UsersAdapter } from "./users"
import type { TeamsAdapter } from "./teams"
import type { ACSAdapter } from "./acs"

import { auth as appwriteAuth } from "@/adapters/appwrite/auth"
import { users as appwriteUsers } from "@/adapters/appwrite/users"
import { teams as appwriteTeams } from "@/adapters/appwrite/teams"
import { ecs as appwriteACS } from "@/adapters/appwrite/acs"

import { auth as lovableAuth } from "@/adapters/lovable/auth"
import { users as lovableUsers } from "@/adapters/lovable/users"
import { teams as lovableTeams } from "@/adapters/lovable/teams"
import { ecs as lovableACS } from "@/adapters/lovable/acs"

const provider = import.meta.env.VITE_BACKEND_PROVIDER

export const auth: AuthAdapter =
  provider === "lovable" ? lovableAuth : appwriteAuth

export const users: UsersAdapter =
  provider === "lovable" ? lovableUsers : appwriteUsers

export const teams: TeamsAdapter =
  provider === "lovable" ? lovableTeams : appwriteTeams

export const ecs: ACSAdapter =
  provider === "lovable" ? lovableACS : appwriteACS
