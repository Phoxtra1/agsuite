// src/core/coms/index.ts
// PURPOSE: Unified coms pipeline — intake → Odeneho AI → decision

import { normalizeComms, type RawCommsInput } from "./intake";
import { odenehoRespond, type OdenehoResponse } from "./odeneho";
import { decideAction, type DecisionResult } from "./decision";

export interface HandleCommsResult {
  normalized: ReturnType<typeof normalizeComms>;
  response: OdenehoResponse;
  decision: DecisionResult;
}

/**
 * Central handler: normalizes input, runs AI response, decides action.
 */
export function handleComms(input: RawCommsInput): HandleCommsResult {
  const normalized = normalizeComms(input);
  const response = odenehoRespond(normalized);
  const decision = decideAction(response);

  return { normalized, response, decision };
}

export type { RawCommsInput, OdenehoResponse, DecisionResult };
