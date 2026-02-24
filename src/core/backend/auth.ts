// src/core/backend/auth.ts
import { AuthAdapter } from "./auth"; // your existing interface
import { LovableAuth } from "@/core/adapters/lovable/auth";
import { AppwriteAuth } from "@/core/adapters/appwrite/auth";
import BackendManager from "./BackendManager"; // <-- import here

export const Auth: AuthAdapter = BackendManager.getBackend() === "appwrite" ? AppwriteAuth : LovableAuth;
// src/core/backend/auth.ts
// PURPOSE: Backend-agnostic authentication contract.
// Appwrite and Lovable MUST implement this interface.

export interface AuthAdapter {
  login(email: string, password: string): Promise<any>
  logout(): Promise<void>
  getSession(): Promise<any | null>
  register?(email: string, password: string, name?: string): Promise<any>
}
