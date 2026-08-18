/**
 * `Business` aggregate (`ENG-P2-002A`).
 *
 * The full shape TRD10 §10.6.3 governs (verbatim, `ENG-P2-002-DESIGN-001`
 * §4.1) — unlike `functions/src/domains/permissions/models/businessDocument.ts`'s
 * narrow, `status`-only `ENG-P2-004B` reader, this is the complete
 * aggregate `ENG-P2-002` owns.
 *
 * `createBusiness` always produces `status: "draft"` — the design's §6
 * lifecycle table names exactly one initial transition ("— → draft"),
 * and this constructor's own params type has no `status` field at all,
 * so a caller cannot supply an initial status other than `draft` even by
 * mistake. `ownerUserId` is taken as an already-resolved value here —
 * deriving it from an authenticated principal (never trusting a
 * client-supplied value) is the bootstrap contract's job
 * (`businessBootstrap.ts`), not this constructor's.
 *
 * `transitionBusinessStatus` performs only the *structural* transition
 * (`businessStatus.ts`'s table) — it has no concept of who may invoke a
 * transition or what precondition gates it; that authority/precondition
 * logic is `ENG-P2-002B`/`002C`'s (§10.2's operation classification).
 */

import { createBusinessCode } from "./businessCode";
import {
  businessAlreadyClosedError,
  businessArchivedError,
  invalidBusinessFieldError,
  invalidBusinessStatusTransitionError,
} from "./businessErrors";
import type { BusinessStatus } from "./businessStatus";
import { isValidBusinessStatusTransition } from "./businessStatus";

