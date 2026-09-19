/**
 * Qualifying Item commands (`PLATFORM-BASELINE-013A.2`): create, update
 * (rename and/or optional classification), retire.
 *
 * Every command:
 *   1. authorizes `qualifyingItem.manage` server-side via `evaluatePermission`
 *      (Owner/Manager; never Staff; no Platform Administrator path);
 *   2. validates the request (name; the optional Commerce Knowledge
 *      classification ONLY when one is supplied);
 *   3. runs the mutation inside one PostgreSQL transaction together with its
 *      idempotency reservation, so a retry never double-applies.
 *
 * Business ownership is structural: the repository scopes every statement by
 * `businessId`, so an item of another Business is indistinguishable from an
 * absent one (`RESOURCE_NOT_FOUND`).
 *
 * Lifecycle is retirement, never deletion: `retire` moves `active ->
 * retired`; a retired item is terminal and read-only. Not implemented here,
 * by design: Reward Program version binding (`PLATFORM-BASELINE-013B`).
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
} from "../../rewardProgram/repositories/idempotencyRepository";
import * as qualifyingItemRepository from "../repositories/qualifyingItemRepository";
import {
  isWellFormedQualifyingItemId,
  normalizeQualifyingItemName,
} from "../models/qualifyingItem";
import type { QualifyingItem } from "../models/qualifyingItem";
import {
  noEditableQualifyingItemFieldsError,
  qualifyingItemIdempotencyConflictError,
  qualifyingItemIdempotencyInProgressError,
  qualifyingItemNotActiveError,
  qualifyingItemNotFoundError,
} from "../models/qualifyingItemErrors";
import { authorizeQualifyingItemManage } from "./qualifyingItemAuthorization";
import { validateOptionalQualifyingItemKnowledgeNode } from "./qualifyingItemKnowledgeValidation";
import { qualifyingItemRequestHash } from "./qualifyingItemRequestHash";

type CommandContext = {
  readonly userId: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
};

export type CreateQualifyingItemRequest = {
  readonly businessId: string;
  readonly name: string;
  /** Optional Commerce Knowledge classification. Absent/`null` performs no Commerce Knowledge read. */
  readonly knowledgeNodeId?: string | null;
};

export async function createQualifyingItem(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: CommandContext & { readonly request: CreateQualifyingItemRequest },
): Promise<QualifyingItem> {
  const { request } = params;
  // Business lifecycle eligibility (trial/active) is enforced inside the
  // evaluator's per-class gate for the `qualifyingItem` catalogue.
  await authorizeQualifyingItemManage(db, params.userId, request.businessId);

  const name = normalizeQualifyingItemName(request.name);
  const knowledgeNodeId = request.knowledgeNodeId ?? null;
  await validateOptionalQualifyingItemKnowledgeNode(db, knowledgeNodeId);

  const requestHash = qualifyingItemRequestHash(
    "create",
    params.userId,
    request.businessId,
    request.businessId,
    JSON.stringify({ name, knowledgeNodeId }),
  );

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "qualifyingItem.create",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as QualifyingItem;
    }
    if (reservation.outcome === "in_progress") {
      throw qualifyingItemIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw qualifyingItemIdempotencyConflictError();
    }

    const item = await qualifyingItemRepository.insertQualifyingItem(tx, {
      businessId: request.businessId,
      name,
      knowledgeNodeId,
      actorId: params.userId,
    });
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, item.id, item);
    return item;
  });
}

export type UpdateQualifyingItemRequest = {
  readonly businessId: string;
  readonly qualifyingItemId: string;
  /** `undefined` leaves the name unchanged. */
  readonly name?: string;
  /** `undefined` leaves the classification unchanged; `null` clears it; a value sets it (validated). */
  readonly knowledgeNodeId?: string | null;
};

export async function updateQualifyingItem(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: CommandContext & { readonly request: UpdateQualifyingItemRequest },
): Promise<QualifyingItem> {
  const { request } = params;
  await authorizeQualifyingItemManage(db, params.userId, request.businessId);

  if (request.name === undefined && request.knowledgeNodeId === undefined) {
    throw noEditableQualifyingItemFieldsError();
  }
  const name = request.name === undefined ? undefined : normalizeQualifyingItemName(request.name);
  // Only a NEWLY supplied, non-null classification is validated; clearing it
  // or leaving it untouched never reads Commerce Knowledge, so a mapping
  // that was later retired there can never block an unrelated edit.
  await validateOptionalQualifyingItemKnowledgeNode(db, request.knowledgeNodeId);

  const requestHash = qualifyingItemRequestHash(
    "update",
    params.userId,
    request.businessId,
    request.qualifyingItemId,
    JSON.stringify({
      name: name ?? null,
      setClassification: request.knowledgeNodeId !== undefined,
      knowledgeNodeId: request.knowledgeNodeId ?? null,
    }),
  );

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "qualifyingItem.update",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as QualifyingItem;
    }
    if (reservation.outcome === "in_progress") {
      throw qualifyingItemIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw qualifyingItemIdempotencyConflictError();
    }

    const updated = await qualifyingItemRepository.updateQualifyingItem(tx, {
      businessId: request.businessId,
      id: request.qualifyingItemId,
      actorId: params.userId,
      name,
      knowledgeNodeId: request.knowledgeNodeId,
    });
    if (!updated) {
      throw await classifyMissingActiveItem(tx, request.businessId, request.qualifyingItemId);
    }
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, updated.id, updated);
    return updated;
  });
}

export type RetireQualifyingItemRequest = {
  readonly businessId: string;
  readonly qualifyingItemId: string;
};

export async function retireQualifyingItem(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: CommandContext & { readonly request: RetireQualifyingItemRequest },
): Promise<QualifyingItem> {
  const { request } = params;
  await authorizeQualifyingItemManage(db, params.userId, request.businessId);

  const requestHash = qualifyingItemRequestHash(
    "retire",
    params.userId,
    request.businessId,
    request.qualifyingItemId,
    "",
  );

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "qualifyingItem.retire",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as QualifyingItem;
    }
    if (reservation.outcome === "in_progress") {
      throw qualifyingItemIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw qualifyingItemIdempotencyConflictError();
    }

    const retired = await qualifyingItemRepository.retireQualifyingItem(tx, {
      businessId: request.businessId,
      id: request.qualifyingItemId,
      actorId: params.userId,
    });
    if (!retired) {
      throw await classifyMissingActiveItem(tx, request.businessId, request.qualifyingItemId);
    }
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, retired.id, retired);
    return retired;
  });
}

/**
 * A mutation matched no ACTIVE row owned by this Business. Distinguish the
 * two genuinely different reasons a caller may act on, using the same
 * Business-scoped read: the item exists for this Business but is retired
 * (terminal), or it does not exist for this Business at all -- absent,
 * fabricated, malformed, or owned by another Business, all deliberately
 * indistinguishable.
 */
async function classifyMissingActiveItem(
  tx: Parameters<typeof qualifyingItemRepository.getQualifyingItem>[0],
  businessId: string,
  qualifyingItemId: string,
): Promise<Error> {
  if (!isWellFormedQualifyingItemId(qualifyingItemId)) {
    return qualifyingItemNotFoundError();
  }
  const existing = await qualifyingItemRepository.getQualifyingItem(
    tx,
    businessId,
    qualifyingItemId,
  );
  return existing ? qualifyingItemNotActiveError() : qualifyingItemNotFoundError();
}
