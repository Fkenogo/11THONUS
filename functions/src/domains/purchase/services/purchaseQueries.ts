/**
 * Purchase read models (`PLATFORM-BASELINE-006A`, design §21).
 *
 * Minimum approved reads, all server-authorized; reads never create or
 * repair records:
 * - Business (membership-gated, same-Business enforced — no
 *   cross-Business leakage): `listPurchasesForBusiness`,
 *   `getPurchaseRecordForBusiness` (with lifecycle timeline).
 * - Customer (ownership-scoped — no cross-Customer leakage):
 *   `listPurchasesWaitingForCustomer` ("Waiting for You"),
 *   `getPurchaseRecordForCustomer` (with timeline),
 *   `listAvailableRewardsForCustomer` (minimum reward read, no redemption
 *   surface).
 * - Business Reward / Loyalty-Cycle visibility
 *   (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`; Owner/Manager only, same-
 *   Business enforced in SQL): `listAvailableRewardsForBusiness`,
 *   `listLoyaltyCycleProgressForBusiness`. Read-only — no redemption,
 *   fulfilment, or state transition of any kind.
 *
 * Stable deterministic ordering everywhere (`created_at DESC, id DESC`;
 * events `occurred_at ASC, id ASC`); limit/offset pagination with bounded
 * limits.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import {
  authorizeBusinessLoyaltyVisibilityRead,
  authorizeBusinessPurchaseRead,
  authorizeBusinessReviewQueueRead,
  hasBusinessReviewAuthority,
} from "./purchaseAuthorization";
import {
  listAvailableRewardsForBusinessRows,
  listCurrentCycleProgressForBusinessRows,
} from "../repositories/businessLoyaltyVisibilityRepository";
import type {
  BusinessAvailableReward,
  BusinessLoyaltyCycleProgress,
} from "../models/businessLoyaltyVisibility";
import {
  getPurchaseRecordById,
  listBusinessReviewQueue as listBusinessReviewQueueRows,
  listPurchaseRecordEvents,
  listPurchaseRecordsForBusiness,
  listWaitingPurchasesForCustomer,
} from "../repositories/purchaseRecordRepository";
import { listAvailableRewardsForCustomer as listAvailableRewardRows } from "../repositories/loyaltyCycleRepository";
import type {
  PurchaseRecordEventRow,
  PurchaseRecordRow,
  PurchaseStatus,
  RewardRow,
} from "../models/purchase";
import {
  PurchaseDomainError,
  purchaseNotFoundError,
  purchaseOwnershipError,
  purchaseValidationError,
} from "../models/purchaseErrors";

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;

function parsePagination(params: {
  readonly limit?: number | null;
  readonly offset?: number | null;
}): {
  readonly limit: number;
  readonly offset: number;
} {
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const offset = params.offset ?? 0;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
    throw new PurchaseDomainError(
      "VALIDATION_FAILED",
      `List limit must be an integer between 1 and ${MAX_LIST_LIMIT}.`,
    );
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new PurchaseDomainError(
      "VALIDATION_FAILED",
      "List offset must be a non-negative integer.",
    );
  }
  return { limit, offset };
}

const PURCHASE_STATUSES: readonly string[] = [
  "waiting_for_customer",
  "business_review_required",
  "pending_admission",
  "verified",
  "rejected",
  "under_review",
  "corrected",
  "cancelled",
  "expired",
  "archived",
];

function parseStatusFilter(value: unknown): PurchaseStatus | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string" && (PURCHASE_STATUSES as readonly string[]).includes(value)) {
    return value as PurchaseStatus;
  }
  throw purchaseValidationError("Unknown Purchase status filter.");
}

export async function listPurchasesForBusiness(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly status?: unknown;
    readonly limit?: number | null;
    readonly offset?: number | null;
  },
): Promise<{ readonly purchases: PurchaseRecordRow[] }> {
  await authorizeBusinessPurchaseRead(db, params.userId, params.businessId);
  const { limit, offset } = parsePagination(params);
  const status = parseStatusFilter(params.status);
  // The Business Review queue is protected by `purchase.businessReview`: the generic list must never
  // be a side door to it (`EA-BL-001-CORR-002-BR`). Reviewers may filter to it; everyone else is
  // refused that filter and never sees review-required rows in an unfiltered list.
  const reviewer = await hasBusinessReviewAuthority(db, params.userId, params.businessId);
  if (status === "business_review_required" && !reviewer) {
    await authorizeBusinessReviewQueueRead(db, params.userId, params.businessId); // throws AUTH_FORBIDDEN
  }
  const purchases = await listPurchaseRecordsForBusiness(pool, params.businessId, {
    status,
    excludeBusinessReview: !reviewer,
    limit,
    offset,
  });
  return {
    purchases: reviewer ? purchases : purchases.map(redactReviewAttributionForNonReviewer),
  };
}

/**
 * A caller without Business Review authority never receives reviewer identity, decision time or the
 * review reason (the outcome stays visible through `status`).
 */
