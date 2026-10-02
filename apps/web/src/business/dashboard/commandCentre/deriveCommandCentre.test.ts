import { describe, expect, it } from "vitest";
import {
  circlesInProgress,
  closestToReward,
  deriveAttention,
  isLiveProgram,
} from "./deriveCommandCentre";
import type { RewardProgramWithVersionsWire } from "../../api/rewardProgramMutations";
import type { BusinessLoyaltyCycleProgressWire } from "../../api/businessLoyaltyVisibility";

function program(
  status: "draft" | "active",
  versionStatus: "active" | "draft" | null,
): RewardProgramWithVersionsWire {
  return {
    program: { id: `p-${status}-${versionStatus}`, status },
    currentVersion: versionStatus === "active" ? { status: "active" } : null,
    draftVersion: versionStatus === "draft" ? { status: "draft" } : null,
  } as unknown as RewardProgramWithVersionsWire;
}

function cycle(over: Partial<BusinessLoyaltyCycleProgressWire>): BusinessLoyaltyCycleProgressWire {
  return {
    rewardProgramId: "p",
    rewardProgramName: "P",
    customerLoyaltyNumber: "N",
    cycleSequenceNumber: 1,
    cycleState: "active",
    allocatedUnits: 3,
    threshold: 10,
    unitsToReward: 7,
    pendingUnits: 0,
    reward: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const none = {
  programs: undefined,
  rewardsReadyCount: undefined,
  waitingForCustomerCount: undefined,
  underReviewCount: undefined,
  pendingAdmissionCount: undefined,
};

describe("deriveAttention", () => {
  it("raises nothing while reads are unloaded (an unloaded read never manufactures an alert)", () => {
    expect(deriveAttention(none)).toEqual([]);
  });

  it("raises nothing for zero counts and a live program", () => {
    expect(
      deriveAttention({
        programs: [program("active", "active")],
        rewardsReadyCount: 0,
        waitingForCustomerCount: 0,
        underReviewCount: 0,
        pendingAdmissionCount: 0,
      }),
    ).toEqual([]);
  });

  it("orders items: held (Commercial consequence) → rewards → under review → waiting → no program", () => {
    const items = deriveAttention({
      programs: [program("active", "draft")],
      rewardsReadyCount: 1,
      waitingForCustomerCount: 4,
      underReviewCount: 2,
      pendingAdmissionCount: 3,
    });
    expect(items.map((i) => i.kind)).toEqual([
      "onHold",
      "rewardsReady",
      "underReview",
      "waitingForCustomer",
      "noLiveProgram",
    ]);
    expect(items.find((i) => i.kind === "waitingForCustomer")?.count).toBe(4);
  });

  it("flags a Business with only a draft program as having no live program", () => {
    expect(
      deriveAttention({ ...none, programs: [program("draft", "draft")] }).map((i) => i.kind),
    ).toEqual(["noLiveProgram"]);
    expect(deriveAttention({ ...none, programs: [] }).map((i) => i.kind)).toEqual([
      "noLiveProgram",
    ]);
  });
});

describe("isLiveProgram", () => {
  it("requires an active program with a published (current) version", () => {
    expect(isLiveProgram(program("active", "active"))).toBe(true);
    expect(isLiveProgram(program("active", "draft"))).toBe(false);
    expect(isLiveProgram(program("draft", "draft"))).toBe(false);
  });
});

describe("closestToReward / circlesInProgress", () => {
  const cycles = [
    cycle({ customerLoyaltyNumber: "A", allocatedUnits: 3, unitsToReward: 7 }),
    cycle({ customerLoyaltyNumber: "B", allocatedUnits: 9, unitsToReward: 1 }),
    cycle({ customerLoyaltyNumber: "C", allocatedUnits: 7, unitsToReward: 3 }),
    cycle({
      customerLoyaltyNumber: "D",
      allocatedUnits: 10,
      unitsToReward: 0,
      cycleState: "reward_available",
    }),
    cycle({ customerLoyaltyNumber: "E", allocatedUnits: 0, unitsToReward: 10 }),
    cycle({ customerLoyaltyNumber: "F", allocatedUnits: 5, unitsToReward: 5 }),
  ];

  it("lists only Circles still filling, nearest first, with at least one verified unit", () => {
    expect(closestToReward(cycles).map((c) => c.customerLoyaltyNumber)).toEqual(["B", "C", "F"]);
    expect(closestToReward(undefined)).toEqual([]);
  });

  it("counts Circles in progress by server state", () => {
    expect(circlesInProgress(cycles)).toBe(5);
    expect(circlesInProgress(undefined)).toBeUndefined();
  });
});
