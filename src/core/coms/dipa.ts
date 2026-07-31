// src/core/coms/dipa.ts

import { NormalizedComms } from "./intake";

export interface DipaResponse {
  reply: string;
  confidence: number; // 0–1
}

export function DipaRespond(
  input: NormalizedComms
): DipaResponse {
  const text = input.content.toLowerCase();

  if (text.includes("price") || text.includes("pricing")) {
    return {
      reply:
        "Hello, I’m Dipa. Pricing information depends on the product you’re using. Please specify the application so I can assist you accurately.",
      confidence: 0.9,
    };
  }

  if (text.includes("error") || text.includes("issue")) {
    return {
      reply:
        "Hello, I’m Dipa. I understand you’re experiencing an issue. Please provide more details so I can assist or escalate appropriately.",
      confidence: 0.7,
    };
  }

  return {
    reply:
      "Hello, I’m Dipa. I’ve received your message and will assist shortly. If needed, this will be escalated to a system administrator.",
    confidence: 0.4,
  };
}
