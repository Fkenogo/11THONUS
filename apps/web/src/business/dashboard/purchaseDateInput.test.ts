import { afterEach, describe, expect, it } from "vitest";
import { resolvePurchaseDateInstant, todayDateInputValue } from "./purchaseDateInput";

/**
 * `process.env.TZ` genuinely changes what `Date`'s local getters/constructor
 * report on this runtime (verified directly: `new Date(...).getHours()` and
 * the local `Date(y, m, d, h)` constructor both respect a reassigned `TZ`
 * mid-process on Node). Using it lets these tests deterministically
 * simulate different business timezones without a timezone library and
 * without depending on the actual machine's configured zone.
 */
const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe("resolvePurchaseDateInstant — the reproduced bug", () => {
  it("UTC+2, morning: 'today' must not be rejected as a future instant", () => {
    process.env.TZ = "Etc/GMT-2"; // UTC+2 (POSIX Etc/GMT sign is flipped)
    // 09:00 UTC = 11:00 local (UTC+2) — well before local noon.
    const now = new Date("2026-09-16T09:00:00.000Z");
    const today = todayDateInputValue(now);
    const instant = resolvePurchaseDateInstant(today, now);
    // The old implementation sent `${date}T12:00:00.000Z` (noon UTC = 2pm
    // local), which is AFTER `now` here and would fail the server's
    // `purchaseDate > Date.now()` check. The fix must never exceed `now`.
    expect(new Date(instant).getTime()).toBeLessThanOrEqual(now.getTime());
    expect(instant).toBe(now.toISOString());
  });

  it("UTC+2, around local midday: 'today' still resolves to the real instant, not a synthetic future one", () => {
    process.env.TZ = "Etc/GMT-2";
    // 11:30 UTC = 13:30 local — straddles the old noon-UTC anchor.
    const now = new Date("2026-09-16T11:30:00.000Z");
    const today = todayDateInputValue(now);
    const instant = resolvePurchaseDateInstant(today, now);
    expect(new Date(instant).getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it("UTC+2, later in the day: 'today' resolves to the real instant", () => {
    process.env.TZ = "Etc/GMT-2";
    // 16:00 UTC = 18:00 local — after the old anchor would have "caught up".
    const now = new Date("2026-09-16T16:00:00.000Z");
    const today = todayDateInputValue(now);
    const instant = resolvePurchaseDateInstant(today, now);
    expect(new Date(instant).getTime()).toBeLessThanOrEqual(now.getTime());
    expect(instant).toBe(now.toISOString());
  });

  it("a historical date remains accepted (resolves comfortably in the past)", () => {
    process.env.TZ = "Etc/GMT-2";
    const now = new Date("2026-09-16T09:00:00.000Z");
    const instant = resolvePurchaseDateInstant("2026-09-10", now);
    expect(new Date(instant).getTime()).toBeLessThan(now.getTime());
  });

  it("a genuinely future calendar date still resolves to a future instant (server rejection remains meaningful)", () => {
    process.env.TZ = "Etc/GMT-2";
    const now = new Date("2026-09-16T09:00:00.000Z");
    const instant = resolvePurchaseDateInstant("2026-09-20", now);
    expect(new Date(instant).getTime()).toBeGreaterThan(now.getTime());
  });

  it("UTC (zero offset): 'today' resolves to the real instant regardless of time of day", () => {
    process.env.TZ = "UTC";
    const now = new Date("2026-09-16T01:00:00.000Z");
    const today = todayDateInputValue(now);
    const instant = resolvePurchaseDateInstant(today, now);
    expect(new Date(instant).getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it("a negative UTC offset (UTC-5): 'today' resolves to the real instant even just after local midnight", () => {
    process.env.TZ = "Etc/GMT+5"; // UTC-5 (POSIX sign flipped)
    // 04:30 UTC = 23:30 the PREVIOUS local day — exercises the local-date
    // boundary crossing the UTC day boundary in the opposite direction.
    const now = new Date("2026-09-16T04:30:00.000Z");
    const today = todayDateInputValue(now);
    expect(today).toBe("2026-09-15");
    const instant = resolvePurchaseDateInstant(today, now);
    expect(new Date(instant).getTime()).toBeLessThanOrEqual(now.getTime());
    expect(instant).toBe(now.toISOString());
  });

  it("a historical date under a negative UTC offset still resolves safely in the past", () => {
    process.env.TZ = "Etc/GMT+5";
    const now = new Date("2026-09-16T04:30:00.000Z");
    const instant = resolvePurchaseDateInstant("2026-09-10", now);
    expect(new Date(instant).getTime()).toBeLessThan(now.getTime());
  });
});

describe("todayDateInputValue", () => {
  it("reports the local calendar date, not the UTC calendar date, near the UTC day boundary", () => {
    process.env.TZ = "Etc/GMT-2"; // UTC+2
    // 23:30 UTC = 01:30 the NEXT local day.
    const now = new Date("2026-09-15T23:30:00.000Z");
    expect(todayDateInputValue(now)).toBe("2026-09-16");
  });
});
