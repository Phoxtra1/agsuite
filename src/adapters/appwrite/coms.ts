// src/adapters/appwrite/coms.ts
import type { CommsMessage, CommsResponse } from "@/core/coms/types";

export async function sendMessage(message: CommsMessage): Promise<CommsResponse> {
  // Appwrite SDK logic placeholder
  return { success: true, message: "Sent via Appwrite", data: message };
}

export async function receiveMessages(): Promise<CommsResponse> {
  return { success: true, data: [] };
}
