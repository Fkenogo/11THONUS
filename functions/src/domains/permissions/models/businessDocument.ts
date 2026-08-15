/**
 * `businesses` collection Firestore document reader (`ENG-P2-004B`).
 *
 * Reads only the field the evaluator's business-state gate needs (§4.1.1):
 * `status` (TRD10 §10.6.3's full 8-value union). No other `BusinessDocument`
 * field (`businessCode`, `ownerUserId`, etc.) is read or modeled here —
 * 004B's evaluator has no use for them, and reading only what's needed
 * keeps this reader independent of any future non-status schema change.
 */

import type { EvaluationBusiness } from "../evaluator/types";

const BUSINESS_STATUSES = [
  "draft",
  "pending_verification",
  "trial",
  "active",
  "suspended",
  "expired",
  "closed",
  "archived",
] as const;

function isBusinessStatus(value: unknown): value is EvaluationBusiness["status"] {
  return typeof value === "string" && (BUSINESS_STATUSES as readonly string[]).includes(value);
}

/** Returns `null` (never throws) for a structurally invalid document — see `businessMembershipDocument.ts`'s header note for the same fail-closed rationale. */
export function fromBusinessDocument(id: string, raw: unknown): EvaluationBusiness | null {
  const data = raw as Partial<{ status: unknown }>;
  if (!isBusinessStatus(data.status)) return null;
  return { id, status: data.status };
}