function redactReviewAttributionForNonReviewer(purchase: PurchaseRecordRow): PurchaseRecordRow {
  return {
    ...purchase,
    businessReviewDecision: null,
    businessReviewReviewerUserId: null,
    businessReviewDecidedAt: null,
    businessReviewReason: null,
  };
}

function redactReviewEventForNonReviewer(event: PurchaseRecordEventRow): PurchaseRecordEventRow {
  const involvesReview =
    event.fromStatus === "business_review_required" ||
    event.toStatus === "business_review_required" ||
    (event.eventPayload !== null && "decision" in event.eventPayload);
  if (!involvesReview) {
    return event;
  }
  return { ...event, actorId: "business", reason: null, eventPayload: null };
}

export type PurchaseRecordDetail = {
  readonly purchase: PurchaseRecordRow;
  readonly events: PurchaseRecordEventRow[];
};

export async function getPurchaseRecordForBusiness(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly purchaseRecordId: string;
  },
): Promise<PurchaseRecordDetail> {
  await authorizeBusinessPurchaseRead(db, params.userId, params.businessId);
  const purchase = await getPurchaseRecordById(pool, params.purchaseRecordId);
  if (!purchase || purchase.businessId !== params.businessId) {
    throw purchaseNotFoundError(params.purchaseRecordId);
  }
  const reviewer = await hasBusinessReviewAuthority(db, params.userId, params.businessId);
  if (!reviewer && purchase.status === "business_review_required") {
    // Same boundary as the list: a non-reviewer cannot read a protected review-queue Purchase by id.
    throw purchaseNotFoundError(params.purchaseRecordId);
  }
  const events = await listPurchaseRecordEvents(pool, purchase.id);
  return reviewer
    ? { purchase, events }
    : {
        purchase: redactReviewAttributionForNonReviewer(purchase),
        events: events.map(redactReviewEventForNonReviewer),
      };
}

/**
 * Business Review queue (`EA-BL-001-CORR-002-BR`): the Business's Purchases awaiting an Owner/Manager
 * decision, oldest first, bounded and paginated. Gated by the SAME live `purchase.businessReview`
 * evaluation as the decision commands, so Staff, a Manager whose authority was revoked, a Platform
 * Administrator and a Customer all fail closed. Each row carries the review context (item, quantity,
 * recorder + role, timestamps, program/version); per-purchase history is the existing
 * `getPurchaseRecordForBusiness` timeline (lifecycle events). Read-only: never creates, repairs or
 * decides anything. The Business scope comes from the authorized `businessId`, enforced in SQL.
 */
export async function listBusinessReviewQueue(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly limit?: number | null;
    readonly offset?: number | null;
  },
): Promise<{ readonly purchases: PurchaseRecordRow[] }> {
  await authorizeBusinessReviewQueueRead(db, params.userId, params.businessId);
  const { limit, offset } = parsePagination(params);
  const purchases = await listBusinessReviewQueueRows(pool, params.businessId, { limit, offset });
  return { purchases };
}

/**
 * Customer-facing status token for a Purchase awaiting Business Review. The internal
 * `business_review_required` name is never exposed to a Customer; the client maps this neutral token
 * to "Waiting for business confirmation" / "En attente de confirmation du commerce".
 */
export const CUSTOMER_AWAITING_BUSINESS_CONFIRMATION = "awaiting_business_confirmation" as const;

function customerFacingStatus(status: PurchaseStatus): string {
  return status === "business_review_required" ? CUSTOMER_AWAITING_BUSINESS_CONFIRMATION : status;
}

/**
 * Customer view of a Purchase: strips Business Review internals (reviewer identity, decision time,
 * rejection reason, threshold evidence) and renames the internal review status. A Customer never
 * learns who reviewed, why, or any threshold.
 */
