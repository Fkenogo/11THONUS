/**
 * Qualifying Item reads (`PLATFORM-BASELINE-013A.2`).
 *
 * Membership-gated only -- no `qualifyingItem.manage`/`.view` permission
 * check (`DEC-LOY-017`: Staff may view and select a Business's items for
 * frontline transaction recording without being able to manage them).
 * Always scoped to the caller's own Business. Never creates, repairs, or
 * mutates data.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { listQualifyingItems as listQualifyingItemsForBusiness } from "../repositories/qualifyingItemRepository";
import type { QualifyingItemStatusFilter } from "../repositories/qualifyingItemRepository";
import type { QualifyingItem } from "../models/qualifyingItem";
import { QualifyingItemDomainError } from "../models/qualifyingItemErrors";
import { authorizeQualifyingItemRead } from "./qualifyingItemAuthorization";

const STATUS_FILTERS: readonly QualifyingItemStatusFilter[] = ["active", "retired", "all"];

export async function listQualifyingItems(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    /** Defaults to `active` -- the set a frontline operator selects from. */
    readonly statusFilter?: QualifyingItemStatusFilter;
  },
): Promise<readonly QualifyingItem[]> {
  await authorizeQualifyingItemRead(db, params.userId, params.businessId);
  const statusFilter = params.statusFilter ?? "active";
  if (!STATUS_FILTERS.includes(statusFilter)) {
    throw new QualifyingItemDomainError("VALIDATION_FAILED", "Unrecognised status filter.", [
      { field: "statusFilter", code: "invalid", messageKey: "qualifyingItem.statusFilter.invalid" },
    ]);
  }
  return listQualifyingItemsForBusiness(pool, params.businessId, statusFilter);
}
