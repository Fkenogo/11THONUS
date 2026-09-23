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
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

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
  return toCallWithActor<RecordPurchaseRequest, RecordPurchaseResult>(callable);
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
