/**
 * Business bootstrap request/context/result contracts (`ENG-P2-002A`, §19,
 * §10.3, §24 FD-2).
 *
 * Bounded domain-level contracts only — no endpoint, no service, no
 * Firestore, no evaluator call (§10.1's structural problem: business
 * creation cannot be gated by `ENG-P2-004` because no business exists
 * yet). `ENG-P2-002B` implements the actual callable/service that
 * resolves a `BootstrapContext` from an authenticated request and calls
 * `buildBootstrapBusinessInput`.
 *
 * The security-critical property (§11, §24 FD-2 item 4: "the client
 * cannot choose or override `ownerUserId`") is enforced structurally, not
 * just by convention: `CreateBusinessRequest` — the client-supplied
 * shape — has no `ownerUserId` field in its type at all, so a caller
 * cannot even express owner authority through this contract's own
 * TypeScript shape. `ownerUserId` exists only on `BootstrapContext`,
 * which `ENG-P2-002B` must derive from the server-verified authenticated
 * principal (§10.3 steps 2-4) — never from client input.
 *
 * `BootstrapContext.businessCode` is likewise not a request field: it is
 * produced by `002B`'s transactional reservation against the
 * `businessCode` candidate-generator port (`businessCodeGenerator.ts`),
 * never chosen by the client. Same treatment for `businessId`/`branchId`
 * (Firestore-generated identifiers, §10.3/persistence-layer concern) and
 * `now` (server time, TRD10 §10.2 DAP-008).
 */

import { createBusiness, type Business } from "./business";
import { createBusinessBranch, type BusinessBranch } from "./businessBranch";

/** The client-supplied registration fields (PRD3 §6) — deliberately has no `ownerUserId` key. */
export type CreateBusinessRequest = {
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
};

/**
 * Everything `002B` must derive server-side before calling
 * `buildBootstrapBusinessInput` — none of this comes from client input.
 */
export type BootstrapContext = {
  /** Derived from the server-verified authenticated principal (§10.3 steps 2-4) — never client-supplied. */
  ownerUserId: string;
  /** Firestore-generated document id for the new business (persistence-layer concern, §10.3). */
  businessId: string;
  /** Firestore-generated document id for the auto-created branch (§5.4). */
  branchId: string;
  /** Reserved via `002B`'s transactional uniqueness check against the candidate-generator port — never client-chosen. */
  businessCode: string;
  /** Server time (TRD10 §10.2 DAP-008), not client-supplied. */
  now: Date;
};

export type BootstrapBusinessInput = {
  business: Business;
  branch: BusinessBranch;
};

/**
 * Pure domain construction only — no Firestore write, no transaction, no
 * idempotency, no outbox (`002B`'s). Produces a valid `Business` (always
 * `draft`, §6) and its auto-created `BusinessBranch` (§5.4), the branch
 * defaulting its `displayName`/`countryCode`/`city` from the business at
 * creation (§5.3).
 */
export function buildBootstrapBusinessInput(
  request: CreateBusinessRequest,
  context: BootstrapContext,
): BootstrapBusinessInput {
  const business = createBusiness({
    id: context.businessId,
    businessCode: context.businessCode,
    ownerUserId: context.ownerUserId,
    legalName: request.legalName,
    displayName: request.displayName,
    primaryCategoryId: request.primaryCategoryId,
    businessTypeId: request.businessTypeId,
    countryCode: request.countryCode,
    currencyCode: request.currencyCode,
    timezone: request.timezone,
    city: request.city,
    address: request.address,
    contactPhone: request.contactPhone,
    contactEmail: request.contactEmail,
    logoUrl: request.logoUrl,
    supportedLanguages: request.supportedLanguages,
    subscriptionId: request.subscriptionId,
    createdAt: context.now,
  });

  const branch = createBusinessBranch({
    id: context.branchId,
    businessId: business.id,
    displayName: business.displayName,
    countryCode: business.countryCode,
    city: business.city,
    createdAt: context.now,
  });

  return { business, branch };
}

/** The bootstrap command's response shape (§19) — an implementation-level artifact `002B` may refine. */
export type CreateBusinessResult = {
  businessId: string;
  businessCode: string;
  branchId: string;
  status: Business["status"];
};

export function toCreateBusinessResult(input: BootstrapBusinessInput): CreateBusinessResult {
  return {
    businessId: input.business.id,
    businessCode: input.business.businessCode,
    branchId: input.branch.id,
    status: input.business.status,
  };
}