export function redactPurchaseForCustomer(purchase: PurchaseRecordRow): PurchaseRecordRow {
  return {
    ...purchase,
    status: customerFacingStatus(purchase.status) as PurchaseStatus,
    businessReviewDecision: null,
    businessReviewReviewerUserId: null,
    businessReviewDecidedAt: null,
    businessReviewReason: null,
  };
}

function redactEventForCustomer(event: PurchaseRecordEventRow): PurchaseRecordEventRow {
  const involvesReview =
    event.fromStatus === "business_review_required" ||
    event.toStatus === "business_review_required" ||
    (event.eventPayload !== null && "decision" in event.eventPayload);
  if (!involvesReview) {
    return event;
  }
  return {
    ...event,
    fromStatus:
      event.fromStatus === null ? null : (customerFacingStatus(event.fromStatus) as PurchaseStatus),
    toStatus: customerFacingStatus(event.toStatus) as PurchaseStatus,
    actorId: "business",
    reason: null,
    eventPayload: null,
  };
}

export async function listPurchasesWaitingForCustomer(
  pool: PlatformPostgresPool,
  params: {
    readonly customerIdentityId: string;
    readonly limit?: number | null;
    readonly offset?: number | null;
  },
): Promise<{ readonly purchases: PurchaseRecordRow[] }> {
  const { limit, offset } = parsePagination(params);
  const purchases = await listWaitingPurchasesForCustomer(pool, params.customerIdentityId, {
    limit,
    offset,
  });
  // After a Business approval the row is `waiting_for_customer` again but still carries reviewer
  // attribution: every customer-facing row is redacted exactly like the detail read.
  return { purchases: purchases.map(redactPurchaseForCustomer) };
}

export async function getPurchaseRecordForCustomer(
  pool: PlatformPostgresPool,
  params: { readonly customerIdentityId: string; readonly purchaseRecordId: string },
): Promise<PurchaseRecordDetail> {
  const purchase = await getPurchaseRecordById(pool, params.purchaseRecordId);
  if (!purchase) {
    throw purchaseNotFoundError(params.purchaseRecordId);
  }
  if (purchase.customerIdentityId !== params.customerIdentityId) {
    throw purchaseOwnershipError();
  }
  const events = await listPurchaseRecordEvents(pool, purchase.id);
  return {
    purchase: redactPurchaseForCustomer(purchase),
    events: events.map(redactEventForCustomer),
  };
}

export async function listAvailableRewardsForCustomer(
  pool: PlatformPostgresPool,
  params: { readonly customerIdentityId: string },
): Promise<{ readonly rewards: RewardRow[] }> {
  const rewards = await listAvailableRewardRows(pool, params.customerIdentityId);
  return { rewards };
}

function parseRewardProgramFilter(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  throw purchaseValidationError("Reward Program filter must be a non-empty string.");
}

/**
 * Available Rewards held by Customers of the calling Business
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`). Owner/Manager only; the
 * Business scope comes from the authorized `businessId`, never from row
 * data, and the SQL itself is anchored on that Business.
 */
export async function listAvailableRewardsForBusiness(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly rewardProgramId?: unknown;
    readonly limit?: number | null;
    readonly offset?: number | null;
  },
): Promise<{ readonly rewards: BusinessAvailableReward[] }> {
  await authorizeBusinessLoyaltyVisibilityRead(db, params.userId, params.businessId);
  const { limit, offset } = parsePagination(params);
  const rewards = await listAvailableRewardsForBusinessRows(pool, params.businessId, {
    rewardProgramId: parseRewardProgramFilter(params.rewardProgramId),
    limit,
    offset,
  });
  return { rewards };
}

/**
 * Each Customer's current Loyalty Cycle progress for the calling Business's
 * Reward Programs (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`). Owner/Manager
 * only; derived entirely from the authoritative PostgreSQL loyalty spine.
 */
export async function listLoyaltyCycleProgressForBusiness(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly rewardProgramId?: unknown;
    readonly limit?: number | null;
    readonly offset?: number | null;
  },
): Promise<{ readonly cycles: BusinessLoyaltyCycleProgress[] }> {
  await authorizeBusinessLoyaltyVisibilityRead(db, params.userId, params.businessId);
  const { limit, offset } = parsePagination(params);
  const cycles = await listCurrentCycleProgressForBusinessRows(pool, params.businessId, {
    rewardProgramId: parseRewardProgramFilter(params.rewardProgramId),
    limit,
    offset,
  });
  return { cycles };
}
