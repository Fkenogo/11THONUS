/**
 * Effective trust derivation — pure decision function (CAP-P2-ITM-C).
 *
 * Implements `ITM-DESIGN-001` §6.6's exact band-membership conditions and
 * §6.6.4's precise elapsed-time semantics. Pure: never touches Firestore,
 * never imports `domains/identity`, never reads the wall clock —
 * `input.now` is supplied by the orchestrator (`../services/effectiveTrustService.ts`),
 * so calling this function twice with the same input always produces a
 * byte-identical result (task Phase Q scenario 24), mirroring
 * `domains/permissions/evaluator/evaluatePermission.ts`'s purity
 * discipline exactly.
 *
 * Algorithm (§6.6, "no other rule" per task Phase E):
 *
 *   IF hasSuccessfulAuthentication != true:  unverified
 *   ELSE IF accountAgeDays >= 30:            established
 *   ELSE:                                    provisional
 *
 * `accountAgeDays = floor((now - registeredAt) / 86400 seconds)` (§6.6.4)
 * — elapsed 24-hour periods, not calendar-month arithmetic.
 *
 * The persisted `trustLevel` field (`ITM-A`'s `TrustRecord`) is never
 * read here — `TrustRecordReadResult` (`./types.ts`) does not even carry
 * it, which is what makes "a stale cached value can never override the
 * effective result" (§6.6.1, `ITM-DESIGN-001` §22 "Derivation Authority")
 * structurally true rather than a convention this function could forget.
 * The same is true of recovery evidence (`AD-ITM-2`): `TrustRecordReadResult`
 * carries only `hasSuccessfulAuthentication`, so no recovery-only signal
 * can reach this function as a positive or negative input at all.
 */

import { createTrustRuleVersion } from "../models/trustRuleVersion";
import { TrustDomainError } from "../models/trustErrors";
import {
  CURRENT_TRUST_RULE_VERSION,
  type EffectiveTrustDerivationInput,
  type EffectiveTrustDerivationResult,
} from "./types";

const DAY_IN_MS = 86_400_000;

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function deriveEffectiveTrust(
  input: EffectiveTrustDerivationInput,
): EffectiveTrustDerivationResult {
  if (input.customerIdentityId.trim().length === 0) {
    return {
      kind: "failed",
      reason: "invalid_customer_identity_id",
      errorCategory: "VALIDATION_FAILED",
    };
  }

  try {
    createTrustRuleVersion(input.ruleVersion);
  } catch (error) {
    if (error instanceof TrustDomainError) {
      return {
        kind: "failed",
        reason: "malformed_rule_version",
        errorCategory: "VALIDATION_FAILED",
      };
    }
    throw error;
  }

  if (input.ruleVersion !== CURRENT_TRUST_RULE_VERSION) {
    return {
      kind: "failed",
      reason: "unsupported_rule_version",
      errorCategory: "VALIDATION_FAILED",
    };
  }

  if (!isValidDate(input.now)) {
    return { kind: "failed", reason: "invalid_current_time", errorCategory: "VALIDATION_FAILED" };
  }

  switch (input.customerIdentity.kind) {
    case "not_found":
      return {
        kind: "failed",
        reason: "customer_identity_not_found",
        errorCategory: "RESOURCE_NOT_FOUND",
      };
    case "malformed":
      return {
        kind: "failed",
        reason: "customer_identity_malformed",
        errorCategory: "VALIDATION_FAILED",
      };
    case "transient_failure":
      return {
        kind: "failed",
        reason: "customer_identity_read_failed",
        errorCategory: "TEMPORARY_UNAVAILABLE",
      };
    case "found":
      break;
  }

  switch (input.trustRecord.kind) {
    case "malformed":
      return {
        kind: "failed",
        reason: "trust_record_malformed",
        errorCategory: "VALIDATION_FAILED",
      };
    case "transient_failure":
      return {
        kind: "failed",
        reason: "trust_record_read_failed",
        errorCategory: "TEMPORARY_UNAVAILABLE",
      };
    case "found":
    case "not_found":
      break;
  }

  const { registeredAt } = input.customerIdentity;
  if (!isValidDate(registeredAt)) {
    return { kind: "failed", reason: "registered_at_invalid", errorCategory: "VALIDATION_FAILED" };
  }
  if (registeredAt.getTime() > input.now.getTime()) {
    return {
      kind: "failed",
      reason: "registered_at_in_future",
      errorCategory: "VALIDATION_FAILED",
    };
  }

  const accountAgeDays = Math.floor((input.now.getTime() - registeredAt.getTime()) / DAY_IN_MS);
  const hasSuccessfulAuthentication =
    input.trustRecord.kind === "found" ? input.trustRecord.hasSuccessfulAuthentication : false;

  const effectiveTrustLevel = !hasSuccessfulAuthentication
    ? "unverified"
    : accountAgeDays >= 30
      ? "established"
      : "provisional";

  return {
    kind: "derived",
    result: {
      customerIdentityId: input.customerIdentityId,
      effectiveTrustLevel,
      ruleVersion: input.ruleVersion,
      evaluatedAt: input.now,
      basis: { hasSuccessfulAuthentication, accountAgeDays },
    },
  };
}
