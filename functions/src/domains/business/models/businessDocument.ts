/**
 * `businesses` collection reader/writer (`ENG-P2-002A`).
 *
 * Full-shape (TRD10 §10.6.3), unlike
 * `functions/src/domains/permissions/models/businessDocument.ts`'s
 * narrow, `status`-only `ENG-P2-004B` reader (that file is unmodified —
 * `ENG-P2-004`'s frozen evaluator surface, consumed not touched, §16).
 * Pure parsing/serialization only, same fail-closed convention as
 * `businessBranchDocument.ts` and `functions/src/domains/permissions/models/businessMembershipDocument.ts`
 * — `fromBusinessDocument` returns `null`, never throws, for a
 * structurally invalid document; `toBusinessDocumentFields` produces a
 * plain object using native `Date`, no Firestore `Timestamp` import.
 */

import { BUSINESS_STATUSES, type BusinessStatus } from "./businessStatus";
import { isWellFormedBusinessCode } from "./businessCode";
import type { Business } from "./business";

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function isBusinessStatus(value: unknown): value is BusinessStatus {
  return typeof value === "string" && (BUSINESS_STATUSES as readonly string[]).includes(value);
}

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

/**
 * TRD10 §10.6.3 types `supportedLanguages` as `string[]`, not a
 * non-empty array — no minimum cardinality is governed (matches
 * `customerProfile.ts`'s "governed reference lists, default empty"
 * precedent for `interests`/`preferredCategories`). Element-level
 * well-formedness only.
 */
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

/** Returns `null` (never throws) for a structurally invalid document. */
export function fromBusinessDocument(id: string, raw: unknown): Business | null {
  if (typeof raw !== "object" || raw === null) return null;

  const data = raw as Partial<{
    businessCode: unknown;
    legalName: unknown;
    displayName: unknown;
    ownerUserId: unknown;
    primaryCategoryId: unknown;
    businessTypeId: unknown;
    countryCode: unknown;
    currencyCode: unknown;
    timezone: unknown;
    city: unknown;
    address: unknown;
    contactPhone: unknown;
    contactEmail: unknown;
    logoUrl: unknown;
    supportedLanguages: unknown;
    status: unknown;
    subscriptionId: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    schemaVersion: unknown;
  }>;

  if (typeof data.businessCode !== "string" || !isWellFormedBusinessCode(data.businessCode)) {
    return null;
  }
  if (typeof data.displayName !== "string" || data.displayName.length === 0) return null;
  if (typeof data.ownerUserId !== "string" || data.ownerUserId.length === 0) return null;
  if (typeof data.primaryCategoryId !== "string" || data.primaryCategoryId.length === 0) {
    return null;
  }
  if (typeof data.countryCode !== "string" || !COUNTRY_CODE_PATTERN.test(data.countryCode)) {
    return null;
  }
  if (typeof data.currencyCode !== "string" || !CURRENCY_CODE_PATTERN.test(data.currencyCode)) {
    return null;
  }
  if (typeof data.timezone !== "string" || data.timezone.length === 0) return null;
  if (typeof data.city !== "string" || data.city.length === 0) return null;
  if (typeof data.contactPhone !== "string" || data.contactPhone.length === 0) return null;
  if (!isStringArray(data.supportedLanguages)) return null;
  if (!isBusinessStatus(data.status)) return null;
  if (data.legalName !== undefined && typeof data.legalName !== "string") return null;
  if (data.businessTypeId !== undefined && typeof data.businessTypeId !== "string") return null;
  if (data.address !== undefined && typeof data.address !== "string") return null;
  if (data.contactEmail !== undefined && typeof data.contactEmail !== "string") return null;
  if (data.logoUrl !== undefined && typeof data.logoUrl !== "string") return null;
  if (data.subscriptionId !== undefined && typeof data.subscriptionId !== "string") return null;
  if (!isTimestampLike(data.createdAt)) return null;
  if (!isTimestampLike(data.updatedAt)) return null;
  if (typeof data.schemaVersion !== "number") return null;

  return {
    id,
    businessCode: data.businessCode,
    legalName: data.legalName,
    displayName: data.displayName,
    ownerUserId: data.ownerUserId,
    primaryCategoryId: data.primaryCategoryId,
    businessTypeId: data.businessTypeId,
    countryCode: data.countryCode,
    currencyCode: data.currencyCode,
    timezone: data.timezone,
    city: data.city,
    address: data.address,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    logoUrl: data.logoUrl,
    supportedLanguages: data.supportedLanguages,
    status: data.status,
    subscriptionId: data.subscriptionId,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion,
  };
}

export type BusinessDocumentFields = Omit<Business, "id">;

/** `id` is the Firestore document key, never a field within the document itself. */
export function toBusinessDocumentFields(business: Business): BusinessDocumentFields {
  return {
    businessCode: business.businessCode,
    legalName: business.legalName,
    displayName: business.displayName,
    ownerUserId: business.ownerUserId,
    primaryCategoryId: business.primaryCategoryId,
    businessTypeId: business.businessTypeId,
    countryCode: business.countryCode,
    currencyCode: business.currencyCode,
    timezone: business.timezone,
    city: business.city,
    address: business.address,
    contactPhone: business.contactPhone,
    contactEmail: business.contactEmail,
    logoUrl: business.logoUrl,
    supportedLanguages: business.supportedLanguages,
    status: business.status,
    subscriptionId: business.subscriptionId,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    schemaVersion: business.schemaVersion,
  };
}
