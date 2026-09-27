/**
 * Adapters for the Business Reward / Loyalty-Cycle visibility callables
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`): `listAvailableRewardsForBusiness`
 * and `listLoyaltyCycleProgressForBusiness`.
 *
 * Read-only wire types mirroring the server DTOs verbatim. The request
 * carries only `businessId`, an optional `rewardProgramId` filter, and
 * pagination; Owner/Manager authorization and Business scoping are
 * enforced server-side. No Customer Identity id or internal row id crosses
 * the wire — the Customer is identified by the Loyalty Number the Business
 * already holds on its own Purchase Records.
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

export type BusinessRewardState = "available" | "redeemed" | "cancelled" | "expired";
export type BusinessLoyaltyCycleState =
  "active" | "reward_available" | "reward_redeemed" | "closed";

export type BusinessAvailableRewardWire = {
  rewardProgramId: string;
  rewardProgramName: string;
  customerLoyaltyNumber: string | null;
  rewardDescription: string;
  rewardQuantity: number;
  state: BusinessRewardState;
  availableAt: string;
  cycleSequenceNumber: number;
};

export type BusinessLoyaltyCycleProgressWire = {
  rewardProgramId: string;
  rewardProgramName: string;
  customerLoyaltyNumber: string | null;
  cycleSequenceNumber: number;
  cycleState: BusinessLoyaltyCycleState;
  allocatedUnits: number;
  threshold: number;
  unitsToReward: number;
  pendingUnits: number;
  reward: {
    state: BusinessRewardState;
    rewardDescription: string;
    availableAt: string;
  } | null;
  updatedAt: string;
};

export type BusinessLoyaltyVisibilityRequest = {
  businessId: string;
  rewardProgramId?: string;
  limit?: number;
  offset?: number;
};

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

export function toCallListAvailableRewardsForBusiness(
  callable: BoundCallable<{ rewards: BusinessAvailableRewardWire[] }>,
): (
  actor: AuthenticatedActor,
  payload: BusinessLoyaltyVisibilityRequest,
) => Promise<{ rewards: BusinessAvailableRewardWire[] }> {
  return toCallWithActor<
    BusinessLoyaltyVisibilityRequest,
    { rewards: BusinessAvailableRewardWire[] }
  >(callable);
}

export function makeCallListAvailableRewardsForBusiness(functions: Functions) {
  return toCallListAvailableRewardsForBusiness(
    httpsCallable(functions, "listAvailableRewardsForBusiness"),
  );
}

export function toCallListLoyaltyCycleProgressForBusiness(
  callable: BoundCallable<{ cycles: BusinessLoyaltyCycleProgressWire[] }>,
): (
  actor: AuthenticatedActor,
  payload: BusinessLoyaltyVisibilityRequest,
) => Promise<{ cycles: BusinessLoyaltyCycleProgressWire[] }> {
  return toCallWithActor<
    BusinessLoyaltyVisibilityRequest,
    { cycles: BusinessLoyaltyCycleProgressWire[] }
  >(callable);
}

export function makeCallListLoyaltyCycleProgressForBusiness(functions: Functions) {
  return toCallListLoyaltyCycleProgressForBusiness(
    httpsCallable(functions, "listLoyaltyCycleProgressForBusiness"),
  );
}
