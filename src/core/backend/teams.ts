// src/core/backend/teams.ts
// PURPOSE: Team & member management across platforms.

export interface TeamsAdapter {
  inviteMember(email: string, role: string): Promise<void>
  removeMember(userId: string): Promise<void>
  listMembers(): Promise<any[]>
}
