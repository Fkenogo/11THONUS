/**
 * Adapters for the Purchase callables (`PLATFORM-BASELINE-006A`):
 * `recordPurchase`, `listPurchasesForBusiness`, `getBusinessPurchaseRecord`.
 *
 * Same shape as `rewardProgramMutations.ts`: the client submits exactly
 * one presented artifact plus commercial fields — never a Customer
 * Identity id, program version, recorder identity/role, or status (all
 * server-resolved/server-derived). Dates cross the wire as ISO strings.
 */

import { httpsCallable, type Functions } from "firebase/functions";
import {
  toCallWithActor,
  type AuthenticatedActor,
  type CallableErrorClassifier,
} from "./businessCallableClient";
import { mapCallableErrorCode } from "../../authentication/authenticateClient";

export type PurchaseRecordWire = {
  id: string;
  businessId: string;
  customerIdentityId: string;
  presentedArtifactType: "loyalty_number" | "qr_identity";
  presentedArtifactReference: string;
  canonicalLoyaltyNumberValue: string;
  rewardProgramId: string;
  rewardProgramVersionId: string;
  sharedLoyaltyNumberAllowed: boolean;
  multipleUnitsAllowed: boolean;
  branchId: string;
  recordedByUserId: string;
  recordedByRole: "staff" | "manager" | "owner";
  quantity: number;
  qualifyingItemId: string | null;
  itemLabel: string;
  knowledgeNodeId: string | null;
  unitValueMinor: number | null;
  currency: string | null;
  purchaseDate: string;
  notes: string | null;
  status:
    | "waiting_for_customer"
    | "business_review_required"
    | "pending_admission"
    | "verified"
    | "rejected"
    | "under_review"
    | "corrected"
    | "cancelled"
    | "expired"
    | "archived";
  verifiedAt: string | null;
  rejectionReason: string | null;
  disputeReason: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
};

export type PurchaseRecordEventWire = {
  id: string;
  purchaseRecordId: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorId: string;
  reason: string | null;
  eventPayload: Record<string, unknown> | null;
  correlationId: string;
  occurredAt: string;
  schemaVersion: number;
};

export type RecordPurchaseRequest = {
  businessId: string;
  rewardProgramId: string;
  loyaltyNumberValue?: string;
  qrReference?: string;
  quantity: number;
  /**
   * Structural Business-owned Qualifying Item id (`PLATFORM-BASELINE-013C`).
   * Selected from the Reward Program's own `currentVersion.qualifyingItems`;
   * the server resolves the display name and validates the binding. No item
   * name, Commerce Knowledge id, or program version crosses the wire.
   */
  qualifyingItemId: string;
  unitValueMinor?: number | null;
  currency?: string | null;
  purchaseDate: string;
  notes?: string | null;
  idempotencyKey: string;
};

export type RecordPurchaseResult = {
  purchase: PurchaseRecordWire;
  /**
   * Server routing outcome (`EA-BL-001-CORR-002-BR`). Optional: a replayed result stored before this
   * field existed omits it, in which case `purchase.status` is authoritative. Never carries the
   * configured review threshold.
   */
  review?: { required: boolean; status: "waiting_for_customer" | "business_review_required" };
};

/** True when the server routed the recorded Purchase to Business Review (not yet customer-verifiable). */
export function isBusinessReviewRequired(result: RecordPurchaseResult | undefined): boolean {
  return (
    result?.review?.required === true || result?.purchase?.status === "business_review_required"
  );
}

/**
 * The closed public failure discriminator the server attaches to a `recordPurchase` validation
 * failure (`EA-BL-001-CORR-002-B`, mirrors `PURCHASE_FAILURE_REASONS` in `purchaseErrors.ts`). Any
 * other value is ignored: the client only ever acts on tokens it knows.
 */
export const PURCHASE_FAILURE_REASONS = [
  "customer_artifact_invalid_or_not_found",
  "programme_unavailable",
  "qualifying_item_invalid",
  "quantity_invalid",
  "generic_validation_failed",
] as const;

export type PurchaseFailureReason = (typeof PURCHASE_FAILURE_REASONS)[number];

/**
 * Transport codes that mean "the call may or may not have committed": a dropped connection or a
 * lost response surfaces from the Firebase SDK as `functions/internal` (status 0 — "could be a
 * network error or an unhandled backend error, no way to know"), an aborted request as
 * `functions/cancelled`, anything unmapped as `functions/unknown`. For `recordPurchase` every one of
 * these is UNCERTAIN, so it must classify as retryable (`unavailable`) — that is what makes the web
 * key holder KEEP the idempotency key (`settleKeyOnError`) and a retry replay the original Purchase
 * instead of minting a duplicate. Other callables keep the shared mapping unchanged.
 */
