/**
 * Provider-neutral recovery-proof contract (ENG-P2-001-07).
 *
 * Represents an ALREADY-COMPLETED recovery proof handed to this package
 * by an upstream, out-of-scope process (SMS OTP, email verification, a
 * previously-linked provider, or support/administrator-assisted
 * verification — TRD12 §12.30). This module never implements or performs
 * that proof itself; it only validates the shape and result of a
 * completed one. `business_owner_recovery` (TRD12 §12.32, Business
 * Ownership Recovery) is a deliberately separate concern with stronger
 * evidence requirements and is not a member of this closed set.
 *
 * `proofReference` is an opaque identifier only — never a credential,
 * OTP value, password, token, or raw identity-document reference; those
 * remain entirely outside this package per this task's own constraint.
 */

import type { TransitionAuthority } from "./transitionAuthority";
import {
  recoveryProofExpiredError,
  recoveryProofIdentityMismatchError,
  recoveryProofMissingError,
  recoveryProofRejectedError,
  invalidRecoveryProofMethodCategoryError,
} from "./identityErrors";

export const RECOVERY_PROOF_METHOD_CATEGORIES = [
  "phone_otp",
  "email_verification",
  "linked_provider",
  "support_assisted",
  "administrator_assisted",
] as const;

export type RecoveryProofMethodCategory = (typeof RECOVERY_PROOF_METHOD_CATEGORIES)[number];

export function createRecoveryProofMethodCategory(raw: string): RecoveryProofMethodCategory {
  if ((RECOVERY_PROOF_METHOD_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as RecoveryProofMethodCategory;
  }
  throw invalidRecoveryProofMethodCategoryError(raw);
}

export type RecoveryProofResult = "accepted" | "rejected";

export type RecoveryProof = {
  result: RecoveryProofResult;
  methodCategory: RecoveryProofMethodCategory;
  proofReference: string;
  authority: TransitionAuthority;
  completedAt: Date;
  targetCustomerIdentityId: string;
  expiresAt?: Date;
};

export function validateRecoveryProof(
  proof: RecoveryProof | undefined,
  expectedCustomerIdentityId: string,
  now: Date,
): asserts proof is RecoveryProof {
  if (!proof || proof.proofReference.trim() === "") {
    throw recoveryProofMissingError();
  }
  if (proof.result !== "accepted") {
    throw recoveryProofRejectedError(proof.proofReference);
  }
  if (proof.targetCustomerIdentityId !== expectedCustomerIdentityId) {
    throw recoveryProofIdentityMismatchError(
      proof.proofReference,
      expectedCustomerIdentityId,
      proof.targetCustomerIdentityId,
    );
  }
  if (proof.expiresAt && now.getTime() > proof.expiresAt.getTime()) {
    throw recoveryProofExpiredError(proof.proofReference);
  }
}
