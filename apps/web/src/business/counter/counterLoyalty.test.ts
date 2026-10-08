import { describe, expect, it } from "vitest";
import { formatOrdinal, isLoyaltyNumberComplete, toLoyaltyView } from "./counterLoyalty";

const ctx = (
  overrides: Partial<Parameters<typeof toLoyaltyView>[0]> = {},
): Parameters<typeof toLoyaltyView>[0] => ({
  verifiedUnits: 8,
  requiredVerifiedUnits: 10,
  rewardStatus: "none",
  awaitingCustomerConfirmationUnits: 0,
  ...overrides,
});

describe("toLoyaltyView — restates the server's numbers, never computes progress", () => {
  it("normal progress", () => {
    expect(toLoyaltyView(ctx())).toEqual({
      kind: "progress",
      verifiedUnits: 8,
      requiredVerifiedUnits: 10,
      remainingUnits: 2,
      nearReward: false,
      awaitingUnits: 0,
    });
  });

  it("one to go is 'near' but still just verified progress", () => {
    expect(toLoyaltyView(ctx({ verifiedUnits: 9 }))).toMatchObject({
      kind: "progress",
      remainingUnits: 1,
      nearReward: true,
    });
  });

  it("awaiting units are reported separately and NEVER added to verified (9 + 1 awaiting is not 10)", () => {
    const view = toLoyaltyView(ctx({ verifiedUnits: 9, awaitingCustomerConfirmationUnits: 1 }));
    expect(view).toMatchObject({ kind: "progress", verifiedUnits: 9, awaitingUnits: 1 });
    expect(view).not.toMatchObject({ verifiedUnits: 10 });
    expect((view as { remainingUnits: number }).remainingUnits).toBe(1);
  });

  it("the reward state is the server's flag alone — a full count without the flag is not a reward", () => {
    expect(toLoyaltyView(ctx({ verifiedUnits: 10, rewardStatus: "none" })).kind).toBe("progress");
    expect(toLoyaltyView(ctx({ verifiedUnits: 3, rewardStatus: "available" }))).toEqual({
      kind: "reward",
      rewardOrdinalNumber: 11,
    });
  });

  it("clamps nonsense for display only (never negative, never above the requirement)", () => {
    expect(toLoyaltyView(ctx({ verifiedUnits: 14 }))).toMatchObject({
      verifiedUnits: 10,
      remainingUnits: 0,
    });
    expect(
      toLoyaltyView(ctx({ verifiedUnits: -2, awaitingCustomerConfirmationUnits: -1 })),
    ).toMatchObject({ verifiedUnits: 0, awaitingUnits: 0 });
  });
});

describe("formatOrdinal", () => {
  it.each([
    [1, "en", "1st"],
    [2, "en", "2nd"],
    [3, "en", "3rd"],
    [11, "en", "11th"],
    [12, "en", "12th"],
    [13, "en", "13th"],
    [21, "en", "21st"],
    [11, "fr", "11e"],
    [1, "fr", "1er"],
    [6, "fr-FR", "6e"],
  ])("%s in %s is %s", (value, language, expected) => {
    expect(formatOrdinal(value, language)).toBe(expected);
  });
});

describe("isLoyaltyNumberComplete", () => {
  it.each([
    ["ABC234", true],
    ["ABC-234", true],
    ["abc 234", true],
    ["ABC–234", true],
    ["ABC23", false],
    ["ABC2345", false],
    ["", false],
  ])("%j → %s", (value, expected) => {
    expect(isLoyaltyNumberComplete(value)).toBe(expected);
  });
});
