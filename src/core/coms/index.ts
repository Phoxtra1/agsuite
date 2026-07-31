// src/core/coms/index.ts
// PURPOSE: Unified coms pipeline — intake → Dipa AI → decision

import { normalizeComms, type RawCommsInput } from "./intake";
import { DipaRespond, type DipaResponse } from "./dipa";
import { decideAction, type DecisionResult } from "./decision";

export interface HandleCommsResult {
  normalized: ReturnType<typeof normalizeComms>;
  response: DipaResponse;
  decision: DecisionResult;
}

/**
 * Central handler: normalizes input, runs AI response, decides action.
 */
export function handleComms(input: RawCommsInput): HandleCommsResult {
  const normalized = normalizeComms(input);
  const response = DipaRespond(normalized);
  const decision = decideAction(response);

  return { normalized, response, decision };
}

export type { RawCommsInput, DipaResponse, DecisionResult };
