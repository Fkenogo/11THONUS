/**
 * Business-facing Reward / Loyalty-Cycle visibility read models
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`).
 *
 * Read-only projections over the authoritative PostgreSQL loyalty spine
 * (`loyalty_cycles`, `rewards`, `verified_unit_allocations`,
 * `reward_programs`, `reward_program_versions`, `purchase_records`). No new
 * state, no derived loyalty model: every value is either a stored column or
 * a direct arithmetic read of stored columns performed server-side.
 *
 * Customer identification follows the existing Business purchase-read
 * convention: the canonical Loyalty Number snapshot the Business already
 * holds on its own `purchase_records` for that Customer. No Customer
 * Identity id, authentication reference, profile field, cycle/reward row
 * id, or Commerce Knowledge id is exposed.
 */

import type { LoyaltyCycleState, RewardState } from "./purchase";

export type BusinessAvailableReward = {
  readonly rewardProgramId: string;
  readonly rewardProgramName: string;
  /** Loyalty Number the Business already recorded for this Customer; null only if none exists. */
  readonly customerLoyaltyNumber: string | null;
  readonly rewardDescription: string;
  readonly rewardQuantity: number;
  readonly state: RewardState;
  readonly availableAt: string;
  readonly cycleSequenceNumber: number;
};

export type BusinessLoyaltyCycleProgress = {
  readonly rewardProgramId: string;
  readonly rewardProgramName: string;
  readonly customerLoyaltyNumber: string | null;
  readonly cycleSequenceNumber: number;
  readonly cycleState: LoyaltyCycleState;
  readonly allocatedUnits: number;
  /** The governing (opening) version's `required_verified_units`. */
  readonly threshold: number;
  /** `max(threshold - allocatedUnits, 0)` — computed server-side from stored values. */
  readonly unitsToReward: number;
  /** Verified Units held in pending allocation for this Customer/Program (FD-PVL-002 overflow). */
  readonly pendingUnits: number;
  /** The Cycle's Reward, when one exists (at most one per Cycle). */
  readonly reward: {
    readonly state: RewardState;
    readonly rewardDescription: string;
    readonly availableAt: string;
  } | null;
  readonly updatedAt: string;
};
