/**
 * `BusinessBranch` value type (`ENG-P2-002A`).
 *
 * The Founder-approved MVP shape exactly (`ENG-P2-002-DESIGN-001` §5.3,
 * §24 FD-1) — `id`, `businessId`, `displayName`, `countryCode`, `city`,
 * `address?`, `createdAt`, `updatedAt`, `schemaVersion`. Deliberately has
 * **no** `isPrimary`, branch-specific `timezone`, independent `status`,
 * or `branchCode` field — FD-1 explicitly excludes all four from MVP
 * (see `businessBranch.test.ts`'s negative-shape assertions).
 *
 * Single-branch cardinality (exactly one branch per business) and atomic
 * co-creation with the business are `ENG-P2-002B`-owned invariants (§5.4,
 * §13.1) — this module constructs one valid branch value; it does not
 * enforce cardinality, since that requires knowledge of other branches,
 * which requires persistence this domain-foundation layer does not have.
 */

import { invalidBusinessBranchFieldError } from "./businessErrors";

export type BusinessBranch = {
  readonly id: string;
  readonly businessId: string;
  displayName: string;
  countryCode: string;
  city: string;
  address?: string;
  readonly createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
};

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

export type CreateBusinessBranchParams = {
  id: string;
  businessId: string;
  displayName: string;
  countryCode: string;
  city: string;
  address?: string;
  createdAt: Date;
};

function requireNonBlank(field: string, value: string): string {
  if (value.trim().length === 0) {
    throw invalidBusinessBranchFieldError(field, value);
  }
  return value;
}

export function createBusinessBranch(params: CreateBusinessBranchParams): BusinessBranch {
  const id = requireNonBlank("id", params.id);
  const businessId = requireNonBlank("businessId", params.businessId);
  const displayName = requireNonBlank("displayName", params.displayName);
  const city = requireNonBlank("city", params.city);

  if (!COUNTRY_CODE_PATTERN.test(params.countryCode)) {
    throw invalidBusinessBranchFieldError("countryCode", params.countryCode);
  }

  return {
    id,
    businessId,
    displayName,
    countryCode: params.countryCode,
    city,
    address: params.address,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    schemaVersion: 1,
  };
}

/**
 * `ENG-P2-002C` (Phase E). No `id`/`businessId`/`createdAt`/`schemaVersion`
 * key — all immutable-by-this-command, structurally prevented the same way
 * `business.ts`'s `UpdateBusinessProfileParams` prevents `id`/`businessCode`/
 * `ownerUserId`. Only the MVP-mutable location fields (`displayName`,
 * `countryCode`, `city`, `address`) are patchable.
 */
export type UpdateBusinessBranchProfileParams = {
  displayName?: string;
  countryCode?: string;
  city?: string;
  address?: string;
  updatedAt: Date;
};

/** Merges the supplied fields and re-validates the resulting whole state (Phase S). */
export function updateBusinessBranchProfile(
  branch: BusinessBranch,
  params: UpdateBusinessBranchProfileParams,
): BusinessBranch {
  const next: BusinessBranch = {
    ...branch,
    displayName: params.displayName !== undefined ? params.displayName : branch.displayName,
    countryCode: params.countryCode !== undefined ? params.countryCode : branch.countryCode,
    city: params.city !== undefined ? params.city : branch.city,
    address: "address" in params ? params.address : branch.address,
    updatedAt: params.updatedAt,
  };

  requireNonBlank("displayName", next.displayName);
  requireNonBlank("city", next.city);
  if (!COUNTRY_CODE_PATTERN.test(next.countryCode)) {
    throw invalidBusinessBranchFieldError("countryCode", next.countryCode);
  }

  return next;
}
