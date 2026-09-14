/**
 * `rejectPurchase` command (`PLATFORM-BASELINE-006A`, design §§14/16).
 *
 * Customer-authenticated, `waiting_for_customer` → `rejected` with a
 * mandatory bounded reason. No Verified Units. Atomically writes the state
 * transition, lifecycle event, Trust Event, Business Notification Intent,
 * outbox entry, and idempotency completion in one transaction.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
  peekIdempotencyKey,
} from "../../rewardProgram/repositories/idempotencyRepository";
import { purchaseRequestHash } from "./purchaseRequestHash";
import {
  lockPurchaseRecordById,
  transitionPurchaseToRejected,
  appendPurchaseRecordEvent,
} from "../repositories/purchaseRecordRepository";
import { insertTrustEvent } from "../repositories/trustEventRepository";
import {
  insertNotificationIntent,
  writePurchaseOutboxEntry,
} from "../repositories/purchaseOutboxRepository";
import type { PurchaseRecordRow, PurchaseRejectReason } from "../models/purchase";
import { PURCHASE_REJECT_REASONS } from "../models/purchase";
import {
  purchaseNotFoundError,
  purchaseOwnershipError,
  purchaseStaleStateError,
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseValidationError,
} from "../models/purchaseErrors";

export type RejectPurchaseRequest = {
  readonly purchaseRecordId: string;
  readonly reason: PurchaseRejectReason;
};

export type RejectPurchaseResult = {
  readonly purchase: PurchaseRecordRow;
};

function parseRejectReason(value: unknown): PurchaseRejectReason {
  if (typeof value === "string" && (PURCHASE_REJECT_REASONS as readonly string[]).includes(value)) {
    return value as PurchaseRejectReason;
  }
  throw purchaseValidationError(
    "A rejection reason is required: did_not_happen, duplicate, wrong_customer, wrong_program, or wholly_invalid.",
  );
}

export async function rejectPurchase(
  _db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    /** Server-resolved Customer Identity id (current auth chain — never a client claim). */
    readonly customerIdentityId: string;
    readonly request: { readonly purchaseRecordId: string; readonly reason: unknown };
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<RejectPurchaseResult> {
  const purchaseRecordId = params.request.purchaseRecordId;
  if (!purchaseRecordId || purchaseRecordId.trim().length === 0) {
    throw purchaseValidationError("A Purchase Record id is required.");
  }
  const reason = parseRejectReason(params.request.reason);

  const requestHash = purchaseRequestHash(
    "reject",
    params.customerIdentityId,
    "",
    purchaseRecordId,
    `${purchaseRecordId}:${reason}`,
  );
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as RejectPurchaseResult;
  }

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "purchase.reject",
      actorId: params.customerIdentityId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as RejectPurchaseResult;
    }
    if (reservation.outcome === "in_progress") {
      throw purchaseIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw purchaseIdempotencyConflictError();
    }

    const locked = await lockPurchaseRecordById(tx, purchaseRecordId);
    if (!locked) {
      throw purchaseNotFoundError(purchaseRecordId);
    }
    if (locked.customerIdentityId !== params.customerIdentityId) {
      throw purchaseOwnershipError();
    }
    if (locked.status !== "waiting_for_customer") {
      throw purchaseStaleStateError("waiting_for_customer", locked.status);
    }

    const purchase = await transitionPurchaseToRejected(tx, {
      purchaseId: purchaseRecordId,
      reason,
    });
    if (!purchase) {
      throw purchaseStaleStateError("waiting_for_customer", locked.status);
    }

    const rejectEvent = await appendPurchaseRecordEvent(tx, {
      purchaseRecordId: purchase.id,
      fromStatus: "waiting_for_customer",
      toStatus: "rejected",
      actorType: "customer",
      actorId: params.customerIdentityId,
      reason,
      eventPayload: null,
      correlationId: params.correlationId,
    });

    await insertTrustEvent(tx, {
      eventType: "purchase.rejected",
      causalPurchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: rejectEvent.id,
      subjectType: "purchase_record",
      subjectId: purchase.id,
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      actorType: "customer",
      actorId: params.customerIdentityId,
      correlationId: params.correlationId,
      payload: { reason },
    });

    await insertNotificationIntent(tx, {
      intentType: "purchase_rejected_business",
      purchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: rejectEvent.id,
      recipientType: "business",
      recipientId: purchase.businessId,
      payload: { purchaseRecordId: purchase.id, reason },
      correlationId: params.correlationId,
    });

    await writePurchaseOutboxEntry(tx, {
      eventType: "purchase_rejected",
      aggregateId: purchase.id,
      payload: { businessId: purchase.businessId, purchaseRecordId: purchase.id, reason },
      actorId: params.customerIdentityId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    const result: RejectPurchaseResult = { purchase };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, purchase.id, result);
    return result;
  });
}
