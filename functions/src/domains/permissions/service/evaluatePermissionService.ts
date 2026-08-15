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
  const userId = request.userId?.trim();
  const businessId = request.businessId?.trim();

  let business: BusinessReadResult = { kind: "not_found" };
  let membership: MembershipReadResult = { kind: "not_found" };

  if (businessId) {
    if (userId) {
      [business, membership] = await Promise.all([
        getBusinessById(db, businessId),
        getBusinessMembershipByUserAndBusiness(db, userId, businessId),
      ]);
    } else {
      business = await getBusinessById(db, businessId);
    }
  }

  return evaluateAuthorizationDecision({ request, business, membership });
}
