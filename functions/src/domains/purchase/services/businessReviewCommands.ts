/**
 * Business Review decision commands (`EA-BL-001-CORR-002-BR`, `DEC-PROD-015`).
 *
 * `approveBusinessReview` : `business_review_required` → `waiting_for_customer`
 * `rejectBusinessReview`  : `business_review_required` → `rejected` (distinct Business Review reason)
 *
 * Business Review happens BEFORE Customer verification. Approval makes the Purchase
 * customer-verifiable and NOTHING else: no Verified Unit, no Cycle allocation, no Reward, no
 * commercial admission, no customer-verification state — those still run only on the later customer
 * `verifyPurchase`, unchanged. Rejection is terminal and likewise creates no loyalty progress. The
 * commands never touch `under_review`, the commercial hold state, the customer `rejection_reason`, or
 * `bulk_review_threshold`.
 *
 * Pattern (same as the other purchase commands, lock order unchanged):
 *   live authority (audited) → idempotency peek → [BEGIN] reserve idempotency → purchase `FOR UPDATE`
 *   → Business scope + status precondition → self-review prohibition → live authority revalidation →
 *   conditional transition → lifecycle event → Trust Event → Notification Intents → outbox →
 *   idempotency completion → [COMMIT].
 *
 * Self-review: `reviewer_user_id != recorded_by_user_id`, no exception, no role exemption, no
 * sole-reviewer bypass (a single-owner Business whose Owner recorded the Purchase fails closed until a
 * second eligible reviewer exists — a future exception needs a separate Founder disposition). The
 * database independently refuses a self-review via a CHECK constraint.
 *
 * The reviewer is ALWAYS the server-resolved authenticated member; the Business scope is proven against
 * the locked row. A purchase of another Business is indistinguishable from a missing one.
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
import { authorizePurchaseBusinessReview } from "./purchaseAuthorization";
import { isReservedIdempotencyKey } from "./purchaseAdmissionPort";
import {
  appendPurchaseRecordEvent,
  lockPurchaseRecordById,
  transitionPurchaseBusinessReviewApproved,
  transitionPurchaseBusinessReviewRejected,
} from "../repositories/purchaseRecordRepository";
import { insertTrustEvent } from "../repositories/trustEventRepository";
import {
  insertNotificationIntent,
  writePurchaseOutboxEntry,
} from "../repositories/purchaseOutboxRepository";
import type {
  BusinessReviewDecision,
  BusinessReviewRejectReason,
  PurchaseRecordRow,
} from "../models/purchase";
import { BUSINESS_REVIEW_REJECT_REASONS } from "../models/purchase";
import {
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseNotFoundError,
  purchaseSelfReviewError,
  purchaseStaleStateError,
  purchaseValidationError,
} from "../models/purchaseErrors";

const MAX_REVIEW_NOTE_LENGTH = 500;

export type BusinessReviewDecisionResult = {
  readonly purchase: PurchaseRecordRow;
};

export type ApproveBusinessReviewRequest = {
  readonly businessId: string;
  readonly purchaseRecordId: string;
  /** Optional bounded reviewer note — evidence only (event payload); never customer-visible. */
  readonly note?: unknown;
};

export type RejectBusinessReviewRequest = ApproveBusinessReviewRequest & {
  /** Mandatory bounded Business Review rejection reason (NOT the customer `rejection_reason`). */
  readonly reason: unknown;
};

type CommandParams<R> = {
  /** Server-resolved authenticated Business member (never a client claim). */
  readonly userId: string;
  readonly request: R;
  readonly idempotencyKey: string;
  readonly correlationId: string;
};

function parseId(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw purchaseValidationError(`${label} is required.`);
  }
  return value;
}

function parseNote(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw purchaseValidationError("The review note must be text.");
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > MAX_REVIEW_NOTE_LENGTH) {
    throw purchaseValidationError(
      `The review note must be at most ${MAX_REVIEW_NOTE_LENGTH} characters.`,
    );
  }
  return trimmed;
}

