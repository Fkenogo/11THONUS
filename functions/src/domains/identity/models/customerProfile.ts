/**
 * Customer Profile domain model (ENG-P2-001-02).
 *
 * The mutable, non-identity profile data attached to a Customer Identity
 * Aggregate — the `customerProfiles` document's own fields per TRD10
 * §10.6.2 (the named governing schema). Owns no identity binding logic
 * (Internal Customer ID, Loyalty Number, QR — `-01`/`-03`/`-04`/`-05`),
 * no authentication references, and no trust/verification state (ITM).
 *
 * Field set (TRD10 §10.6.2, post-`DEC-PROD-012`): `firstName` and
 * `lastName` (mandatory); `dateOfBirth?`, `city?` (optional); `interests`,
 * `preferredCategories` (governed reference lists, default empty);
 * `communicationPreferences`; `consentVersions` (required at write time,
 * TRD21); `profileCompletionPercent` (derived). Identity-only fields
 * (`displayName`, `preferredLanguage`, `countryCode`, phone/email) live on
 * the `users` document (TRD10 §10.6.1), not here.
 *
 * Gender: **not collected at MVP** per the Founder decision `DEC-PROD-012`
 * (Option D). There is no `gender` field on this contract; `createCustomerProfile`/
 * `updateCustomerProfile` reject any `gender` (or other unsupported) input.
 * A future optional gender attribute may be added additively under a
 * separate governed decision — not implemented here.
 *
 * Progressive KYC (TRD10 §10.6.2): optional information remains absent
 * rather than populated with false placeholders.
 *
 * Pure domain module — `Date` timestamps, no Firebase import. Reuses the
 * shared `IdentityDomainError`/14-category taxonomy (TRD11 §11.35); no new
 * error category. Persistence of these fields is `-05`'s surface; the
 * `serialize`/`deserialize` helpers below produce/consume the plain
 * `customerProfiles` field object that surface persists.
 */

import {
  customerProfileNotFoundError,
  immutableProfileBindingError,
  invalidProfileFieldError,
  malformedCustomerProfileRecordError,
  missingProfileConsentError,
  unsupportedProfileFieldError,
} from "./identityErrors";

export type CommunicationPreferences = {
  push: boolean;
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
  marketingConsent: boolean;
};

export type ConsentVersions = {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: Date;
};

export type CustomerProfile = {
  readonly customerIdentityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  city?: string;
  interests: string[];
  preferredCategories: string[];
  communicationPreferences: CommunicationPreferences;
  consentVersions: ConsentVersions;
  profileCompletionPercent: number;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
};

export type CreateCustomerProfileParams = {
  customerIdentityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  city?: string;
  interests?: string[];
  preferredCategories?: string[];
  communicationPreferences?: Partial<CommunicationPreferences>;
  consentVersions: ConsentVersions;
  createdAt: Date;
  createdBy: string | null;
};

export type UpdateCustomerProfileChanges = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  city?: string;
  interests?: string[];
  preferredCategories?: string[];
  communicationPreferences?: Partial<CommunicationPreferences>;
  consentVersions?: ConsentVersions;
};

export type UpdateCustomerProfileMeta = {
  updatedAt: Date;
  updatedBy: string | null;
};

const UNSUPPORTED_FIELDS = ["gender"] as const;

const DEFAULT_COMMUNICATION_PREFERENCES: CommunicationPreferences = {
  push: false,
  sms: false,
  email: false,
  whatsapp: false,
  marketingConsent: false,
};

function rejectUnsupportedFields(input: Record<string, unknown>): void {
  for (const field of UNSUPPORTED_FIELDS) {
    if (field in input) {
      throw unsupportedProfileFieldError(field);
    }
  }
}

function requireNonEmpty(field: string, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalidProfileFieldError(field, typeof value === "string" ? value : String(value));
  }
  return value;
}

function normaliseOptionalString(field: string, value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return requireNonEmpty(field, value);
}

function normaliseStringArray(field: string, value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw invalidProfileFieldError(field, JSON.stringify(value));
  }
  return [...(value as string[])];
}

