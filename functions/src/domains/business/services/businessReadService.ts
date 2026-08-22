/**
 * Business hydration read transport (`ENG-P3-002A`, design §9/§10/§14/§37.7).
 *
 * Two bounded reads, both server-derived, never trusting a client-supplied
 * id alone as proof of access (§25):
 *
 *   - `getOwnedBusinesses` — every Business the authenticated caller owns
 *     (§9's "list Businesses available to the authenticated Customer
 *     Identity", Phase D/E). A small summary DTO, not the full aggregate.
 *   - `getBusinessContext` — the full onboarding-hydration DTO for one
 *     Business, re-verifying the caller's membership before returning
 *     anything (§9/§21/§25/§38's whole resume-scenario proof depends on
 *     this read being both complete and correctly scoped).
 *
 * Neither function is a generic `getBusinessById` — `getBusinessContext`
 * always re-derives the caller's authorized relationship to `businessId`
 * server-side (`resolveAuthorizedBusinessForRead`) before reading anything
 * else; a caller-supplied id alone never establishes access (Phase D).
 *
 * DTOs deliberately omit `ownerUserId`, `subscriptionId`, `schemaVersion`,
 * `createdAt`/`updatedAt` (§14) — internal/audit fields the onboarding UI
 * has no documented need for.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  listBusinessesByOwner,
  readDefaultBranchForBusiness,
} from "../repositories/businessRepository";
import { readBusinessTermsAcceptance } from "../repositories/businessTermsAcceptanceRepository";
import { resolveAuthorizedBusinessForRead } from "./businessCallerAuthority";
import { getCurrentlyRequiredBusinessTermsVersion } from "../../../config/businessTermsConfig";
import type { Business } from "../models/business";
import type { BusinessBranch } from "../models/businessBranch";
import type { BusinessStatus } from "../models/businessStatus";

/** §9/Phase E's bounded summary DTO — used by `getOwnedBusinesses`. */
export type OwnedBusinessSummary = {
  businessId: string;
  businessCode: string;
  displayName: string;
  status: BusinessStatus;
  primaryCategoryId: string;
  businessTypeId?: string;
};

function toOwnedBusinessSummary(business: Business): OwnedBusinessSummary {
  return {
    businessId: business.id,
    businessCode: business.businessCode,
    displayName: business.displayName,
    status: business.status,
    primaryCategoryId: business.primaryCategoryId,
    businessTypeId: business.businessTypeId,
  };
}

/**
 * §9's "list Businesses available to the authenticated Customer Identity."
 * Server-derived exclusively from `ownerUserId` (`listBusinessesByOwner`) —
 * never a client-supplied filter. Returns `[]`, never an error, for an
 * identity with no Business yet (§38 scenario 1).
 */
export async function getOwnedBusinesses(
  db: Firestore,
  ownerUserId: string,
): Promise<OwnedBusinessSummary[]> {
  const businesses = await listBusinessesByOwner(db, ownerUserId);
  return businesses.map(toOwnedBusinessSummary);
}

export type BusinessContextBranch = {
  branchId: string;
  displayName: string;
  countryCode: string;
  city: string;
  address?: string;
};

export type BusinessContextTermsAcceptance = {
  accepted: boolean;
  version?: string;
  acceptedAt?: string;
};

/** §14's bounded onboarding-hydration DTO, extended with §37.7's `termsAcceptance` projection. */
export type BusinessContext = {
  businessId: string;
  businessCode: string;
  displayName: string;
  status: BusinessStatus;
  primaryCategoryId: string;
  businessTypeId?: string;
  countryCode: string;
  city: string;
  contactPhone: string;
  contactEmail?: string;
  branch: BusinessContextBranch | null;
  termsAcceptance: BusinessContextTermsAcceptance;
};

function toBranchDto(branch: BusinessBranch | null): BusinessContextBranch | null {
  if (!branch) return null;
  return {
    branchId: branch.id,
    displayName: branch.displayName,
    countryCode: branch.countryCode,
    city: branch.city,
    address: branch.address,
  };
}

/**
 * §37.7: computed server-side by comparing the stored acceptance record's
 * `termsVersion` against the server's currently-configured required
 * version (`businessTermsConfig.ts`) — never left for the client to
 * reconstruct. If no current version is configured at all, `accepted` is
 * always `false` (fail closed, §37.9/Phase Q — there is nothing to have
 * accepted yet).
 */
async function resolveTermsAcceptanceProjection(
  db: Firestore,
  businessId: string,
  ownerUserId: string,
): Promise<BusinessContextTermsAcceptance> {
  const currentVersion = getCurrentlyRequiredBusinessTermsVersion();
  if (!currentVersion) {
    return { accepted: false };
  }
  const acceptance = await readBusinessTermsAcceptance(db, businessId, ownerUserId, currentVersion);
  if (!acceptance) {
    return { accepted: false };
  }
  return {
    accepted: true,
    version: acceptance.termsVersion,
    acceptedAt: acceptance.acceptedAt.toISOString(),
  };
}

/**
 * §9's "get authorized Business onboarding summary" + §9's "get default
 * Branch summary," combined into the one bounded read §9/§30 specify
 * ("one bounded Business-hydration read, not a scatter of micro-endpoints").
 * `userId` is the server-resolved authenticated caller — the Terms
 * projection is evaluated against *this* caller's own acceptance record
 * (owner-scoped, §37.8), not against any acceptance record belonging to a
 * different identity in the same Business.
 */
export async function getBusinessContext(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<BusinessContext> {
  const { business } = await resolveAuthorizedBusinessForRead(db, userId, businessId);
  const branch = await readDefaultBranchForBusiness(db, businessId);
  const termsAcceptance = await resolveTermsAcceptanceProjection(
    db,
    businessId,
    business.ownerUserId,
  );

  return {
    businessId: business.id,
    businessCode: business.businessCode,
    displayName: business.displayName,
    status: business.status,
    primaryCategoryId: business.primaryCategoryId,
    businessTypeId: business.businessTypeId,
    countryCode: business.countryCode,
    city: business.city,
    contactPhone: business.contactPhone,
    contactEmail: business.contactEmail,
    branch: toBranchDto(branch),
    termsAcceptance,
  };
}
