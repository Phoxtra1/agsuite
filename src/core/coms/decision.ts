// src/core/coms/decision.ts

import { OdenehoResponse } from "./odeneho";

export type CommsAction = "auto-reply" | "escalate";

export interface DecisionResult {
  action: CommsAction;
  reason: string;
}

export function decideAction(
  response: OdenehoResponse
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
