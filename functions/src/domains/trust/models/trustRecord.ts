/**
 * Trust record (CAP-P2-ITM-A).
 *
 * The minimum trust-record shape reconstructed directly from
 * `ITM-DESIGN-001` §5 — the fields Capability-2 ITM closure genuinely
 * requires (§14), and nothing else. This module is a pure value-object
 * factory: it validates and constructs an immutable `TrustRecord`; it
 * does not mutate one. Applying an update (new evidence, a recomputed
 * `trustLevel`, a status change) is expressed by future ITM-B/ITM-C code
 * calling `createTrustRecord` again with a new set of params — no
 * transition/mutation function is defined here, matching ITM-A's
 * "domain contracts only" boundary (no event consumer, no persistence,
 * no progression/derivation logic).
 *
 * **Derived-state boundary (§6.6.1, §22 "Derivation Authority"):**
 * `trustLevel` is a read-optimization cache, never authoritative when
 * persisted. Evidence (`signalState`), the current rule version, and
 * current server time are authoritative; a future ITM-C read path must
 * recompute `trustLevel` rather than trust this field as-is between
 * reads. This module does not enforce that `trustLevel` is *consistent*
 * with `signalState` — doing so would be the band-derivation function
 * §15 explicitly reserves for ITM-C, not ITM-A.
 *
 * **Excluded by design** (§5's explicit exclusion list, machine-enforced
 * by this type's closed field set): no raw phone number, email address,
 * or device identifier; no credential/OTP/token material; no numeric
 * trust score; no demographic/protected attribute; no `disputeStatus`/
 * correction-history field; no operator-visibility field (`AD-ITM-4`).
 */

import type { TrustRecordId } from "./trustRecordId";
import { createTrustRecordId } from "./trustRecordId";
import type { VerificationState, CreateVerificationStateParams } from "./verificationState";
import { createVerificationState } from "./verificationState";
import type { SignalState, CreateSignalStateParams } from "./signalState";
import { createSignalState } from "./signalState";
import type { TrustLevel } from "./trustLevel";
import { createTrustLevel } from "./trustLevel";
import type { TrustRecordStatus } from "./trustRecordStatus";
import { createTrustRecordStatus } from "./trustRecordStatus";
import type {
  TrustReasonReference,
  CreateTrustReasonReferenceParams,
} from "./trustReasonReference";
import { createTrustReasonReference } from "./trustReasonReference";
import {
  duplicateTrustEvidenceError,
  invalidCustomerIdentityReferenceError,
  invalidTrustRecordTimestampError,
  invalidTrustRecordVersionError,
  trustRecordUpdatedBeforeCreatedError,
} from "./trustErrors";

export type TrustRecord = {
  readonly trustRecordId: TrustRecordId;
  /**
   * A reference to the owning Customer Identity — the Internal Customer
   * ID as a plain string key, never the identity domain's own value
   * object (mirrors `identityAudit`'s cross-domain reference convention:
   * one-directional, string-keyed, no import of `identity`'s module).
   */
  readonly customerIdentityId: string;
  readonly verificationState: VerificationState;
  readonly signalState: SignalState;
  readonly trustLevel: TrustLevel;
  /** Optimistic-concurrency token (§5) — a future ITM-B persistence concern to increment. */
  readonly version: number;
  readonly status: TrustRecordStatus;
  readonly reasonReferences: readonly TrustReasonReference[];
  readonly createdAt: Date;
  readonly createdBy: string | null;
  readonly updatedAt: Date;
  readonly updatedBy: string | null;
};

export type CreateTrustRecordParams = {
  trustRecordId: string;
  customerIdentityId: string;
  verificationState: CreateVerificationStateParams;
  signalState: CreateSignalStateParams;
  trustLevel: string;
  version: number;
  status: string;
  reasonReferences: CreateTrustReasonReferenceParams[];
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
};

function requireNonBlankCustomerIdentityId(value: string): string {
  if (value.trim().length === 0) {
    throw invalidCustomerIdentityReferenceError(value);
  }
  return value;
}

function requireValidVersion(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw invalidTrustRecordVersionError(value);
  }
  return value;
}

function requireValidTimestamp(value: Date, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw invalidTrustRecordTimestampError(field);
  }
  return value;
}

/**
 * Builds the validated evidence list, rejecting duplicate evidence for
 * the same `eventId` (§7.1's idempotent-by-`eventId` ingestion contract,
 * mirrored here as a construction-time invariant on the record's own
 * evidence identity — not a re-implementation of ITM-B's ingestion).
 */
function buildReasonReferences(params: CreateTrustReasonReferenceParams[]): TrustReasonReference[] {
  const seenEventIds = new Set<string>();
  const references: TrustReasonReference[] = [];

  for (const referenceParams of params) {
    const reference = createTrustReasonReference(referenceParams);
    if (seenEventIds.has(reference.eventId)) {
      throw duplicateTrustEvidenceError(reference.eventId);
    }
    seenEventIds.add(reference.eventId);
    references.push(reference);
  }

  return references;
}

export function createTrustRecord(params: CreateTrustRecordParams): TrustRecord {
  const trustRecordId = createTrustRecordId(params.trustRecordId);
  const customerIdentityId = requireNonBlankCustomerIdentityId(params.customerIdentityId);
  const verificationState = createVerificationState(params.verificationState);
  const signalState = createSignalState(params.signalState);
  const trustLevel = createTrustLevel(params.trustLevel);
  const version = requireValidVersion(params.version);
  const status = createTrustRecordStatus(params.status);
  const reasonReferences = buildReasonReferences(params.reasonReferences);
  const createdAt = requireValidTimestamp(params.createdAt, "createdAt");
  const updatedAt = requireValidTimestamp(params.updatedAt, "updatedAt");

  if (updatedAt.getTime() < createdAt.getTime()) {
    throw trustRecordUpdatedBeforeCreatedError();
  }

  return {
    trustRecordId,
    customerIdentityId,
    verificationState,
    signalState,
    trustLevel,
    version,
    status,
    reasonReferences,
    createdAt,
    createdBy: params.createdBy,
    updatedAt,
    updatedBy: params.updatedBy,
  };
}
