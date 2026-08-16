/**
 * `trustRecords` collection Firestore document converter (CAP-P2-ITM-B).
 *
 * Persists exactly the ITM-A domain model's own fields
 * (`../models/trustRecord.ts`) plus `BaseMetadata`'s `schemaVersion`.
 * Mirrors the identity domain's `userDocument.ts` converter convention:
 * this is the only file in the trust domain permitted to import both the
 * domain type and a Firestore type — `models/` itself never imports
 * Firestore (`trustDomainBoundary.test.ts`), and nothing here leaks a
 * Firestore-specific shape back into `models/`.
 *
 * Malformed persisted data fails closed by construction: `fromTrustRecordDocument`
 * delegates to ITM-A's own `createTrustRecord`, which throws a
 * `TrustDomainError` (`VALIDATION_FAILED`) for any field that doesn't pass
 * ITM-A's existing validation — this module invents no second validation
 * layer (Phase O: "malformed trust record fails closed").
 */

import type { Timestamp } from "firebase-admin/firestore";
import type { BaseMetadata } from "../../../shared/metadata/baseMetadata";
import type { CreateTrustRecordParams, TrustRecord } from "../models/trustRecord";
import { createTrustRecord } from "../models/trustRecord";

type TrustReasonReferenceDocument = {
  category: string;
  eventId: string;
  correlationId: string;
  occurredAt: Timestamp;
};

export type TrustRecordDocument = Omit<BaseMetadata, "status" | "id"> & {
  customerIdentityId: string;
  verificationState: { phoneVerified: boolean; emailVerified: boolean };
  signalState: { hasSuccessfulAuthentication: boolean };
  trustLevel: string;
  version: number;
  status: string;
  reasonReferences: TrustReasonReferenceDocument[];
};

function toTimestampLike(value: Date): Timestamp {
  return value as unknown as Timestamp;
}

function fromTimestampLike(value: unknown): Date {
  const candidate = value as { toDate?: () => Date };
  return typeof candidate?.toDate === "function" ? candidate.toDate() : (value as Date);
}

export function toTrustRecordDocument(
  record: TrustRecord,
): Omit<TrustRecordDocument, "schemaVersion"> {
  return {
    customerIdentityId: record.customerIdentityId,
    verificationState: { ...record.verificationState },
    signalState: { ...record.signalState },
    trustLevel: record.trustLevel,
    version: record.version,
    status: record.status,
    reasonReferences: record.reasonReferences.map((reference) => ({
      category: reference.category,
      eventId: reference.eventId,
      correlationId: reference.correlationId,
      occurredAt: toTimestampLike(reference.occurredAt),
    })),
    createdAt: toTimestampLike(record.createdAt),
    createdBy: record.createdBy,
    updatedAt: toTimestampLike(record.updatedAt),
    updatedBy: record.updatedBy,
  };
}

export function fromTrustRecordDocument(trustRecordId: string, raw: unknown): TrustRecord {
  const data = raw as Partial<TrustRecordDocument> | undefined;

  const params: CreateTrustRecordParams = {
    trustRecordId,
    customerIdentityId: String(data?.customerIdentityId ?? ""),
    verificationState: {
      phoneVerified: Boolean(data?.verificationState?.phoneVerified),
      emailVerified: Boolean(data?.verificationState?.emailVerified),
    },
    signalState: {
      hasSuccessfulAuthentication: Boolean(data?.signalState?.hasSuccessfulAuthentication),
    },
    trustLevel: String(data?.trustLevel ?? ""),
    version: Number(data?.version),
    status: String(data?.status ?? ""),
    reasonReferences: (data?.reasonReferences ?? []).map((reference) => ({
      category: reference.category,
      eventId: reference.eventId,
      correlationId: reference.correlationId,
      occurredAt: fromTimestampLike(reference.occurredAt),
    })),
    createdAt: fromTimestampLike(data?.createdAt),
    createdBy: data?.createdBy ?? null,
    updatedAt: fromTimestampLike(data?.updatedAt),
    updatedBy: data?.updatedBy ?? null,
  };

  return createTrustRecord(params);
}
