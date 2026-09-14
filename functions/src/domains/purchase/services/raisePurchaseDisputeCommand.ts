/**
 * `raisePurchaseDispute` command (`PLATFORM-BASELINE-006A`, design §§14/16,
 * FD-PVL-004).
 *
 * Customer-authenticated, `waiting_for_customer` → `under_review` with a
 * mandatory dispute reason. No Verified Units. `under_review` is a safe
 * durable holding state in 006A — Business-side dispute review/correction
 * belongs to a later package (`PLATFORM-BASELINE-006B` or equivalent), so
 * no customer command exits `under_review` in this package. Never silently
 * redirected into rejection: its own command, event, Trust Event,
 * Notification Intent, and outbox entry, all in one transaction.
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
  transitionPurchaseToUnderReview,
  appendPurchaseRecordEvent,
} from "../repositories/purchaseRecordRepository";
import { insertTrustEvent } from "../repositories/trustEventRepository";
import {
  insertNotificationIntent,
  writePurchaseOutboxEntry,
} from "../repositories/purchaseOutboxRepository";
import type { PurchaseDisputeReason, PurchaseRecordRow } from "../models/purchase";
import { PURCHASE_DISPUTE_REASONS } from "../models/purchase";
import {
  purchaseNotFoundError,
  purchaseOwnershipError,
  purchaseStaleStateError,
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseValidationError,
} from "../models/purchaseErrors";

export type RaisePurchaseDisputeResult = {
  readonly purchase: PurchaseRecordRow;
};

function parseDisputeReason(value: unknown): PurchaseDisputeReason {
  if (
    typeof value === "string" &&
    (PURCHASE_DISPUTE_REASONS as readonly string[]).includes(value)
  ) {
    return value as PurchaseDisputeReason;
  }
  throw purchaseValidationError(
    "A dispute reason is required: wrong_quantity, wrong_item, or partially_inaccurate.",
  );
}

export async function raisePurchaseDispute(
  _db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    /** Server-resolved Customer Identity id (current auth chain — never a client claim). */
    readonly customerIdentityId: string;
    readonly request: { readonly purchaseRecordId: string; readonly reason: unknown };
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<RaisePurchaseDisputeResult> {
  const purchaseRecordId = params.request.purchaseRecordId;
  if (!purchaseRecordId || purchaseRecordId.trim().length === 0) {
    throw purchaseValidationError("A Purchase Record id is required.");
  }
  const reason = parseDisputeReason(params.request.reason);

  const requestHash = purchaseRequestHash(
    "dispute",
    params.customerIdentityId,
    "",
    purchaseRecordId,
    `${purchaseRecordId}:${reason}`,
  );
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as RaisePurchaseDisputeResult;
  }

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "purchase.dispute",
      actorId: params.customerIdentityId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as RaisePurchaseDisputeResult;
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

    const purchase = await transitionPurchaseToUnderReview(tx, {
      purchaseId: purchaseRecordId,
      reason,
    });
    if (!purchase) {
      throw purchaseStaleStateError("waiting_for_customer", locked.status);
    }

    const disputeEvent = await appendPurchaseRecordEvent(tx, {
      purchaseRecordId: purchase.id,
      fromStatus: "waiting_for_customer",
      toStatus: "under_review",
      actorType: "customer",
      actorId: params.customerIdentityId,
      reason,
      eventPayload: null,
      correlationId: params.correlationId,
    });

    await insertTrustEvent(tx, {
      eventType: "purchase.disputed",
      causalPurchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: disputeEvent.id,
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
      intentType: "purchase_disputed_business",
      purchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: disputeEvent.id,
      recipientType: "business",
      recipientId: purchase.businessId,
      payload: { purchaseRecordId: purchase.id, reason },
      correlationId: params.correlationId,
    });

    await writePurchaseOutboxEntry(tx, {
      eventType: "purchase_disputed",
      aggregateId: purchase.id,
      payload: { businessId: purchase.businessId, purchaseRecordId: purchase.id, reason },
      actorId: params.customerIdentityId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    const result: RaisePurchaseDisputeResult = { purchase };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, purchase.id, result);
    return result;
  });
}