export function parseBusinessReviewRejectReason(value: unknown): BusinessReviewRejectReason {
  if (
    typeof value === "string" &&
    (BUSINESS_REVIEW_REJECT_REASONS as readonly string[]).includes(value)
  ) {
    return value as BusinessReviewRejectReason;
  }
  throw purchaseValidationError(
    "A Business Review rejection reason is required: quantity_not_confirmed, transaction_not_confirmed, or other.",
  );
}

type DecisionSpec = {
  readonly decision: BusinessReviewDecision;
  readonly operation: "business_review_approve" | "business_review_reject";
  readonly idempotencyOperation:
    "purchase.business_review_approve" | "purchase.business_review_reject";
  readonly fingerprint: string;
  readonly reason: BusinessReviewRejectReason | null;
  readonly note: string | null;
};

async function decideBusinessReview(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly purchaseRecordId: string;
    readonly idempotencyKey: string;
    readonly correlationId: string;
    readonly spec: DecisionSpec;
  },
): Promise<BusinessReviewDecisionResult> {
  const { spec } = params;
  if (isReservedIdempotencyKey(params.idempotencyKey)) {
    // Defence in depth: the system's admission keys live in the same table.
    throw purchaseValidationError("This idempotency key uses a reserved prefix.");
  }

  // Live authority on EVERY attempt, before any state is read or written; the accountable
  // (audited) evaluation for this attempt. Never cached, never from the request.
  await authorizePurchaseBusinessReview(db, params.userId, params.businessId, {
    idempotencyKey: params.idempotencyKey,
    requireAudit: true,
  });

  const requestHash = purchaseRequestHash(
    spec.operation,
    params.userId,
    params.businessId,
    params.purchaseRecordId,
    spec.fingerprint,
  );
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as BusinessReviewDecisionResult;
  }

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: spec.idempotencyOperation,
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as BusinessReviewDecisionResult;
    }
    if (reservation.outcome === "in_progress") {
      throw purchaseIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw purchaseIdempotencyConflictError();
    }

    const locked = await lockPurchaseRecordById(tx, params.purchaseRecordId);
    // A Purchase of another Business is indistinguishable from a missing one.
    if (!locked || locked.businessId !== params.businessId) {
      throw purchaseNotFoundError(params.purchaseRecordId);
    }
    if (locked.status !== "business_review_required") {
      throw purchaseStaleStateError("business_review_required", locked.status);
    }
    // Strict, role-blind self-review prohibition, enforced server-side after the row lock.
    if (locked.recordedByUserId === params.userId) {
      throw purchaseSelfReviewError();
    }

    // Authority revalidation AT THE MUTATION BOUNDARY (a grant revoked or a membership suspended
    // while this call waited on the key / row lock must not authorise the decision). The accountable
    // audited evaluation already happened above under the same key.
    const reviewer = await authorizePurchaseBusinessReview(db, params.userId, params.businessId, {
      idempotencyKey: params.idempotencyKey,
      requireAudit: false,
    });

    const decidedAt = new Date();
    const toStatus = spec.decision === "approved" ? "waiting_for_customer" : "rejected";
    const purchase =
      spec.decision === "approved"
        ? await transitionPurchaseBusinessReviewApproved(tx, {
            purchaseId: locked.id,
            reviewerUserId: params.userId,
            decidedAt,
          })
        : await transitionPurchaseBusinessReviewRejected(tx, {
            purchaseId: locked.id,
            reviewerUserId: params.userId,
            decidedAt,
            reason: spec.reason as BusinessReviewRejectReason,
          });
    if (!purchase) {
      // Lost the conditional transition (a concurrent decision won) — fail closed.
      throw purchaseStaleStateError("business_review_required", locked.status);
    }

    const event = await appendPurchaseRecordEvent(tx, {
      purchaseRecordId: purchase.id,
      fromStatus: "business_review_required",
      toStatus,
      actorType: reviewer.role,
      actorId: params.userId,
      reason: spec.reason,
      eventPayload: {
        decision: spec.decision,
        reviewerMembershipId: reviewer.membershipId,
        ...(spec.note !== null ? { note: spec.note } : {}),
      },
      correlationId: params.correlationId,
    });

    await insertTrustEvent(tx, {
      eventType:
        spec.decision === "approved"
          ? "purchase.business_review_approved"
          : "purchase.business_review_rejected",
      causalPurchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: event.id,
      subjectType: "purchase_record",
      subjectId: purchase.id,
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      actorType: reviewer.role,
      actorId: params.userId,
      actorRole: reviewer.role,
      correlationId: params.correlationId,
      payload: {
        decision: spec.decision,
        fromStatus: "business_review_required",
        toStatus,
        ...(spec.reason !== null ? { reason: spec.reason } : {}),
      },
    });

    const intentBase = {
      purchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: event.id,
      payload: { purchaseRecordId: purchase.id, businessId: purchase.businessId },
      correlationId: params.correlationId,
    } as const;
    // Customer: approved → now verifiable; rejected → truthful terminal notice. Neither carries
    // reviewer identity, reason, or threshold (payload is ids only).
    await insertNotificationIntent(tx, {
      ...intentBase,
      intentType:
        spec.decision === "approved"
          ? "purchase_business_review_approved_customer"
          : "purchase_business_review_rejected_customer",
      recipientType: "customer",
      recipientId: purchase.customerIdentityId,
    });
    await insertNotificationIntent(tx, {
      ...intentBase,
      intentType:
        spec.decision === "approved"
          ? "purchase_business_review_approved_business"
          : "purchase_business_review_rejected_business",
      recipientType: "business",
      recipientId: purchase.businessId,
    });

    await writePurchaseOutboxEntry(tx, {
      eventType:
        spec.decision === "approved"
          ? "purchase_business_review_approved"
          : "purchase_business_review_rejected",
      aggregateId: purchase.id,
      payload: {
        businessId: purchase.businessId,
        purchaseRecordId: purchase.id,
        decision: spec.decision,
      },
      actorId: params.userId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    const result: BusinessReviewDecisionResult = { purchase };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, purchase.id, result);
    return result;
  });
}