function normaliseCommunicationPreferences(
  value: Partial<CommunicationPreferences> | undefined,
): CommunicationPreferences {
  if (value === undefined) {
    return { ...DEFAULT_COMMUNICATION_PREFERENCES };
  }
  const result: CommunicationPreferences = { ...DEFAULT_COMMUNICATION_PREFERENCES };
  for (const key of Object.keys(result) as (keyof CommunicationPreferences)[]) {
    const provided = value[key];
    if (provided !== undefined) {
      if (typeof provided !== "boolean") {
        throw invalidProfileFieldError(`communicationPreferences.${key}`, String(provided));
      }
      result[key] = provided;
    }
  }
  return result;
}

function requireConsent(value: ConsentVersions | undefined): ConsentVersions {
  if (
    !value ||
    typeof value.termsVersion !== "string" ||
    value.termsVersion.trim().length === 0 ||
    typeof value.privacyVersion !== "string" ||
    value.privacyVersion.trim().length === 0 ||
    !(value.acceptedAt instanceof Date) ||
    Number.isNaN(value.acceptedAt.getTime())
  ) {
    throw missingProfileConsentError();
  }
  return {
    termsVersion: value.termsVersion,
    privacyVersion: value.privacyVersion,
    acceptedAt: value.acceptedAt,
  };
}

const COMPLETION_SLOTS = 6;

function computeProfileCompletionPercent(profile: {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  city?: string;
  interests: string[];
  preferredCategories: string[];
}): number {
  let completed = 0;
  if (profile.firstName.trim().length > 0) completed += 1;
  if (profile.lastName.trim().length > 0) completed += 1;
  if (profile.dateOfBirth) completed += 1;
  if (profile.city) completed += 1;
  if (profile.interests.length > 0) completed += 1;
  if (profile.preferredCategories.length > 0) completed += 1;
  return Math.round((completed / COMPLETION_SLOTS) * 100);
}

export function createCustomerProfile(params: CreateCustomerProfileParams): CustomerProfile {
  rejectUnsupportedFields(params as unknown as Record<string, unknown>);

  const customerIdentityId = requireNonEmpty("customerIdentityId", params.customerIdentityId);
  const firstName = requireNonEmpty("firstName", params.firstName);
  const lastName = requireNonEmpty("lastName", params.lastName);
  const dateOfBirth = normaliseOptionalString("dateOfBirth", params.dateOfBirth);
  const city = normaliseOptionalString("city", params.city);
  const interests = normaliseStringArray("interests", params.interests);
  const preferredCategories = normaliseStringArray(
    "preferredCategories",
    params.preferredCategories,
  );
  const communicationPreferences = normaliseCommunicationPreferences(
    params.communicationPreferences,
  );
  const consentVersions = requireConsent(params.consentVersions);

  const profile: CustomerProfile = {
    customerIdentityId,
    firstName,
    lastName,
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(city ? { city } : {}),
    interests,
    preferredCategories,
    communicationPreferences,
    consentVersions,
    profileCompletionPercent: computeProfileCompletionPercent({
      firstName,
      lastName,
      dateOfBirth,
      city,
      interests,
      preferredCategories,
    }),
    createdAt: params.createdAt,
    createdBy: params.createdBy,
    updatedAt: params.createdAt,
    updatedBy: params.createdBy,
  };

  return profile;
}

export function updateCustomerProfile(
  existing: CustomerProfile,
  changes: UpdateCustomerProfileChanges,
  meta: UpdateCustomerProfileMeta,
): CustomerProfile {
  const raw = changes as Record<string, unknown>;
  rejectUnsupportedFields(raw);

  if ("customerIdentityId" in raw && raw.customerIdentityId !== existing.customerIdentityId) {
    throw immutableProfileBindingError("customerIdentityId");
  }

  const firstName =
    changes.firstName !== undefined
      ? requireNonEmpty("firstName", changes.firstName)
      : existing.firstName;
  const lastName =
    changes.lastName !== undefined
      ? requireNonEmpty("lastName", changes.lastName)
      : existing.lastName;
  const dateOfBirth =
    changes.dateOfBirth !== undefined
      ? normaliseOptionalString("dateOfBirth", changes.dateOfBirth)
      : existing.dateOfBirth;
  const city =
    changes.city !== undefined ? normaliseOptionalString("city", changes.city) : existing.city;
  const interests =
    changes.interests !== undefined
      ? normaliseStringArray("interests", changes.interests)
      : existing.interests;
  const preferredCategories =
    changes.preferredCategories !== undefined
      ? normaliseStringArray("preferredCategories", changes.preferredCategories)
      : existing.preferredCategories;
  const communicationPreferences =
    changes.communicationPreferences !== undefined
      ? normaliseCommunicationPreferences({
          ...existing.communicationPreferences,
          ...changes.communicationPreferences,
        })
      : existing.communicationPreferences;
  const consentVersions =
    changes.consentVersions !== undefined
      ? requireConsent(changes.consentVersions)
      : existing.consentVersions;

  const profile: CustomerProfile = {
    customerIdentityId: existing.customerIdentityId,
    firstName,
    lastName,
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(city ? { city } : {}),
    interests,
    preferredCategories,
    communicationPreferences,
    consentVersions,
    profileCompletionPercent: computeProfileCompletionPercent({
      firstName,
      lastName,
      dateOfBirth,
      city,
      interests,
      preferredCategories,
    }),
    createdAt: existing.createdAt,
    createdBy: existing.createdBy,
    updatedAt: meta.updatedAt,
    updatedBy: meta.updatedBy,
  };

  return profile;
}

