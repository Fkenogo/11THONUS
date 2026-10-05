import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cycles: vi.fn(),
  pending: vi.fn(),
  activity: vi.fn(),
  rewards: vi.fn(),
  business: vi.fn(),
}));

vi.mock("../repositories/customerExperienceRepository", () => ({
  listCustomerExperienceCycles: mocks.cycles,
  listCustomerPendingUnits: mocks.pending,
  listCustomerExperienceActivity: mocks.activity,
}));
vi.mock("../repositories/loyaltyCycleRepository", () => ({
  listAvailableRewardsForCustomer: mocks.rewards,
}));
vi.mock("../../business/repositories/businessRepository", () => ({
  readBusinessByIdForRouting: mocks.business,
}));

import { getCustomerExperienceOverview } from "./customerExperienceQueries";

describe("getCustomerExperienceOverview", () => {
  beforeEach(() => vi.resetAllMocks());

  it("uses authenticated customer scope, authoritative rewards, and real relationship names", async () => {
    mocks.cycles.mockResolvedValue([
      {
        businessId: "biz-1",
        rewardProgramId: "program-1",
        programmeName: "Coffee Circle",
        qualifyingItemName: "Coffee",
        cycleId: "cycle-1",
        cycleNumber: 1,
        cycleState: "active",
        verifiedUnits: 8,
        rewardAvailable: false,
        rewardDescription: "A coffee",
      },
    ]);
    mocks.pending.mockResolvedValue([
      {
        businessId: "biz-1",
        rewardProgramId: "program-1",
        programmeName: "Coffee Circle",
        qualifyingItemName: "Coffee",
        pendingUnits: 1,
      },
    ]);
    mocks.activity.mockResolvedValue([]);
    mocks.rewards.mockResolvedValue([]);
    mocks.business.mockResolvedValue({ displayName: "Café Lumière" });

    const result = await getCustomerExperienceOverview({} as never, {} as never, "cust-1");

    expect(mocks.cycles).toHaveBeenCalledWith(expect.anything(), "cust-1");
    expect(mocks.pending).toHaveBeenCalledWith(expect.anything(), "cust-1");
    expect(result.circles[0]).toMatchObject({
      businessName: "Café Lumière",
      verifiedUnits: 8,
      pendingUnits: 1,
      rewardAvailable: false,
    });
    expect(result.availableRewards).toEqual([]);
  });

  it("does not expose individual redemption confirmer identity", async () => {
    mocks.cycles.mockResolvedValue([]);
    mocks.pending.mockResolvedValue([]);
    mocks.activity.mockResolvedValue([
      {
        id: "redeem-1",
        businessId: "biz-1",
        rewardProgramId: "program-1",
        programmeName: "Coffee Circle",
        itemLabel: null,
        quantity: null,
        eventKind: "reward_redeemed",
        status: "redeemed",
        rewardDescription: "A coffee",
        occurredAt: new Date("2026-10-01T12:00:00Z"),
      },
    ]);
    mocks.rewards.mockResolvedValue([]);
    mocks.business.mockResolvedValue({ displayName: "Café Lumière" });

    const result = await getCustomerExperienceOverview({} as never, {} as never, "cust-1");

    expect(result.activity[0]).not.toHaveProperty("confirmedByUserId");
    expect(result.activity[0]).toMatchObject({ businessName: "Café Lumière" });
  });
});
