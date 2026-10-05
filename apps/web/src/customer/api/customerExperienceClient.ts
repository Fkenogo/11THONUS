import { httpsCallable, type Functions } from "firebase/functions";
import {
  toCallWithActor,
  type AuthenticatedActor,
} from "../../identity/api/identityCallableClient";

export type CustomerIdentityPresentationWire = {
  displayName: string | null;
  loyaltyNumber: string | null;
  qrReference: string | null;
  status: "ready" | "pending";
};

export type CustomerCircleWire = {
  id: string;
  businessId: string;
  businessName: string | null;
  rewardProgramId: string;
  programmeName: string;
  qualifyingItemName: string | null;
  cycleId: string | null;
  cycleNumber: number | null;
  cycleState: "active" | "reward_available" | "not_started";
  verifiedUnits: number;
  pendingUnits: number;
  rewardAvailable: boolean;
  rewardDescription: string | null;
};

export type CustomerExperienceActivityWire = {
  id: string;
  businessId: string;
  businessName: string | null;
  rewardProgramId: string;
  programmeName: string;
  itemLabel: string | null;
  quantity: number | null;
  eventKind: "purchase" | "reward_available" | "reward_redeemed";
  status: string;
  rewardDescription: string | null;
  occurredAt: string;
};

export type CustomerAvailableRewardWire = {
  id: string;
  businessId: string;
  businessName: string | null;
  rewardProgramId: string;
  rewardDescription: string;
  rewardQuantity: number;
  availableAt: string;
};

export type CustomerExperienceOverviewWire = {
  circles: CustomerCircleWire[];
  activity: CustomerExperienceActivityWire[];
  availableRewards: CustomerAvailableRewardWire[];
};

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult }>;

export function toCallCustomerIdentityPresentation(
  callable: BoundCallable<CustomerIdentityPresentationWire>,
): (
  actor: AuthenticatedActor,
  payload: Record<string, never>,
) => Promise<CustomerIdentityPresentationWire> {
  return toCallWithActor(callable);
}

export function toCallCustomerExperienceOverview(
  callable: BoundCallable<CustomerExperienceOverviewWire>,
): (
  actor: AuthenticatedActor,
  payload: Record<string, never>,
) => Promise<CustomerExperienceOverviewWire> {
  return toCallWithActor(callable);
}

export function makeCustomerExperienceCalls(functions: Functions) {
  return {
    identityPresentation: toCallCustomerIdentityPresentation(
      httpsCallable(functions, "getMyCustomerIdentityPresentation"),
    ),
    overview: toCallCustomerExperienceOverview(
      httpsCallable(functions, "getMyCustomerExperienceOverview"),
    ),
  };
}
