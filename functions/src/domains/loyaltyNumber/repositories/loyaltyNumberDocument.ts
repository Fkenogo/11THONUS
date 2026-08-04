/**
 * `loyaltyNumbers` collection Firestore document converter (ENG-P2-001-05).
 *
 * Document ID is the canonical Loyalty Number value itself (`ABC234`),
 * not a generated ID — this is what makes global uniqueness enforceable
 * inside a single Firestore transaction (`transaction.get()` on this
 * exact path before any `transaction.set()`), mirroring the existing
 * `checkAndReserveIdempotencyKey` doc-ID-as-key pattern. `loyaltyNumber`
 * is also stored as a regular field for query/read convenience, but the
 * document ID is authoritative for uniqueness.
 *
 * One document per issued Loyalty Number, ever. No recycling: closing or
 * archiving a Customer Identity never deletes or reassigns this record.
 */

import type { Timestamp } from "firebase-admin/firestore";
import type { BaseMetadata } from "../../../shared/metadata/baseMetadata";
import { stampCreate } from "../../../shared/metadata/baseMetadata";
import { malformedLoyaltyNumberRecordError } from "../models/loyaltyNumberErrors";
import type { LoyaltyNumberAssignment } from "../services/loyaltyNumberIssuanceService";

export type LoyaltyNumberDocument = BaseMetadata & {
  loyaltyNumber: string;
  customerIdentityId: string;
  issuedAt: Timestamp;
};

function toTimestampLike(value: Date): Timestamp {
  return value as unknown as Timestamp;
}

function fromTimestampLike(value: unknown): Date {
  const candidate = value as { toDate?: () => Date };
  return typeof candidate?.toDate === "function" ? candidate.toDate() : (value as Date);
}

export function toLoyaltyNumberDocument(
  assignment: LoyaltyNumberAssignment,
  actorId: string | null,
): Omit<LoyaltyNumberDocument, "schemaVersion"> {
  const stamp = stampCreate(actorId);
  return {
    id: assignment.loyaltyNumber,
    status: "active",
    loyaltyNumber: assignment.loyaltyNumber,
    customerIdentityId: assignment.customerIdentityId,
    issuedAt: toTimestampLike(assignment.assignedAt),
    createdAt: stamp.createdAt as never,
    createdBy: stamp.createdBy,
    updatedAt: stamp.updatedAt as never,
    updatedBy: stamp.updatedBy,
  };
}

export function fromLoyaltyNumberDocument(raw: unknown): LoyaltyNumberAssignment {
  const data = raw as Partial<LoyaltyNumberDocument> & { id?: unknown };
  const id = typeof data.id === "string" ? data.id : undefined;

  if (
    !id ||
    typeof data.customerIdentityId !== "string" ||
    typeof data.loyaltyNumber !== "string" ||
    !data.issuedAt
  ) {
    throw malformedLoyaltyNumberRecordError(id ?? "unknown");
  }

  return {
    customerIdentityId: data.customerIdentityId,
    loyaltyNumber: data.loyaltyNumber,
    assignedAt: fromTimestampLike(data.issuedAt),
  };
}
