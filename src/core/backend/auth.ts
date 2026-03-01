// src/core/backend/auth.ts
// PURPOSE: Backend-agnostic authentication contract.

export interface AuthAdapter {
  login(email: string, password: string): Promise<any>
  logout(): Promise<void>
  getSession(): Promise<any | null>
  register?(email: string, password: string, name?: string): Promise<any>
}
