/**
 * Pure derivations for the Business Command Centre (EA-003).
 *
 * Everything here is a plain re-arrangement of the already-canonical read models
 * (`listRewardPrograms`, `listPurchasesForBusiness`, `listAvailableRewardsForBusiness`,
 * `listLoyaltyCycleProgressForBusiness`). Nothing is computed that the server does not already
 * state: no progress is derived from an unverified Purchase, no Commercial figure is inferred,
 * and no balance, ledger or capacity number exists in this module.
 */

import type { BusinessLoyaltyCycleProgressWire } from "../../api/businessLoyaltyVisibility";
import type { RewardProgramWithVersionsWire } from "../../api/rewardProgramMutations";

export type AttentionKind =
  "rewardsReady" | "onHold" | "underReview" | "waitingForCustomer" | "noLiveProgram";

export type AttentionItem = { kind: AttentionKind; count: number | null };

export type AttentionInput = {
  programs: RewardProgramWithVersionsWire[] | undefined;
  rewardsReadyCount: number | undefined;
  waitingForCustomerCount: number | undefined;
  underReviewCount: number | undefined;
  pendingAdmissionCount: number | undefined;
};

/** A program a customer can currently progress in: published (has a current version) and active. */
export function isLiveProgram(entry: RewardProgramWithVersionsWire): boolean {
  return entry.program.status === "active" && entry.currentVersion?.status === "active";
}

/**
 * Ordered most-actionable first. An item appears only when its count is known and non-zero (or,
 * for "no live program", when the programs read succeeded and none is live) — an unloaded read
 * never manufactures an alert.
 */
export function deriveAttention(input: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (input.pendingAdmissionCount) {
    items.push({ kind: "onHold", count: input.pendingAdmissionCount });
  }
  if (input.rewardsReadyCount) {
    items.push({ kind: "rewardsReady", count: input.rewardsReadyCount });
  }
  if (input.underReviewCount) {
    items.push({ kind: "underReview", count: input.underReviewCount });
  }
  if (input.waitingForCustomerCount) {
    items.push({ kind: "waitingForCustomer", count: input.waitingForCustomerCount });
  }
  if (input.programs && !input.programs.some(isLiveProgram)) {
    items.push({ kind: "noLiveProgram", count: null });
  }
  return items;
}

/** Circles still filling (server state `active`), nearest to a Reward first; max `limit`. */
export function closestToReward(
  cycles: BusinessLoyaltyCycleProgressWire[] | undefined,
  limit = 3,
): BusinessLoyaltyCycleProgressWire[] {
  return (cycles ?? [])
    .filter((cycle) => cycle.cycleState === "active" && cycle.allocatedUnits > 0)
    .sort((a, b) => a.unitsToReward - b.unitsToReward || b.allocatedUnits - a.allocatedUnits)
    .slice(0, limit);
}

export function circlesInProgress(
  cycles: BusinessLoyaltyCycleProgressWire[] | undefined,
): number | undefined {
  return cycles?.filter((cycle) => cycle.cycleState === "active").length;
}
