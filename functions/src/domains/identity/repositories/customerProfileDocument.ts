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
 *
 * Naming note (`ENG-P2-ARCH-CORR-004`, Finding F5): `userId` here is the
 * only place in this capability that names the aggregate reference
 * anything other than `customerIdentityId` — a TRD10 §10.6.2-inherited
 * name, cosmetic only (no code reads the wrong field). Retained as-is:
 * this is a live, persisted Firestore field name, and renaming it is a
 * schema-affecting change deferred to a future, dedicated naming-
 * consistency task (`ENG-P2-001-NAMING-001`).
 *
 * Wiring note (`ENG-P2-ARCH-CORR-004`, Finding F7): `fromCustomerProfileDocument`
 * below is fully implemented and unit-tested but has no current
 * production caller. `loyaltyNumberRepository.ts` and
 * `qrIdentityRepository.ts` both read this collection directly via a
 * narrow single-optional-field raw access (`data()?.["loyaltyNumber"]` /
 * `data()?.["qrReference"]`) rather than through this converter, because
 * they need only one optional field each and don't want this
 * converter's stricter behaviour — it throws `malformedCustomerIdentityRecordError`
 * if `id`/`userId`/`createdAt`/`updatedAt` are absent, which those two
 * narrow reads have no need to enforce. Wiring it into either read path
 * would be a real, uninvestigated behaviour change, not a drop-in
 * substitution — out of this reconciliation task's boundary. This
 * converter remains available, unused, for a future read path that
 * needs the complete validated shape (e.g. a Customer Profile read API).
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
