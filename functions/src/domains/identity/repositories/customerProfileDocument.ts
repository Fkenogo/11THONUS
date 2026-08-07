/**
 * `customerProfiles` collection Firestore document type and converter
 * (ENG-P2-001-05).
 *
 * Per TRD10 §10.6.2 (`id`, `userId`, `loyaltyNumber`, `qrReference`
 * baseline) and `ENG-P2-001-PLAN-001`'s own `-05` scope statement, the
 * `-05` shell path here persists a **minimal shell**: `id`, `userId`,
 * `loyaltyNumber?`, `qrReference?`, plus `BaseMetadata` — all optional so
 * a shell document with none of them yet issued remains valid. The
 * `-02` Customer Profile's own mutable fields (`firstName`, `lastName`,
 * `interests`, `communicationPreferences`, `consentVersions`, ...) are
 * carried by the separate `toCustomerProfileFields`/`fromCustomerProfileFields`
 * pair added under `CAP-P2-007` (see the profile-fields wiring note below).
 * No `gender` field exists on this collection — gender is not collected at
 * MVP (`DEC-PROD-012` Option D).
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
 *
 * Profile-fields wiring (`CAP-P2-007`): `-02` Customer Profile's own
 * mutable fields (`firstName`, `lastName`, `dateOfBirth?`, `city?`,
 * `interests`, `preferredCategories`, `communicationPreferences`,
 * `consentVersions`, `profileCompletionPercent`) persist onto this same
 * `customerProfiles` document per TRD10 §10.6.2 (a flat schema). The
 * `toCustomerProfileFields`/`fromCustomerProfileFields` pair below is the
 * `-05`-owned Firestore boundary for those fields: it does the
 * Firestore-specific `Date`↔`Timestamp` mapping for
 * `consentVersions.acceptedAt` and delegates **all** field validation back
 * to `-02`'s own `serializeCustomerProfileFields`/
 * `deserializeCustomerProfileFields` (validation boundary stays in the
 * domain model; no `gender` is ever emitted, per `DEC-PROD-012` Option D).
 * These fields are optional on the persisted type because a shell document
 * (loyalty/QR projection only) may legitimately exist before a `-02`
 * profile is issued — unchanged from the pre-`CAP-P2-007` behaviour.
 */

import type { Timestamp } from "firebase-admin/firestore";
import type { BaseMetadata } from "../../../shared/metadata/baseMetadata";
import { malformedCustomerIdentityRecordError } from "../models/identityErrors";
import {
  serializeCustomerProfileFields,
  deserializeCustomerProfileFields,
  type CustomerProfile,
  type CustomerProfileBinding,
} from "../models/customerProfile";

type CommunicationPreferencesDocument = {
  push: boolean;
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
  marketingConsent: boolean;
};

type ConsentVersionsDocument = {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: Timestamp;
};

/**
 * The `-02` Customer Profile fields as they persist on the `customerProfiles`
 * document (TRD10 §10.6.2, flat). Identical to `-02`'s `CustomerProfileFields`
 * except `consentVersions.acceptedAt` is a Firestore `Timestamp` here, not a
 * `Date`. Absent optionals (`dateOfBirth`/`city`) are simply omitted.
 */
export type CustomerProfileFieldsDocument = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  city?: string;
  interests: string[];
  preferredCategories: string[];
  communicationPreferences: CommunicationPreferencesDocument;
  consentVersions: ConsentVersionsDocument;
  profileCompletionPercent: number;
};

export type CustomerProfileDocument = BaseMetadata & {
  userId: string;
  loyaltyNumber?: string;
  qrReference?: string;
} & Partial<CustomerProfileFieldsDocument>;

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

// Same Firestore boundary convention as `userDocument.ts`: the domain layer
// never imports Firestore, so the `Date`↔`Timestamp` cast lives only here.
function toTimestampLike(value: Date): Timestamp {
  return value as unknown as Timestamp;
}

function fromTimestampLike(value: unknown): Date {
  const candidate = value as { toDate?: () => Date };
  return typeof candidate?.toDate === "function" ? candidate.toDate() : (value as Date);
}

/**
 * Serialize a `-02` domain `CustomerProfile` into the flat profile-field
 * object persisted on the `customerProfiles` document (TRD10 §10.6.2).
 *
 * Field selection, optional omission, and the no-`gender` guarantee are all
 * `-02`'s (`serializeCustomerProfileFields`); this converter only maps
 * `consentVersions.acceptedAt` from `Date` to a Firestore `Timestamp`. The
 * identity binding (`id`/`userId`/`loyaltyNumber`/`qrReference`) and
 * `BaseMetadata` remain the shell's, written by their own repositories — not
 * re-owned here.
 */
export function toCustomerProfileFields(profile: CustomerProfile): CustomerProfileFieldsDocument {
  const fields = serializeCustomerProfileFields(profile);
  return {
    ...fields,
    consentVersions: {
      termsVersion: fields.consentVersions.termsVersion,
      privacyVersion: fields.consentVersions.privacyVersion,
      acceptedAt: toTimestampLike(fields.consentVersions.acceptedAt),
    },
  };
}

/**
 * Reconstruct a `-02` domain `CustomerProfile` from a stored `customerProfiles`
 * document's profile fields plus the shell binding.
 *
 * Maps `consentVersions.acceptedAt` from a Firestore `Timestamp` back to a
 * `Date` (tolerating an already-hydrated `Date`), then delegates every
 * validation/malformed-record decision to `-02`'s
 * `deserializeCustomerProfileFields` — this converter adds no validation of
 * its own.
 */
export function fromCustomerProfileFields(
  raw: unknown,
  binding: CustomerProfileBinding,
): CustomerProfile {
  const data = raw as { consentVersions?: { acceptedAt?: unknown } };
  const normalised =
    data && typeof data === "object" && data.consentVersions
      ? {
          ...data,
          consentVersions: {
            ...data.consentVersions,
            acceptedAt: fromTimestampLike(data.consentVersions.acceptedAt),
          },
        }
      : raw;

  return deserializeCustomerProfileFields(normalised, binding);
}
