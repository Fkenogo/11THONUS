/**
 * Knowledge Studio platform-permission evaluator (`ENG-P3-003A`).
 *
 * A pure, framework-independent decision function — the platform-scoped
 * counterpart to the Business domain's `evaluatePermission.ts`, built in the
 * same shape (ordered, independent checks; fail-closed default-deny;
 * `AuthorizationDecision`-equivalent return type) but for a structurally
 * different actor: a Knowledge Studio administrator has no `businessId` in
 * scope at all (`ENG-P3-001-DESIGN-001` §13.2). This module never imports
 * `domains/business` or `domains/permissions`'s Business-role evaluator, and
 * neither of those imports this — the two authorization worlds stay
 * disjoint by construction (`ENG-P3-003-DESIGN-001` §6.4).
 *
 * **MFA (`DEC-SEC-002`).** This evaluator takes `verifiedMfaSatisfied` as an
 * explicit, caller-supplied input — it never inspects `mfaRequired` on the
 * administrator record as if that field were proof of compliance. The field
 * only ever records the *requirement* (always `true` for MVP,
 * `platformAdministrator.ts`); *compliance* must come from a genuinely
 * verified second-factor signal the token-verification layer derives, never
 * from persisted state alone (Founder instruction: "do not simulate MFA
 * compliance with a database boolean alone"). As of `ENG-P3-003A`,
 * `functions/src/domains/authentication`'s Firebase Admin token-verification
 * adapter (`firebaseTokenVerifier.ts`) does not surface Firebase's
 * `decoded.firebase.sign_in_second_factor` claim, and this codebase has no
 * MFA-enrollment flow anywhere — so no real caller can currently produce
 * `verifiedMfaSatisfied: true` through any genuine verified pathway. Every
 * call today must pass `false` (or omit it), and this evaluator denies every
 * request via `MFA_NOT_ESTABLISHED` as a result — by design, not by defect.
 * See the `ENG-P3-003A` implementation report for the full dependency this
 * creates on a future Authentication-domain extension.
 */

import type { PlatformAdministratorRole } from "../models/platformAdministratorRole";
import type { PlatformAdministratorStatus } from "../models/platformAdministratorStatus";
import type { KnowledgePermissionId } from "../models/knowledgePermissionId";
import { roleGrantsKnowledgePermission } from "../models/knowledgePermissionCatalogue";

/**
 * The minimum administrator state the evaluator needs — never the full
 * `PlatformAdministrator` document (narrow input, same discipline
 * `evaluatePermission.ts` applies to its own `EvaluationBusinessMembership`
 * input type).
 */
export type PlatformAdministratorSnapshot = {
  readonly status: PlatformAdministratorStatus;
  readonly roles: readonly PlatformAdministratorRole[];
};

export type EvaluateKnowledgePlatformPermissionInput = {
  /** `null` when no `platformAdministrators/{userId}` document exists at all. */
  readonly administrator: PlatformAdministratorSnapshot | null;
  readonly permission: KnowledgePermissionId;
  /** See module header — must come from genuinely verified second-factor evidence, never a persisted flag. */
  readonly verifiedMfaSatisfied: boolean;
};

export type KnowledgePlatformDenyReason =
  | "NO_ADMINISTRATOR_RECORD"
  | "ADMINISTRATOR_NOT_ACTIVE"
  | "MFA_NOT_ESTABLISHED"
  | "PERMISSION_NOT_GRANTED";

export type KnowledgePlatformAuthorizationDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: KnowledgePlatformDenyReason };

/**
 * Ordered, independent checks — the first failing check is the decision's
 * reason. Every branch is a distinct, closed reason code so a denial is
 * always attributable to exactly one cause (auditable, testable).
 */
export function evaluateKnowledgePlatformPermission(
  input: EvaluateKnowledgePlatformPermissionInput,
): KnowledgePlatformAuthorizationDecision {
  const { administrator, permission, verifiedMfaSatisfied } = input;

  if (administrator === null) {
    return { allowed: false, reason: "NO_ADMINISTRATOR_RECORD" };
  }

  if (administrator.status !== "active") {
    // Deliberately one reason for every non-active status (invited, suspended,
    // removed) — mirrors the enumeration-resistant posture other domains in
    // this codebase already apply (e.g. `staffReadNotAuthorizedError`): a
    // denial does not need to reveal *which* non-active state produced it.
    return { allowed: false, reason: "ADMINISTRATOR_NOT_ACTIVE" };
  }

  if (verifiedMfaSatisfied !== true) {
    return { allowed: false, reason: "MFA_NOT_ESTABLISHED" };
  }

  const granted = administrator.roles.some((role) =>
    roleGrantsKnowledgePermission(role, permission),
  );
  if (!granted) {
    return { allowed: false, reason: "PERMISSION_NOT_GRANTED" };
  }

  return { allowed: true };
}
