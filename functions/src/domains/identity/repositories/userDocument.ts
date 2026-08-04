/**
 * `users` collection Firestore document converter (ENG-P2-001-05).
 *
 * Persists exactly the `-01` domain aggregate's own fields — `id`,
 * `status`, `authenticationReferences`, `trustReference` — plus
 * `BaseMetadata`. Deliberately does not populate TRD10 §10.6.1's
 * `authUid`/`userType`/`displayName`/`primaryPhone`/`primaryEmail`/
 * `preferredLanguage`/`countryCode`/`timezone` fields: those belong to
 * Authentication-integration/Profile scope this task does not implement
 * (see the ENG-P2-001-05 implementation report §4 for the full boundary
 * rationale). Never persists a credential, token, or verification state
 * — `authenticationReferences`/`trustReference` are reference-only,
 * mirroring the domain type exactly.
 *
 * This is the only file in this domain permitted to import both the
 * domain type and a Firestore type — the domain layer itself never
 * imports Firestore (machine-enforced by the existing scoped eslint
 * rule), and nothing here leaks a Firestore-specific shape back into
 * `models/`.
 */

import type { Timestamp } from "firebase-admin/firestore";
import type { BaseMetadata } from "../../../shared/metadata/baseMetadata";
import { malformedCustomerIdentityRecordError } from "../models/identityErrors";
import { IDENTITY_STATUSES, type IdentityStatus } from "../models/identityStatus";
import type { CustomerIdentity } from "../models/customerIdentity";
import type {
  AuthenticationReference,
  AuthenticationReferenceType,
  AuthenticationReferenceLinkStatus,
} from "../models/authenticationReference";
import type { TrustReference } from "../models/trustReference";

type AuthenticationReferenceDocument = {
  referenceId: string;
  referenceType: AuthenticationReferenceType;
  linkStatus: AuthenticationReferenceLinkStatus;
  createdAt: Timestamp;
  createdBy: string | null;
};

type TrustReferenceDocument = {
  trustRecordId: string;
  createdAt: Timestamp;
  createdBy: string | null;
};

export type UserDocument = Omit<BaseMetadata, "status"> & {
  status: IdentityStatus;
  authenticationReferences: AuthenticationReferenceDocument[];
  trustReference: TrustReferenceDocument | null;
};

function toTimestampLike(value: Date): Timestamp {
  return value as unknown as Timestamp;
}

function fromTimestampLike(value: unknown): Date {
  const candidate = value as { toDate?: () => Date };
  return typeof candidate?.toDate === "function" ? candidate.toDate() : (value as Date);
}

export function toUserDocument(identity: CustomerIdentity): Omit<UserDocument, "schemaVersion"> {
  return {
    id: identity.id,
    status: identity.status,
    authenticationReferences: identity.authenticationReferences.map((ref) => ({
      referenceId: ref.referenceId,
      referenceType: ref.referenceType,
      linkStatus: ref.linkStatus,
      createdAt: toTimestampLike(ref.createdAt),
      createdBy: ref.createdBy,
    })),
    trustReference: identity.trustReference
      ? {
          trustRecordId: identity.trustReference.trustRecordId,
          createdAt: toTimestampLike(identity.trustReference.createdAt),
          createdBy: identity.trustReference.createdBy,
        }
      : null,
    createdAt: toTimestampLike(identity.createdAt),
    createdBy: identity.createdBy,
    updatedAt: toTimestampLike(identity.updatedAt),
    updatedBy: identity.updatedBy,
  };
}

function isAuthenticationReferenceDocumentArray(
  value: unknown,
): value is AuthenticationReferenceDocument[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { referenceId?: unknown }).referenceId === "string" &&
        typeof (entry as { referenceType?: unknown }).referenceType === "string" &&
        typeof (entry as { linkStatus?: unknown }).linkStatus === "string",
    )
  );
}

export function fromUserDocument(raw: unknown): CustomerIdentity {
  const data = raw as Partial<UserDocument> & { id?: unknown };
  const id = typeof data.id === "string" ? data.id : undefined;

  if (
    !id ||
    typeof data.status !== "string" ||
    !IDENTITY_STATUSES.includes(data.status as IdentityStatus) ||
    !isAuthenticationReferenceDocumentArray(data.authenticationReferences) ||
    !data.createdAt ||
    !data.updatedAt
  ) {
    throw malformedCustomerIdentityRecordError(id ?? "unknown");
  }

  const authenticationReferences: AuthenticationReference[] = data.authenticationReferences.map(
    (ref) => ({
      referenceId: ref.referenceId,
      referenceType: ref.referenceType,
      linkStatus: ref.linkStatus,
      createdAt: fromTimestampLike(ref.createdAt),
      createdBy: ref.createdBy,
    }),
  );

  const trustReference: TrustReference | undefined = data.trustReference
    ? {
        trustRecordId: data.trustReference.trustRecordId,
        createdAt: fromTimestampLike(data.trustReference.createdAt),
        createdBy: data.trustReference.createdBy,
      }
    : undefined;

  return {
    id,
    status: data.status as IdentityStatus,
    createdAt: fromTimestampLike(data.createdAt),
    createdBy: data.createdBy ?? null,
    updatedAt: fromTimestampLike(data.updatedAt),
    updatedBy: data.updatedBy ?? null,
    authenticationReferences,
    ...(trustReference ? { trustReference } : {}),
  };
}
