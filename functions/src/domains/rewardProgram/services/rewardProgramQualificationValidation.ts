/**
 * Business-owned qualification validation for Reward Program versions
 * (`PLATFORM-BASELINE-013B`, `DEC-LOY-016` /
 * `FD-REWARD-QUALIFYING-ITEM-001`).
 *
 * A Reward Program version qualifies through stable Business-owned
 * Qualifying Items (`qualifyingItemId`), never through canonical Commerce
 * Knowledge nodes. For every supplied id this validator establishes,
 * server-side:
 *
 *   1. the item exists;
 *   2. the item belongs to the Reward Program's Business (structural:
 *      `qualifyingItemRepository.getQualifyingItem` scopes every statement
 *      by `business_id`, so a foreign, fabricated, or malformed id is
 *      indistinguishable from an absent one -- `RESOURCE_NOT_FOUND`, no
 *      cross-Business existence disclosure);
 *   3. the item is eligible for a NEW qualification reference (it is
 *      `active` -- a retired item is terminal for new bindings, reported
 *      as `INVALID_STATE_TRANSITION`, a caller-actionable reason that
 *      reveals nothing beyond the caller's own Business);
 *   4. the item's optional Commerce Knowledge classification is copied as
 *      metadata only. Its existence, type, or lifecycle status does not
 *      affect Business-owned qualification; assignment-time validation is
 *      owned by the Qualifying Item commands.
 *
 * On success returns the frozen snapshots the caller's persistence layer
 * stores on the version's junction rows (`itemNameAtVersion` from the
 * item's CURRENT name, `knowledgeNodeIdAtVersion` from its CURRENT
 * optional classification). A later rename/remap/retire of the live item
 * never alters an already-persisted snapshot.
 *
 * Retirement never breaks an already-existing version: this validator runs
 * only on the draft add/change path (create, draft update, next-version)
 * and at publish time (re-validation of the draft's CURRENT bindings).
 * Reading a historical version never consults `qualifying_items.status`.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { getQualifyingItem } from "../../qualifyingItem/repositories/qualifyingItemRepository";
import { isWellFormedQualifyingItemId } from "../../qualifyingItem/models/qualifyingItem";
import type { QualifyingItemRef } from "../models/rewardProgram";
import {
  invalidQualifyingItemReferenceError,
  qualifyingItemReferenceNotActiveError,
  qualifyingItemReferenceNotFoundError,
} from "../models/rewardProgramErrors";

type Queryable = PoolClient | PlatformPostgresPool;

/**
 * Validates `qualifyingItemIds` for a NEW binding on `businessId`'s Reward
 * Program and resolves each id to its frozen snapshot. Throws without
 * disclosing cross-Business existence. Pure orchestration over the
 * Business-isolated repository -- no weaker lookup is duplicated here.
 */
export async function resolveQualifyingItemSnapshots(
  queryable: Queryable,
  businessId: string,
  qualifyingItemIds: readonly string[],
): Promise<QualifyingItemRef[]> {
  const seen = new Set<string>();
  const snapshots: QualifyingItemRef[] = [];
  for (const qualifyingItemId of qualifyingItemIds) {
    if (seen.has(qualifyingItemId)) {
      throw invalidQualifyingItemReferenceError(
        qualifyingItemId,
        "duplicate reference in one version",
      );
    }
    seen.add(qualifyingItemId);

    if (!isWellFormedQualifyingItemId(qualifyingItemId)) {
      throw qualifyingItemReferenceNotFoundError();
    }
    // Business-scoped by construction: a foreign id matches zero rows,
    // exactly like a fabricated one.
    const item = await getQualifyingItem(queryable, businessId, qualifyingItemId);
    if (!item) {
      throw qualifyingItemReferenceNotFoundError();
    }
    if (item.status !== "active") {
      throw qualifyingItemReferenceNotActiveError();
    }

    snapshots.push({
      qualifyingItemId: item.id,
      itemNameAtVersion: item.name,
      knowledgeNodeIdAtVersion: item.knowledgeNodeId,
    });
  }
  return snapshots;
}
