/**
 * Permission evaluator — Firestore orchestrator (`ENG-P2-004B`).
 *
 * Performs the two authoritative-state reads (§6.5, §6.15) and delegates
 * to the pure decision function (`evaluator/evaluatePermission.ts`).
 * Always live — no cross-request cache (§6.12, AD-2), no transaction
 * (§6.13 — read-only evaluation needs none), no write of any kind (§6.18
 * purity). This is the one function in `ENG-P2-004B` permitted to import
 * both a Firestore type and the pure evaluator, matching the same
 * repository/service-boundary pattern the Identity domain already uses
 * for its own `no-restricted-imports` exclusion.
 */

import type { Firestore } from "firebase-admin/firestore";
import { evaluateAuthorizationDecision } from "../evaluator/evaluatePermission";
import { getBusinessById } from "../repositories/businessRepository";
import { getBusinessMembershipByUserAndBusiness } from "../repositories/businessMembershipRepository";
import type {
  AuthorizationDecision,
  AuthorizationRequest,
  BusinessReadResult,
  MembershipReadResult,
} from "../evaluator/types";

export async function evaluatePermission(
  db: Firestore,
  request: AuthorizationRequest,
): Promise<AuthorizationDecision> {
  // `AuthorizationRequest`'s TypeScript type does not validate an
  // untrusted runtime payload — a caller that doesn't enforce it at the
  // network boundary could supply `request` itself as `null`/`undefined`
  // (a missing/malformed decoded payload), which would throw before any
  // field could even be read. Checked first so a malformed request
  // resolves to a fail-closed decision instead of throwing (Codex review
  // pass 5, PR #107).
  if (request === null || typeof request !== "object") {
    return {
      allowed: false,
      reasonCode: "NO_SUBJECT",
      errorCategory: "AUTH_REQUIRED",
      evaluatedAt: new Date(),
    };
  }

  // Likewise, `userId`/`businessId` could be a non-string (e.g. a
  // decoded JSON number), which `.trim()` cannot handle even with
  // optional chaining (that only guards null/undefined). Runtime-checked
  // here so a malformed request resolves to the pure evaluator's own
  // fail-closed decision instead of throwing (Codex review pass 3, PR #107).
  const userId = typeof request.userId === "string" ? request.userId.trim() : undefined;
  const businessId = typeof request.businessId === "string" ? request.businessId.trim() : undefined;

  // A "/" is a Firestore document-path separator — passing it to
  // `businessRepository.getBusinessById`'s `.doc(businessId)` would
  // either throw an SDK argument error (caught and mis-mapped to
  // `transient_failure`/`TEMPORARY_UNAVAILABLE`, inviting pointless
  // retries for input that can never succeed) or resolve to an
  // unintended nested document path. An empty-after-trim businessId is
  // equally never a valid document ID. Both are skipped here entirely;
  // the pure evaluator's own context-validation step independently
  // rejects the same malformed businessId as `VALIDATION_FAILED` (Codex
  // review pass 6/7, PR #107).
  const businessIdIsWellFormed =
    businessId !== undefined && businessId.length > 0 && !businessId.includes("/");

  let business: BusinessReadResult = { kind: "not_found" };
  let membership: MembershipReadResult = { kind: "not_found" };

  // Likewise, a blank userId can never resolve a membership, and the
  // pure evaluator's subject check (§6.9 step 1) denies unconditionally
  // before any business/membership state is even consulted — skip both
  // repository reads entirely rather than consuming a real Firestore
  // call for a request that cannot possibly succeed (Codex review pass
  // 7, PR #107).
  if (businessIdIsWellFormed && userId) {
    [business, membership] = await Promise.all([
      getBusinessById(db, businessId),
      getBusinessMembershipByUserAndBusiness(db, userId, businessId),
    ]);
  }

  // The pure evaluator must compare against the same normalized
  // (trimmed) identifiers the repositories were queried with — passing
  // the raw, possibly-padded `request` through would make a
  // successfully-resolved business/membership fail the evaluator's own
  // identity cross-checks (`business.id !== request.businessId`,
  // `resolvedMembership.userId !== request.userId`) with a spurious
  // mismatch denial (Codex review pass 5, PR #107).
  const normalizedRequest: AuthorizationRequest = {
    ...request,
    userId: userId ?? request.userId,
    businessId: businessId ?? request.businessId,
  };

  return evaluateAuthorizationDecision({
    request: normalizedRequest,
    business,
    membership,
    now: new Date(),
  });
}