export type PublicCustomerProfile = {
  firstName: string;
};

/**
 * Privacy projection (PR-005): a public-facing profile read reveals only
 * non-sensitive display data. Date of birth, city, consent versions,
 * communication preferences, interests, and last name are never exposed
 * through this projection.
 */
export function toPublicCustomerProfile(profile: CustomerProfile): PublicCustomerProfile {
  return { firstName: profile.firstName };
}

export type CustomerProfileFields = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  city?: string;
  interests: string[];
  preferredCategories: string[];
  communicationPreferences: CommunicationPreferences;
  consentVersions: ConsentVersions;
  profileCompletionPercent: number;
};

/**
 * Produces the plain mutable-profile field object for the `customerProfiles`
 * document (TRD10 §10.6.2) — the identity binding (`id`/`userId`/
 * `loyaltyNumber`/`qrReference`) and `BaseMetadata` remain `-05`'s shell,
 * not re-owned here. Absent optionals are omitted (Progressive KYC); no
 * `gender` field is ever emitted.
 */
export function serializeCustomerProfileFields(profile: CustomerProfile): CustomerProfileFields {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    ...(profile.dateOfBirth ? { dateOfBirth: profile.dateOfBirth } : {}),
    ...(profile.city ? { city: profile.city } : {}),
    interests: [...profile.interests],
    preferredCategories: [...profile.preferredCategories],
    communicationPreferences: { ...profile.communicationPreferences },
    consentVersions: { ...profile.consentVersions },
    profileCompletionPercent: profile.profileCompletionPercent,
  };
}

export type CustomerProfileBinding = {
  customerIdentityId: string;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
};

export function deserializeCustomerProfileFields(
  raw: unknown,
  binding: CustomerProfileBinding,
): CustomerProfile {
  const data = raw as Partial<CustomerProfileFields>;

  if (!binding.customerIdentityId) {
    throw customerProfileNotFoundError(binding.customerIdentityId || "unknown");
  }
  if (
    typeof data.firstName !== "string" ||
    typeof data.lastName !== "string" ||
    !data.consentVersions
  ) {
    throw malformedCustomerProfileRecordError(binding.customerIdentityId);
  }

  return createCustomerProfileFromStored(data, binding);
}

function createCustomerProfileFromStored(
  data: Partial<CustomerProfileFields>,
  binding: CustomerProfileBinding,
): CustomerProfile {
  const firstName = requireNonEmpty("firstName", data.firstName);
  const lastName = requireNonEmpty("lastName", data.lastName);
  const dateOfBirth = normaliseOptionalString("dateOfBirth", data.dateOfBirth);
  const city = normaliseOptionalString("city", data.city);
  const interests = normaliseStringArray("interests", data.interests);
  const preferredCategories = normaliseStringArray("preferredCategories", data.preferredCategories);
  const communicationPreferences = normaliseCommunicationPreferences(data.communicationPreferences);
  const consentVersions = requireConsent(data.consentVersions);

  return {
    customerIdentityId: binding.customerIdentityId,
    firstName,
    lastName,
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(city ? { city } : {}),
    interests,
    preferredCategories,
    communicationPreferences,
    consentVersions,
    profileCompletionPercent: computeProfileCompletionPercent({
      firstName,
      lastName,
      dateOfBirth,
      city,
      interests,
      preferredCategories,
    }),
    createdAt: binding.createdAt,
    createdBy: binding.createdBy,
    updatedAt: binding.updatedAt,
    updatedBy: binding.updatedBy,
  };
}
