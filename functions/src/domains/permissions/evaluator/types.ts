/**
 * Permission evaluator contracts (`ENG-P2-004B`).
 *
 * `AuthorizationRequest`/`AuthorizationDecision` implement TRD12 §12.12's
 * contract, extended only with the `permissionSource` values
 * `ENG-P2-004-DESIGN-001` §4 requires (§6.2) — no field is removed or
 * renamed. `EvaluationInput` models the evaluator's authoritative-state
 * reads as an explicit result union rather than throwing, so every
 * fail-closed branch (missing/malformed/transient) is a first-class,
 * directly testable case (design §6.11, §11) instead of an exception path
 * that could accidentally be swallowed.
 */

import type { PermissionId } from "../models/permissionId";
import type { Role } from "../models/role";
import type { PermissionOverrideDirection } from "../models/permissionOverride";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

export type AuthorizationRequest = {
  readonly userId: string;
  readonly businessId: string;
  readonly permission: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
};

export type PermissionSource = "owner-floor" | "role-default" | "explicit-grant" | "n/a-denied";

/**
 * Internal, closed reason-code set (design §6.2, §6.11) — never itself
 * client-facing. `errorCategory` (design §11, the existing closed
 * 14-category taxonomy) is what a caller may expose; `reasonCode` is for
 * logs/audit only.
 */
export const REASON_CODES = [
  "NO_SUBJECT",
  "MISSING_BUSINESS_CONTEXT",
  "MALFORMED_BUSINESS_CONTEXT",
  "BUSINESS_NOT_FOUND",
  "BUSINESS_CONTEXT_MISMATCH",
  "BUSINESS_NOT_ACTIVE",
  "BUSINESS_CONFIG_MALFORMED",
  "BUSINESS_READ_FAILURE",
  "MEMBERSHIP_NOT_FOUND",
  "MEMBERSHIP_NOT_ACTIVE",
  "MEMBERSHIP_BUSINESS_MISMATCH",
  "MEMBERSHIP_CONFIG_MALFORMED",
  "MEMBERSHIP_READ_FAILURE",
  "MALFORMED_PERMISSION_ID",
  "EXPLICIT_REVOCATION",
  "EXPLICIT_GRANT",
  "OWNER_FLOOR",
  "SENSITIVE_PERMISSION_NOT_GRANTED",
  "ROLE_DEFAULT_ALLOW",
  "NO_APPLICABLE_GRANT",
  "MALFORMED_OVERRIDE_DIRECTION",
  "GRANT_NOT_HONORED",
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

export type AuthorizationDecision = {
  readonly allowed: boolean;
  readonly reasonCode: ReasonCode;
  /** Present only when `allowed` is false — the client-facing closed-taxonomy category (design §11). */
  readonly errorCategory?: ErrorCategory;
  readonly role?: Role;
  readonly permissionSource?: PermissionSource;
  readonly evaluatedAt: Date;
};

/** One explicit override as embedded in a resolved membership (design §4, §5.6). */
export type EvaluationPermissionOverride = {
  readonly permissionId: PermissionId;
  readonly direction: PermissionOverrideDirection;
  readonly businessId: string;
  readonly membershipId: string;
};

export type EvaluationBusinessMembership = {
  readonly id: string;
  readonly userId: string;
  readonly businessId: string;
  readonly role: Role;
  readonly status: "invited" | "active" | "suspended" | "removed";
  readonly overrides: readonly EvaluationPermissionOverride[];
};

export type EvaluationBusiness = {
  readonly id: string;
  readonly status:
    | "draft"
    | "pending_verification"
    | "trial"
    | "active"
    | "suspended"
    | "expired"
    | "closed"
    | "archived";
};

export type BusinessReadResult =
  | { readonly kind: "found"; readonly business: EvaluationBusiness }
  | { readonly kind: "not_found" }
  | { readonly kind: "malformed" }
  | { readonly kind: "transient_failure" };

export type MembershipReadResult =
  | { readonly kind: "found"; readonly membership: EvaluationBusinessMembership }
  | { readonly kind: "not_found" }
  | { readonly kind: "malformed" }
  | { readonly kind: "transient_failure" };

export type EvaluationInput = {
  readonly request: AuthorizationRequest;
  readonly business: BusinessReadResult;
  readonly membership: MembershipReadResult;
  /**
   * The evaluation instant, supplied by the caller rather than read
   * internally — genuine purity (design §6.18, §13 item 1: "identical
   * inputs always produce identical `AuthorizationDecision`") requires
   * `evaluatedAt` to be a function of the *input*, not a wall-clock read
   * inside the decision function itself (Codex review, PR #107). The
   * Firestore orchestrator (`service/evaluatePermissionService.ts`)
   * supplies `new Date()` at call time — that impurity is expected and
   * acceptable there; it is not acceptable inside the pure function.
   */
  readonly now: Date;
};
