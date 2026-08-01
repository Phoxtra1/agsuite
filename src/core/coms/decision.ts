// src/core/coms/decision.ts

import { DipaResponse } from "./dipa";

export type CommsAction = "auto-reply" | "escalate";

export interface DecisionResult {
  action: CommsAction;
  reason: string;
}

export function decideAction(
  response: DipaResponse
): DecisionResult {
  if (response.confidence >= 0.75) {
    return {
      action: "auto-reply",
      reason: "High confidence AI response",
    };
  }

  return {
    action: "escalate",
    reason: "Low confidence or ambiguous request",
  };
}
