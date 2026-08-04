/**
 * `customerProfiles` collection Firestore document type and converter
 * (ENG-P2-001-05).
 *
 * Per TRD10 §10.6.2 (`id`, `userId`, `loyaltyNumber`, `qrReference`
 * baseline) and `ENG-P2-001-PLAN-001`'s own `-05` scope statement, this
 * task persists only a **minimal shell**: `id`, `userId`,
 * `loyaltyNumber?`, `qrReference?`, plus `BaseMetadata`. Every other
 * TRD10-listed profile field (`firstName`, `gender`, `interests`,
 * `communicationPreferences`, ...) is `-02` Customer Profile's own
 * future scope and is never written or required by this converter —
 * both are optional here specifically so a shell document with neither
 * yet issued remains valid.
 *
 * This is a **projection**, not authoritative: `loyaltyNumbers/{value}`
 * and `qrIdentityRecords/{value}` are what actually enforce uniqueness
 * and retain history. This document exists purely so "get this
 * identity's current loyalty number/QR" needs no second lookup.
 *
 * Shared by both the `loyaltyNumber` and `qrIdentity` repositories,
 * which each own writing their own field of this same collection —
 * housed here because `-05`'s own scope treats `users` and
 * `customerProfiles` together as this package's persistence surface.
 */

import type { BaseMetadata } from "../../../shared/metadata/baseMetadata";
import { malformedCustomerIdentityRecordError } from "../models/identityErrors";

export type CustomerProfileDocument = BaseMetadata & {
  userId: string;
  loyaltyNumber?: string;
  qrReference?: string;
};

export function fromCustomerProfileDocument(raw: unknown): CustomerProfileDocument {
  const data = raw as Partial<CustomerProfileDocument> & { id?: unknown };
  const id = typeof data.id === "string" ? data.id : undefined;

  if (!id || typeof data.userId !== "string" || !data.createdAt || !data.updatedAt) {
    throw malformedCustomerIdentityRecordError(id ?? "unknown");
  }

  return {
    id,
    schemaVersion: data.schemaVersion ?? 1,
    status: data.status ?? "active",
    userId: data.userId,
    ...(data.loyaltyNumber ? { loyaltyNumber: data.loyaltyNumber } : {}),
    ...(data.qrReference ? { qrReference: data.qrReference } : {}),
    createdAt: data.createdAt,
    createdBy: data.createdBy ?? null,
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy ?? null,
  };
}
