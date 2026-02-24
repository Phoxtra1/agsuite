// src/core/coms/intake.ts

export type CommsChannel = "email" | "ticket" | "chat" | "call";

export interface RawCommsInput {
  channel: CommsChannel;
  from: string;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedComms {
  channel: CommsChannel;
  sender: string;
  content: string;
  context?: string;
}

export function normalizeComms(input: RawCommsInput): NormalizedComms {
  return {
    channel: input.channel,
    sender: input.from.toLowerCase().trim(),
    content: input.message.trim(),
    context: input.subject,
  };
}
