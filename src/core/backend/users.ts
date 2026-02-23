// src/core/backend/users.ts
// PURPOSE: User profile operations shared across all backends.

export interface UsersAdapter {
  getCurrentUser(): Promise<any | null>
  updateProfile(data: Record<string, any>): Promise<void>
  listUsers?(): Promise<any[]>
}
