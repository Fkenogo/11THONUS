import { describe, expect, it } from "vitest";
import { projectCustomerCircles } from "./customerExperienceProjection";

describe("projectCustomerCircles", () => {
  it("keeps customer-verification purchases visually pending and outside verified progress", () => {
    const circles = projectCustomerCircles(
      [
        {
          businessId: "biz-1",
          businessName: "Café Lumière",
          rewardProgramId: "program-1",
          programmeName: "Coffee Circle",
          qualifyingItemName: "coffee",
          cycleId: "cycle-1",
          cycleNumber: 1,
          cycleState: "active",
          verifiedUnits: 8,
          rewardAvailable: false,
          rewardDescription: null,
        },
      ],
      [
        {
          businessId: "biz-1",
          businessName: "Café Lumière",
          rewardProgramId: "program-1",
          programmeName: "Coffee Circle",
          qualifyingItemName: "coffee",
          pendingUnits: 1,
        },
      ],
    );

    expect(circles).toEqual([
      expect.objectContaining({
        verifiedUnits: 8,
        pendingUnits: 1,
        rewardAvailable: false,
        cycleNumber: 1,
      }),
    ]);
  });

  it("preserves an available reward and creates a pending-only relationship without granting progress", () => {
    const circles = projectCustomerCircles(
      [
        {
          businessId: "biz-1",
          businessName: "Café Lumière",
          rewardProgramId: "program-1",
          programmeName: "Coffee Circle",
          qualifyingItemName: "coffee",
          cycleId: "cycle-2",
          cycleNumber: 2,
          cycleState: "reward_available",
          verifiedUnits: 10,
          rewardAvailable: true,
          rewardDescription: "A coffee",
        },
      ],
      [
        {
          businessId: "biz-2",
          businessName: "Boulangerie",
          rewardProgramId: "program-2",
          programmeName: "Bread Circle",
          qualifyingItemName: "Bread",
          pendingUnits: 2,
        },
      ],
    );

    expect(circles).toHaveLength(2);
    expect(circles.find((circle) => circle.rewardProgramId === "program-1")).toMatchObject({
      verifiedUnits: 10,
      pendingUnits: 0,
      rewardAvailable: true,
    });
    expect(circles.find((circle) => circle.rewardProgramId === "program-2")).toMatchObject({
      verifiedUnits: 0,
      pendingUnits: 2,
      rewardAvailable: false,
    });
  });

  it("rejects inconsistent reward state instead of deriving it from the unit count", () => {
    expect(() =>
      projectCustomerCircles(
        [
          {
            businessId: "biz-1",
            businessName: "Café Lumière",
            rewardProgramId: "program-1",
            programmeName: "Coffee Circle",
            qualifyingItemName: "coffee",
            cycleId: "cycle-1",
            cycleNumber: 1,
            cycleState: "active",
            verifiedUnits: 10,
            rewardAvailable: false,
            rewardDescription: null,
          },
        ],
        [],
      ),
    ).toThrow("authoritative reward state");
  });
});