export async function approveBusinessReview(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: CommandParams<ApproveBusinessReviewRequest>,
): Promise<BusinessReviewDecisionResult> {
  const businessId = parseId(params.request.businessId, "A Business id");
  const purchaseRecordId = parseId(params.request.purchaseRecordId, "A Purchase Record id");
  const note = parseNote(params.request.note);
  return decideBusinessReview(db, pool, {
    userId: params.userId,
    businessId,
    purchaseRecordId,
    idempotencyKey: params.idempotencyKey,
    correlationId: params.correlationId,
    spec: {
      decision: "approved",
      operation: "business_review_approve",
      idempotencyOperation: "purchase.business_review_approve",
      fingerprint: JSON.stringify({ purchaseRecordId, note }),
      reason: null,
      note,
    },
  });
}

export async function rejectBusinessReview(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: CommandParams<RejectBusinessReviewRequest>,
): Promise<BusinessReviewDecisionResult> {
  const businessId = parseId(params.request.businessId, "A Business id");
  const purchaseRecordId = parseId(params.request.purchaseRecordId, "A Purchase Record id");
  const reason = parseBusinessReviewRejectReason(params.request.reason);
  const note = parseNote(params.request.note);
  return decideBusinessReview(db, pool, {
    userId: params.userId,
    businessId,
    purchaseRecordId,
    idempotencyKey: params.idempotencyKey,
    correlationId: params.correlationId,
    spec: {
      decision: "rejected",
      operation: "business_review_reject",
      idempotencyOperation: "purchase.business_review_reject",
      fingerprint: JSON.stringify({ purchaseRecordId, reason, note }),
      reason,
      note,
    },
  });
}