export type Business = {
  readonly id: string;
  readonly businessCode: string;
  legalName?: string;
  displayName: string;
  readonly ownerUserId: string;
  primaryCategoryId: string;
  businessTypeId?: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  city: string;
  address?: string;
  contactPhone: string;
  contactEmail?: string;
  logoUrl?: string;
  supportedLanguages: string[];
  status: BusinessStatus;
  subscriptionId?: string;
  readonly createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export type CreateBusinessParams = {
  id: string;
  businessCode: string;
  ownerUserId: string;
  legalName?: string;
  displayName: string;
  primaryCategoryId: string;
  businessTypeId?: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  city: string;
  address?: string;
  contactPhone: string;
  contactEmail?: string;
  logoUrl?: string;
  supportedLanguages: string[];
  subscriptionId?: string;
  createdAt: Date;
};

function requireNonBlank(field: string, value: string): string {
  if (value.trim().length === 0) {
    throw invalidBusinessFieldError(field, value);
  }
  return value;
}

/**
 * TRD10 §10.6.3 types `supportedLanguages` as `string[]` (required field,
 * present) — it does not state a minimum length. No empty-array rejection
 * is governed; this mirrors the identity domain's own precedent for
 * required array fields (`functions/src/domains/identity/models/customerProfile.ts`'s
 * `interests`/`preferredCategories`: "governed reference lists, default
 * empty"). Only element-level well-formedness (each entry a non-blank
 * string) is validated — that's structural, not a new business rule.
 */
function requireSupportedLanguages(value: string[]): string[] {
  for (const language of value) {
    if (language.trim().length === 0) {
      throw invalidBusinessFieldError("supportedLanguages", JSON.stringify(value));
    }
  }
  return value;
}

export function createBusiness(params: CreateBusinessParams): Business {
  const id = requireNonBlank("id", params.id);
  const businessCode = createBusinessCode(params.businessCode);
  const ownerUserId = requireNonBlank("ownerUserId", params.ownerUserId);
  const displayName = requireNonBlank("displayName", params.displayName);
  const primaryCategoryId = requireNonBlank("primaryCategoryId", params.primaryCategoryId);
  const city = requireNonBlank("city", params.city);
  const contactPhone = requireNonBlank("contactPhone", params.contactPhone);
  const supportedLanguages = requireSupportedLanguages(params.supportedLanguages);

  if (!COUNTRY_CODE_PATTERN.test(params.countryCode)) {
    throw invalidBusinessFieldError("countryCode", params.countryCode);
  }
  if (!CURRENCY_CODE_PATTERN.test(params.currencyCode)) {
    throw invalidBusinessFieldError("currencyCode", params.currencyCode);
  }
  if (params.timezone.trim().length === 0) {
    throw invalidBusinessFieldError("timezone", params.timezone);
  }

  return {
    id,
    businessCode,
    legalName: params.legalName,
    displayName,
    ownerUserId,
    primaryCategoryId,
    businessTypeId: params.businessTypeId,
    countryCode: params.countryCode,
    currencyCode: params.currencyCode,
    timezone: params.timezone,
    city,
    address: params.address,
    contactPhone,
    contactEmail: params.contactEmail,
    logoUrl: params.logoUrl,
    supportedLanguages,
    status: "draft",
    subscriptionId: params.subscriptionId,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    schemaVersion: 1,
  };
}

/**
 * `ENG-P2-002C` (Phase D). Every field a caller may patch, all optional
 * (partial update) — deliberately has no `id`/`businessCode`/`ownerUserId`/
 * `status`/`createdAt`/`schemaVersion` key: those are immutable-by-this-
 * command (immutable entirely, or mutable only through a separately
 * governed command — lifecycle transition, not this one). This is the same
 * structural-prevention pattern `CreateBusinessRequest` (`businessBootstrap.ts`)
 * already established for `ownerUserId`.
 */
export type UpdateBusinessProfileParams = {
  legalName?: string;
  displayName?: string;
  primaryCategoryId?: string;
  businessTypeId?: string;
  countryCode?: string;
  currencyCode?: string;
  timezone?: string;
  city?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  supportedLanguages?: string[];
  subscriptionId?: string;
  updatedAt: Date;
};

/**
 * Merges the supplied fields onto `business` and re-validates the resulting
 * *whole* state through the same rules `createBusiness` enforces (Phase S:
 * reuse 002A validators, validate resulting state rather than accepting a
 * malformed patch in isolation). A field omitted from `params` is left
 * unchanged; a field explicitly supplied as `undefined` clears an optional
 * field (distinguished via `in`, since a plain `??`/property-merge cannot
 * tell "not supplied" from "supplied as undefined").
 */
export function updateBusinessProfile(
  business: Business,
  params: UpdateBusinessProfileParams,
): Business {
  const next: Business = {
    ...business,
    legalName: "legalName" in params ? params.legalName : business.legalName,
    displayName: params.displayName !== undefined ? params.displayName : business.displayName,
    primaryCategoryId:
      params.primaryCategoryId !== undefined ? params.primaryCategoryId : business.primaryCategoryId,
    businessTypeId: "businessTypeId" in params ? params.businessTypeId : business.businessTypeId,
    countryCode: params.countryCode !== undefined ? params.countryCode : business.countryCode,
    currencyCode: params.currencyCode !== undefined ? params.currencyCode : business.currencyCode,
    timezone: params.timezone !== undefined ? params.timezone : business.timezone,
    city: params.city !== undefined ? params.city : business.city,
    address: "address" in params ? params.address : business.address,
    contactPhone: params.contactPhone !== undefined ? params.contactPhone : business.contactPhone,
    contactEmail: "contactEmail" in params ? params.contactEmail : business.contactEmail,
    logoUrl: "logoUrl" in params ? params.logoUrl : business.logoUrl,
    supportedLanguages:
      params.supportedLanguages !== undefined
        ? params.supportedLanguages
        : business.supportedLanguages,
    subscriptionId: "subscriptionId" in params ? params.subscriptionId : business.subscriptionId,
    updatedAt: params.updatedAt,
  };

  requireNonBlank("displayName", next.displayName);
  requireNonBlank("primaryCategoryId", next.primaryCategoryId);
  requireNonBlank("city", next.city);
  requireNonBlank("contactPhone", next.contactPhone);
  requireSupportedLanguages(next.supportedLanguages);
  if (!COUNTRY_CODE_PATTERN.test(next.countryCode)) {
    throw invalidBusinessFieldError("countryCode", next.countryCode);
  }
  if (!CURRENCY_CODE_PATTERN.test(next.currencyCode)) {
    throw invalidBusinessFieldError("currencyCode", next.currencyCode);
  }
  if (next.timezone.trim().length === 0) {
    throw invalidBusinessFieldError("timezone", next.timezone);
  }

  return next;
}

export type TransitionBusinessStatusParams = {
  updatedAt: Date;
};

function assertTransitionPermitted(business: Business, to: BusinessStatus): void {
  if (business.status === "closed" && to !== "archived") {
    throw businessAlreadyClosedError(business.id);
  }
  if (business.status === "archived") {
    throw businessArchivedError(business.id);
  }
  if (!isValidBusinessStatusTransition(business.status, to)) {
    throw invalidBusinessStatusTransitionError(business.status, to);
  }
}

export function transitionBusinessStatus(
  business: Business,
  toStatus: BusinessStatus,
  params: TransitionBusinessStatusParams,
): { business: Business } {
  assertTransitionPermitted(business, toStatus);

  return {
    business: {
      ...business,
      status: toStatus,
      updatedAt: params.updatedAt,
    },
  };
}
