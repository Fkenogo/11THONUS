/**
 * Adapters for the Customer Purchase callables (`PLATFORM-BASELINE-006A`):
 * `verifyPurchase`, `rejectPurchase`, `raisePurchaseDispute`,
 * `listPurchasesWaitingForCustomer`, `getCustomerPurchaseRecord`,
 * `listAvailableRewardsForCustomer`.
 *
 * Same `toCallWithActor` transport seam as the Identity-domain Display
 * Name callables — the Customer Identity id is server-resolved from the
 * actor's auth chain on every call; no customer id is ever sent by the
 * client. Reason codes use the closed server vocabularies. Dates cross
 * the wire as ISO strings.
 */

import { httpsCallable, type Functions } from "firebase/functions";
import {
  toCallWithActor,
  type AuthenticatedActor,
} from "../../identity/api/identityCallableClient";

export type CustomerPurchaseWire = {
  id: string;
  businessId: string;
  customerIdentityId: string;
  presentedArtifactType: "loyalty_number" | "qr_identity";
  presentedArtifactReference: string;
  canonicalLoyaltyNumberValue: string;
  rewardProgramId: string;
  rewardProgramVersionId: string;
  quantity: number;
  itemLabel: string;
  purchaseDate: string;
  notes: string | null;
  status: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
  disputeReason: string | null;
  createdAt: string;
};

export type CustomerPurchaseEventWire = {
  id: string;
  purchaseRecordId: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorId: string;
  reason: string | null;
  occurredAt: string;
};

export type CustomerRewardWire = {
  id: string;
  loyaltyCycleId: string;
  businessId: string;
  customerIdentityId: string;
  rewardProgramId: string;
  rewardProgramVersionId: string;
  rewardDescription: string;
  rewardQuantity: number;
  state: string;
  availableAt: string;
  createdAt: string;
};

export type VerifyPurchaseRequest = { purchaseRecordId: string; idempotencyKey: string };
export type RejectPurchaseRequest = {
  purchaseRecordId: string;
  reason: string;
  idempotencyKey: string;
};
export type DisputePurchaseRequest = {
  purchaseRecordId: string;
  reason: string;
  idempotencyKey: string;
};

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

export function toCallVerifyPurchase(
  callable: BoundCallable<{ purchase: CustomerPurchaseWire }>,
): (actor: AuthenticatedActor, payload: VerifyPurchaseRequest) => Promise<unknown> {
  return toCallWithActor(callable);
}

export function toCallRejectPurchase(
  callable: BoundCallable<{ purchase: CustomerPurchaseWire }>,
): (actor: AuthenticatedActor, payload: RejectPurchaseRequest) => Promise<unknown> {
  return toCallWithActor(callable);
}

export function toCallDisputePurchase(
  callable: BoundCallable<{ purchase: CustomerPurchaseWire }>,
): (actor: AuthenticatedActor, payload: DisputePurchaseRequest) => Promise<unknown> {
  return toCallWithActor(callable);
}

export function toCallWaitingPurchases(
  callable: BoundCallable<{ purchases: CustomerPurchaseWire[] }>,
): (
  actor: AuthenticatedActor,
  payload: { limit?: number; offset?: number },
) => Promise<{ purchases: CustomerPurchaseWire[] }> {
  return toCallWithActor(callable);
}

export function toCallCustomerPurchaseDetail(
  callable: BoundCallable<{
    purchase: CustomerPurchaseWire;
    events: CustomerPurchaseEventWire[];
  }>,
): (
  actor: AuthenticatedActor,
  payload: { purchaseRecordId: string },
) => Promise<{ purchase: CustomerPurchaseWire; events: CustomerPurchaseEventWire[] }> {
  return toCallWithActor(callable);
}

export function toCallAvailableRewards(
  callable: BoundCallable<{ rewards: CustomerRewardWire[] }>,
): (
  actor: AuthenticatedActor,
  payload: Record<string, unknown>,
) => Promise<{ rewards: CustomerRewardWire[] }> {
  return toCallWithActor(callable);
}

export function makeCustomerPurchaseCalls(functions: Functions) {
  return {
    verifyPurchase: toCallVerifyPurchase(httpsCallable(functions, "verifyPurchase")),
    rejectPurchase: toCallRejectPurchase(httpsCallable(functions, "rejectPurchase")),
    raisePurchaseDispute: toCallDisputePurchase(httpsCallable(functions, "raisePurchaseDispute")),
    waitingPurchases: toCallWaitingPurchases(
      httpsCallable(functions, "listPurchasesWaitingForCustomer"),
    ),
    purchaseDetail: toCallCustomerPurchaseDetail(
      httpsCallable(functions, "getCustomerPurchaseRecord"),
    ),
    availableRewards: toCallAvailableRewards(
      httpsCallable(functions, "listAvailableRewardsForCustomer"),
    ),
  };
}

export type { AuthenticatedActor };
