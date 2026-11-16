/**
 * Presentation rules for the Staff Counter's limited loyalty status (`EA-BL-001-CORR-002-B`,
 * Founder Preview Pass 3). Pure and tiny on purpose: it only RE-STATES the server's authoritative
 * numbers. It never computes progress, never adds an awaiting purchase to the verified count, and never
 * infers a reward from a count — the reward state is the server's `rewardStatus` alone.
 */

import type { CounterLoyaltyContextWire } from "../api/purchaseMutations";

export type CounterLoyaltyView =
  | { readonly kind: "reward"; readonly rewardOrdinalNumber: number }
  | {
      readonly kind: "progress";
      readonly verifiedUnits: number;
      readonly requiredVerifiedUnits: number;
      readonly remainingUnits: number;
      /** Exactly one more verified purchase to go — worth a gentle nudge, nothing more. */
      readonly nearReward: boolean;
      readonly awaitingUnits: number;
    };

export function toLoyaltyView(context: CounterLoyaltyContextWire): CounterLoyaltyView {
  if (context.rewardStatus === "available") {
    // The reward is the unit AFTER the required verified ones ("the 11th is on us").
    return { kind: "reward", rewardOrdinalNumber: context.requiredVerifiedUnits + 1 };
  }
  // Defensive clamp only for display; the server already guarantees 0..required while no reward is open.
  const verified = Math.min(Math.max(context.verifiedUnits, 0), context.requiredVerifiedUnits);
  const remaining = Math.max(context.requiredVerifiedUnits - verified, 0);
  return {
    kind: "progress",
    verifiedUnits: verified,
    requiredVerifiedUnits: context.requiredVerifiedUnits,
    remainingUnits: remaining,
    nearReward: remaining === 1,
    awaitingUnits: Math.max(context.awaitingCustomerConfirmationUnits, 0),
  };
}

/** "11th" / "11e" — small, locale-aware, no dependency. */
export function formatOrdinal(value: number, language: string): string {
  if (language.toLowerCase().startsWith("fr")) return value === 1 ? "1er" : `${value}e`;
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

/**
 * A typed Loyalty Number is only worth asking the server about once it has the right length (three
 * letters + three digits, hyphen/space tolerated). The server stays the judge of validity.
 */
export function isLoyaltyNumberComplete(value: string): boolean {
  return value.replace(/[\s-–—]/g, "").length === 6;
}
