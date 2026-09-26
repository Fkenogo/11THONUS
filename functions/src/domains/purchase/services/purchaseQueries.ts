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
  const purchases = await listPurchaseRecordsForBusiness(pool, params.businessId, {
    status: parseStatusFilter(params.status),
    limit,
    offset,
  });
  return { purchases };
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
  const events = await listPurchaseRecordEvents(pool, purchase.id);
  return { purchase, events };
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
  return { purchases };
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
  return { purchase, events };
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
