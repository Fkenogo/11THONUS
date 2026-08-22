/**
 * Unwraps the `authorizeAndExecute` boundary's `{outcome, decision?, result?}`
 * contract (`ENG-P2-004`) that every Ordinary/Sensitive-permission-gated
 * Business/Staff mutation callable returns unchanged. A denied/duplicate/
 * in-progress outcome is a normal response from the transport, not a thrown
 * error — this module is where the frontend translates that contract into
 * either a value or a `BusinessApiError` the UI layer already knows how to
 * map to a message (design §23).
 */

import { BusinessApiError } from "./businessCallableClient";

export type MutationOutcome<TResult> =
  | { outcome: "executed"; decision: unknown; result: TResult }
  | { outcome: "denied"; decision: unknown }
  | { outcome: "duplicate" }
  | { outcome: "in_progress" };

/**
 * `executed` → the result. `denied` → a forbidden error (never expose the
 * raw permission id, Phase X). `duplicate` → `undefined` — the same request
 * already applied under this idempotency key (Phase R); callers should treat
 * this as success and re-fetch, not as a failure. `in_progress` → a
 * retryable conflict — a concurrent call with the same key hasn't resolved
 * yet.
 */
export function unwrapMutationResult<TResult>(
  outcome: MutationOutcome<TResult>,
): TResult | undefined {
  switch (outcome.outcome) {
    case "executed":
      return outcome.result;
    case "duplicate":
      return undefined;
    case "denied":
      throw new BusinessApiError("auth_forbidden");
    case "in_progress":
      throw new BusinessApiError("conflict");
  }
}
