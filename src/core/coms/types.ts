// src/core/coms/types.ts
// Common types for all coms adapters

export interface CommsMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
}

export interface CommsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Aliases for backward compat
export type ComsMessage = CommsMessage;
export type ComsResponse = CommsResponse;
