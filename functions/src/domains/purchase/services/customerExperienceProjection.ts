export type CustomerCircleCycleRow = {
  readonly businessId: string;
  readonly businessName: string | null;
  readonly rewardProgramId: string;
  readonly programmeName: string;
  readonly qualifyingItemName: string | null;
  readonly cycleId: string;
  readonly cycleNumber: number;
  readonly cycleState: "active" | "reward_available";
  readonly verifiedUnits: number;
  readonly rewardAvailable: boolean;
  readonly rewardDescription: string | null;
};

export type CustomerPendingUnitsRow = {
  readonly businessId: string;
  readonly businessName: string | null;
  readonly rewardProgramId: string;
  readonly programmeName: string;
  readonly qualifyingItemName: string;
  readonly pendingUnits: number;
};

export type CustomerCircle = {
  readonly id: string;
  readonly businessId: string;
  readonly businessName: string | null;
  readonly rewardProgramId: string;
  readonly programmeName: string;
  readonly qualifyingItemName: string | null;
  readonly cycleId: string | null;
  readonly cycleNumber: number | null;
  readonly cycleState: "active" | "reward_available" | "not_started";
  readonly verifiedUnits: number;
  readonly pendingUnits: number;
  readonly rewardAvailable: boolean;
  readonly rewardDescription: string | null;
};

const keyOf = (businessId: string, rewardProgramId: string) =>
  `${businessId}\u0000${rewardProgramId}`;

/**
 * Joins server-read current cycles with Purchases awaiting customer
 * verification. Pending quantities remain a separate display value and
 * never contribute to the authoritative Cycle state or reward flag.
 */
export function projectCustomerCircles(
  cycles: readonly CustomerCircleCycleRow[],
  pendingRows: readonly CustomerPendingUnitsRow[],
): CustomerCircle[] {
  const circles = new Map<string, CustomerCircle>();

  for (const cycle of cycles) {
    if (cycle.rewardAvailable !== (cycle.cycleState === "reward_available")) {
      throw new Error("Circle reward availability must match authoritative reward state.");
    }
    if (cycle.verifiedUnits < 0 || cycle.verifiedUnits > 10) {
      throw new Error("Circle progress is outside the authoritative Cycle range.");
    }
    if (cycle.cycleState === "reward_available" && cycle.verifiedUnits !== 10) {
      throw new Error("A reward-available Circle must contain the authoritative threshold.");
    }
    if (cycle.cycleState === "active" && cycle.verifiedUnits === 10) {
      throw new Error("An active Circle at the threshold contradicts authoritative reward state.");
    }
    const key = keyOf(cycle.businessId, cycle.rewardProgramId);
    circles.set(key, {
      id: cycle.cycleId,
      businessId: cycle.businessId,
      businessName: cycle.businessName,
      rewardProgramId: cycle.rewardProgramId,
      programmeName: cycle.programmeName,
      qualifyingItemName: cycle.qualifyingItemName,
      cycleId: cycle.cycleId,
      cycleNumber: cycle.cycleNumber,
      cycleState: cycle.cycleState,
      verifiedUnits: cycle.verifiedUnits,
      pendingUnits: 0,
      rewardAvailable: cycle.rewardAvailable,
      rewardDescription: cycle.rewardDescription,
    });
  }

  for (const pending of pendingRows) {
    if (pending.pendingUnits < 1) continue;
    const key = keyOf(pending.businessId, pending.rewardProgramId);
    const current = circles.get(key);
    if (current) {
      circles.set(key, { ...current, pendingUnits: current.pendingUnits + pending.pendingUnits });
      continue;
    }
    circles.set(key, {
      id: key,
      businessId: pending.businessId,
      businessName: pending.businessName,
      rewardProgramId: pending.rewardProgramId,
      programmeName: pending.programmeName,
      qualifyingItemName: pending.qualifyingItemName,
      cycleId: null,
      cycleNumber: null,
      cycleState: "not_started",
      verifiedUnits: 0,
      pendingUnits: pending.pendingUnits,
      rewardAvailable: false,
      rewardDescription: null,
    });
  }

  return [...circles.values()].sort(
    (a, b) =>
      (a.businessName ?? "").localeCompare(b.businessName ?? "") ||
      a.programmeName.localeCompare(b.programmeName),
  );
}
