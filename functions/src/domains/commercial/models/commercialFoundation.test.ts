import { describe, expect, it } from "vitest";
import {
  COMMERCIAL_BUCKETS,
  COMMERCIAL_CURRENCIES,
  COMMERCIAL_LEDGER_ENTRY_TYPES,
  COMMERCIAL_MARKETS,
  COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR,
  MARKET_CURRENCY,
  accountingBalance,
  availableCapacity,
  isCommercialMarket,
  reservedUnits,
  type CommercialAccount,
} from "./commercialFoundation";

function account(overrides: Partial<CommercialAccount> = {}): CommercialAccount {
  return {
    businessId: "biz-1",
    settlementMarket: "BI",
    commercialEffectiveFrom: new Date("2026-01-01T00:00:00Z"),
    trialRemainingUnits: 0,
    paidBalanceUnits: 0,
    trialReservedUnits: 0,
    paidReservedUnits: 0,
    serviceRestriction: "none",
    paidServiceActivatedAt: null,
    version: 0,
    correlationId: "c",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

describe("Commercial foundation vocabulary (WP-COM-01)", () => {
  it("supports only the Burundi/Rwanda launch markets and BIF/RWF currencies", () => {
    expect([...COMMERCIAL_MARKETS]).toEqual(["BI", "RW"]);
    expect([...COMMERCIAL_CURRENCIES]).toEqual(["BIF", "RWF"]);
    expect(MARKET_CURRENCY).toEqual({ BI: "BIF", RW: "RWF" });
    expect(isCommercialMarket("BI")).toBe(true);
    expect(isCommercialMarket("KE")).toBe(false);
    expect(isCommercialMarket(undefined)).toBe(false);
  });

  it("keeps the governed canonical unit basis at USD 2 (200 minor) and defines no local price constant", async () => {
    expect(COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR).toBe(200);
    const mod = await import("./commercialFoundation");
    const names = Object.keys(mod).join(" ");
    expect(names).not.toMatch(/BIF|RWF_|LOCAL_UNIT_PRICE|FX|RATE/);
  });

  it("has two buckets and the design's nine ledger entry types", () => {
    expect([...COMMERCIAL_BUCKETS]).toEqual(["trial", "paid"]);
    expect([...COMMERCIAL_LEDGER_ENTRY_TYPES].sort()).toEqual(
      [
        "capacity_released",
        "capacity_reserved",
        "consumption",
        "consumption_reversal",
        "credit_adjustment",
        "credit_grant",
        "settlement_void_reversal",
        "trial_adjustment",
        "trial_grant",
      ].sort(),
    );
  });

  it("derives available capacity = accounting balance - reserved, representing negative values (no floor)", () => {
    const a = account({
      trialRemainingUnits: 3,
      trialReservedUnits: 1,
      paidBalanceUnits: -10,
      paidReservedUnits: 0,
    });
    expect(accountingBalance(a)).toBe(-7);
    expect(reservedUnits(a)).toBe(1);
    expect(availableCapacity(a)).toBe(-8);
  });

  it("has no subscription-tier / plan vocabulary", async () => {
    const mod = await import("./commercialFoundation");
    const vocabulary = JSON.stringify(
      Object.values(mod).filter((v) => typeof v !== "function"),
    ).toLowerCase();
    expect(vocabulary).not.toMatch(/tier|plan|subscription|premium|starter|pro\b/);
  });
});
