/**
 * `qrIdentityRecords` collection Firestore document converter
 * (ENG-P2-001-05).
 *
 * Document ID is the QR reference value itself (`ref_1`), not a
 * generated ID — same doc-ID-as-value uniqueness pattern as
 * `loyaltyNumbers`: `transaction.get()` on this exact path before any
 * `transaction.set()` is what makes "at most one active record per
 * reference, ever" enforceable inside a Firestore transaction.
 *
 * One document per issued/regenerated QR reference, ever. Regeneration
 * (ENG-P2-001-04's `regenerateQrIdentity`) never mutates or deletes the
 * old record in place — it writes a NEW `qrIdentityRecords/{newRef}`
 * document and marks the OLD one `status: "invalidated"` with
 * `replacedByReference` pointing at the new value, retaining it for
 * audit per `ENG-P2-ARCH-001` §5's "old codes must fail closed" /
 * "retained, not deleted" requirements. `replacedByReference` is
 * `null`, not omitted, on an active or never-superseded record, so the
 * field is always present for query/index consistency.
 */

import type { Timestamp } from "firebase-admin/firestore";
import type { BaseMetadata } from "../../../shared/metadata/baseMetadata";
import { stampCreate } from "../../../shared/metadata/baseMetadata";
import { malformedQrIdentityRecordError } from "../models/qrIdentityErrors";
import {
  QR_IDENTITY_STATUSES,
  type QrIdentityAssociation,
  type QrIdentityStatus,
} from "../services/qrIdentityAssociationService";

export type QrIdentityRecordDocument = Omit<BaseMetadata, "status"> & {
  status: QrIdentityStatus;
  qrReference: string;
  customerIdentityId: string;
  loyaltyNumber: string;
  issuedAt: Timestamp;
  replacedByReference: string | null;
};

function toTimestampLike(value: Date): Timestamp {
  return value as unknown as Timestamp;
}

function fromTimestampLike(value: unknown): Date {
  const candidate = value as { toDate?: () => Date };
  return typeof candidate?.toDate === "function" ? candidate.toDate() : (value as Date);
}

export type ToQrIdentityRecordDocumentOptions = {
  replacedByReference?: string;
};

export function toQrIdentityRecordDocument(
  association: QrIdentityAssociation,
  actorId: string | null,
  options: ToQrIdentityRecordDocumentOptions = {},
): Omit<QrIdentityRecordDocument, "schemaVersion"> {
  const stamp = stampCreate(actorId);
  return {
    id: association.qrReference,
    status: association.status,
    qrReference: association.qrReference,
    customerIdentityId: association.customerIdentityId,
    loyaltyNumber: association.loyaltyNumber,
    issuedAt: toTimestampLike(association.issuedAt),
    replacedByReference: options.replacedByReference ?? null,
    createdAt: stamp.createdAt as never,
    createdBy: stamp.createdBy,
    updatedAt: stamp.updatedAt as never,
    updatedBy: stamp.updatedBy,
  };
}

export function fromQrIdentityRecordDocument(raw: unknown): QrIdentityAssociation {
  const data = raw as Partial<QrIdentityRecordDocument> & { id?: unknown };
  const id = typeof data.id === "string" ? data.id : undefined;

  if (
    !id ||
    typeof data.customerIdentityId !== "string" ||
    typeof data.loyaltyNumber !== "string" ||
    typeof data.qrReference !== "string" ||
    typeof data.status !== "string" ||
    !QR_IDENTITY_STATUSES.includes(data.status as QrIdentityStatus) ||
    !data.issuedAt
  ) {
    throw malformedQrIdentityRecordError(id ?? "unknown");
  }

  return {
    customerIdentityId: data.customerIdentityId,
    loyaltyNumber: data.loyaltyNumber,
    qrReference: data.qrReference,
    status: data.status as QrIdentityStatus,
    issuedAt: fromTimestampLike(data.issuedAt),
  };
}
