/**
 * Effective trust — Firestore orchestrator (CAP-P2-ITM-C).
 *
 * Performs the two authoritative-state reads (`ITM-DESIGN-001` §6.6.1's
 * "Derivation Authority": evidence + current time, never a persisted
 * `trustLevel`) and delegates to the pure decision function
 * (`../derivation/deriveEffectiveTrust.ts`). Always live — no cache, no
 * write of any kind: per §6.6.1/§15, the persisted `trustLevel` cache is
 * refreshed only opportunistically by ITM-B's own signal-driven write
 * path, never by this read path (task Phase N — "if ambiguous, do not
 * invent behavior"; here the design is explicit, so no cache write is
 * added). Mirrors `domains/permissions/service/evaluatePermissionService.ts`'s
 * repository/service-boundary pattern exactly — the one file in this
 * package permitted to import both a Firestore type and the pure
 * derivation function, and (per `../models/trustDomainBoundary.test.ts`'s
 * existing boundary rule) the only place in the trust domain outside
 * `services/` permitted to import `domains/identity` at all.
 *
 * A `deriveEffectiveTrust` "failed" outcome is thrown here as a
 * `TrustDomainError` (`./effectiveTrustErrors.ts`) — the pure function
 * itself never throws, returning a first-class result instead so every
 * fail-closed branch stays directly unit-testable (task Phase Q/R).
 */

import type { Firestore } from "firebase-admin/firestore";
import { getCustomerIdentityById } from "../../identity/repositories/customerIdentityRepository";
import { IdentityDomainError } from "../../identity/models/identityErrors";
import { getTrustRecordByCustomerIdentityId } from "../repositories/trustRecordRepository";
import { TrustDomainError } from "../models/trustErrors";
import { deriveEffectiveTrust } from "../derivation/deriveEffectiveTrust";
import {
  CURRENT_TRUST_RULE_VERSION,
  type CustomerIdentityReadResult,
  type EffectiveTrustResult,
  type TrustRecordReadResult,
} from "../derivation/types";
import { effectiveTrustDerivationFailedError } from "./effectiveTrustErrors";

async function readCustomerIdentity(
  db: Firestore,
  customerIdentityId: string,
): Promise<CustomerIdentityReadResult> {
  try {
    const identity = await getCustomerIdentityById(db, customerIdentityId);
    return { kind: "found", registeredAt: identity.createdAt };
  } catch (error) {
    if (error instanceof IdentityDomainError) {
      if (error.category === "RESOURCE_NOT_FOUND") {
        return { kind: "not_found" };
      }
      if (error.category === "VALIDATION_FAILED") {
        return { kind: "malformed" };
      }
    }
    return { kind: "transient_failure" };
  }
}

async function readTrustRecord(
  db: Firestore,
  customerIdentityId: string,
): Promise<TrustRecordReadResult> {
  try {
    const record = await getTrustRecordByCustomerIdentityId(db, customerIdentityId);
    if (!record) {
      return { kind: "not_found" };
    }
    // Doc-ID-keyed by `customerIdentityId` (`ITM-DESIGN-001` §12) — a
    // mismatch between the requested key and the record's own stored
    // reference is a data-integrity problem, not legitimate steady
    // state (task Phase H: "trust record / Customer Identity mismatch
    // fails closed").
    if (record.customerIdentityId !== customerIdentityId) {
      return { kind: "malformed" };
    }
    return {
      kind: "found",
      hasSuccessfulAuthentication: record.signalState.hasSuccessfulAuthentication,
    };
  } catch (error) {
    if (error instanceof TrustDomainError && error.category === "VALIDATION_FAILED") {
      return { kind: "malformed" };
    }
    return { kind: "transient_failure" };
  }
}

/**
 * Derives the current effective trust band for `customerIdentityId` from
 * authoritative evidence and current server time — never from a
 * persisted `trustLevel` (`ITM-DESIGN-001` §6.6.1). Read-only; never
 * mutates the trust record or the customer identity.
 */
export async function getEffectiveTrust(
  db: Firestore,
  customerIdentityId: string,
  now: Date = new Date(),
): Promise<EffectiveTrustResult> {
  const trimmedId = typeof customerIdentityId === "string" ? customerIdentityId.trim() : "";

  const [customerIdentity, trustRecord] = trimmedId
    ? await Promise.all([readCustomerIdentity(db, trimmedId), readTrustRecord(db, trimmedId)])
    : [
        { kind: "not_found" } as CustomerIdentityReadResult,
        { kind: "not_found" } as TrustRecordReadResult,
      ];

  const outcome = deriveEffectiveTrust({
    customerIdentityId,
    customerIdentity,
    trustRecord,
    now,
    ruleVersion: CURRENT_TRUST_RULE_VERSION,
  });

  if (outcome.kind === "failed") {
    throw effectiveTrustDerivationFailedError(outcome.reason, outcome.errorCategory);
  }

  return outcome.result;
}
