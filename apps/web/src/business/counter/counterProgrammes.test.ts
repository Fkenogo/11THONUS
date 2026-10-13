import { describe, expect, it } from "vitest";
import type { RewardProgramWithVersionsWire } from "../api/rewardProgramMutations";
import { toCounterProgrammes } from "./counterProgrammes";

function entry(overrides: {
  status?: string;
  currentVersionId?: string | null;
  withVersion?: boolean;
  extraVersion?: Record<string, unknown>;
}): RewardProgramWithVersionsWire {
  return {
    program: {
      id: "rp-1",
      displayName: "Coffees",
      status: overrides.status ?? "active",
      currentVersionId:
        overrides.currentVersionId === undefined ? "v-1" : overrides.currentVersionId,
      sharedLoyaltyNumberAllowed: false,
    },
    currentVersion:
      overrides.withVersion === false
        ? null
        : {
            multipleUnitsAllowed: true,
            bulkReviewThreshold: 7,
            qualifyingItems: [
              {
                qualifyingItemId: "i-1",
                itemNameAtVersion: "Black Coffee",
                knowledgeNodeIdAtVersion: null,
              },
            ],
            ...overrides.extraVersion,
          },
    draftVersion: null,
  } as unknown as RewardProgramWithVersionsWire;
}

describe("toCounterProgrammes (whitelist projection)", () => {
  it("keeps only id/name/multiple-units and each item's id + frozen name", () => {
    expect(toCounterProgrammes([entry({})])).toEqual([
      {
        id: "rp-1",
        name: "Coffees",
        multipleUnitsAllowed: true,
        items: [{ id: "i-1", name: "Black Coffee" }],
      },
    ]);
  });

  it("drops the Business Review threshold (and the legacy bulk threshold) even when the server sent them (Owner/Manager)", () => {
    const projected = toCounterProgrammes([
      entry({ extraVersion: { businessReviewQuantityThreshold: 5 } }),
    ]);
    const wire = JSON.stringify(projected);
    expect(wire).not.toMatch(/threshold/i);
    expect(wire).not.toContain("5");
    expect(wire).not.toContain("sharedLoyaltyNumberAllowed");
  });

  it("an absent threshold key changes nothing: it is not read, so it can never be interpreted as 'disabled'", () => {
    const withKey = toCounterProgrammes([
      entry({ extraVersion: { businessReviewQuantityThreshold: null } }),
    ]);
    const without = toCounterProgrammes([entry({})]);
    expect(withKey).toEqual(without);
  });

  it("offers only active programmes that have a published current version", () => {
    expect(toCounterProgrammes([entry({ status: "paused" })])).toEqual([]);
    expect(toCounterProgrammes([entry({ status: "draft", currentVersionId: null })])).toEqual([]);
    expect(toCounterProgrammes([entry({ withVersion: false })])).toEqual([]);
    expect(toCounterProgrammes([])).toEqual([]);
  });
});