const UNCERTAIN_TRANSPORT_CODES: ReadonlySet<string> = new Set([
  "functions/internal",
  "functions/unknown",
  "functions/cancelled",
]);

export const classifyRecordPurchaseError: CallableErrorClassifier = (error) => {
  const raw = error as { code?: unknown; details?: unknown } | undefined;
  const code = typeof raw?.code === "string" ? raw.code : undefined;
  if (code !== undefined && UNCERTAIN_TRANSPORT_CODES.has(code)) {
    return { code: "unavailable" };
  }
  if (code === undefined) {
    // Not a recognised Firebase error at all (a bare network TypeError, say): same uncertainty.
    return { code: "unavailable" };
  }
  const mapped = mapCallableErrorCode(code);
  const reason = (raw?.details as { reason?: unknown } | null | undefined)?.reason;
  const known = (PURCHASE_FAILURE_REASONS as readonly unknown[]).includes(reason)
    ? (reason as PurchaseFailureReason)
    : undefined;
  return mapped === "validation_failed" && known
    ? { code: mapped, reason: known }
    : { code: mapped };
};

/**
 * One row of the Staff Counter's own-recent feed (`listMyRecentCounterPurchases`). Purpose-built
 * projection: no reviewer, reason, threshold, customer identity or recorder fields exist on it.
 */
export type CounterRecentPurchaseWire = {
  id: string;
  recordedAt: string;
  itemLabel: string;
  quantity: number;
  status: PurchaseRecordWire["status"];
  presentedVia: "loyalty_number" | "qr_identity";
  customerCodeHint: string | null;
};

export type ListPurchasesRequest = {
  businessId: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export function makeCallRecordPurchase(functions: Functions) {
  return toCallRecordPurchase(httpsCallable(functions, "recordPurchase"));
}

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

export function toCallRecordPurchase(
  callable: BoundCallable<RecordPurchaseResult>,
): (actor: AuthenticatedActor, payload: RecordPurchaseRequest) => Promise<RecordPurchaseResult> {
  return toCallWithActor<RecordPurchaseRequest, RecordPurchaseResult>(
    callable,
    classifyRecordPurchaseError,
  );
}

export function toCallListMyRecentCounterPurchases(
  callable: BoundCallable<{ purchases: CounterRecentPurchaseWire[] }>,
): (
  actor: AuthenticatedActor,
  payload: { businessId: string; limit?: number },
) => Promise<{ purchases: CounterRecentPurchaseWire[] }> {
  return toCallWithActor<
    { businessId: string; limit?: number },
    { purchases: CounterRecentPurchaseWire[] }
  >(callable);
}

export function makeCallListMyRecentCounterPurchases(functions: Functions) {
  return toCallListMyRecentCounterPurchases(
    httpsCallable(functions, "listMyRecentCounterPurchases"),
  );
}

export function toCallListPurchasesForBusiness(
  callable: BoundCallable<{ purchases: PurchaseRecordWire[] }>,
): (
  actor: AuthenticatedActor,
  payload: ListPurchasesRequest,
) => Promise<{ purchases: PurchaseRecordWire[] }> {
  return toCallWithActor<ListPurchasesRequest, { purchases: PurchaseRecordWire[] }>(callable);
}

export function makeCallListPurchasesForBusiness(functions: Functions) {
  return toCallListPurchasesForBusiness(httpsCallable(functions, "listPurchasesForBusiness"));
}

export function toCallGetBusinessPurchaseRecord(
  callable: BoundCallable<{ purchase: PurchaseRecordWire; events: PurchaseRecordEventWire[] }>,
): (
  actor: AuthenticatedActor,
  payload: { businessId: string; purchaseRecordId: string },
) => Promise<{ purchase: PurchaseRecordWire; events: PurchaseRecordEventWire[] }> {
  return toCallWithActor<
    { businessId: string; purchaseRecordId: string },
    { purchase: PurchaseRecordWire; events: PurchaseRecordEventWire[] }
  >(callable);
}

export function makeCallGetBusinessPurchaseRecord(functions: Functions) {
  return toCallGetBusinessPurchaseRecord(httpsCallable(functions, "getBusinessPurchaseRecord"));
}

export type { AuthenticatedActor };
