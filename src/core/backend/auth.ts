// src/core/backend/auth.ts
// PURPOSE: Backend-agnostic authentication contract.
// Appwrite and Lovable MUST implement this interface.

export interface AuthAdapter {
  login(email: string, password: string): Promise<any>
  logout(): Promise<void>
  getSession(): Promise<any | null>
  register?(email: string, password: string, name?: string): Promise<any>
}
