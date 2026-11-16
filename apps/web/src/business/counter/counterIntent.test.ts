import { describe, expect, it, vi } from "vitest";
import {
  counterIntentSignature,
  createCounterIntentHolder,
  type CounterIntentInput,
} from "./counterIntent";

const base: CounterIntentInput = {
  rewardProgramId: "rp-1",
  qualifyingItemId: "item-1",
  quantity: 1,
  artifact: { kind: "loyalty_number", value: "abc-234" },
};

function setup() {
  let tick = 0;
  let keyN = 0;
  const resolvePurchaseDate = vi.fn((_input: string, instant: Date) => instant.toISOString());
  const holder = createCounterIntentHolder({
    now: () => new Date(Date.UTC(2026, 9, 7, 10, 0, tick++)),
    newKey: () => `key-${keyN++}`,
    resolvePurchaseDate,
    todayDateInput: () => "2026-10-07",
  });
  return { holder, resolvePurchaseDate };
}

describe("counter transaction intent (purchaseDate + payload + idempotency key together)", () => {
  it("captures purchaseDate ONCE: preparing the same transaction again never re-resolves the date", () => {
    const { holder, resolvePurchaseDate } = setup();
    const first = holder.prepare(base);
    const retry = holder.prepare({ ...base }); // an uncertain-failure retry
    const retryAgain = holder.prepare({ ...base });
    expect(resolvePurchaseDate).toHaveBeenCalledTimes(1);
    expect(retry).toBe(first);
    expect(retryAgain.request.purchaseDate).toBe(first.request.purchaseDate);
  });

  it("an unchanged transaction keeps the SAME idempotency key and exact payload", () => {
    const { holder } = setup();
    const first = holder.prepare(base);
    const retry = holder.prepare(base);
    expect(retry.idempotencyKey).toBe(first.idempotencyKey);
    expect(retry.request).toEqual(first.request);
  });

  it("case/whitespace variants of the same Loyalty Number are the same transaction", () => {
    const { holder, resolvePurchaseDate } = setup();
    const a = holder.prepare(base);
    const b = holder.prepare({
      ...base,
      artifact: { kind: "loyalty_number", value: "  ABC-234 " },
    });
    expect(b).toBe(a);
    expect(resolvePurchaseDate).toHaveBeenCalledTimes(1);
    expect(a.request.loyaltyNumberValue).toBe("ABC-234");
  });

  it.each<[string, Partial<CounterIntentInput>]>([
    ["programme", { rewardProgramId: "rp-2" }],
    ["item", { qualifyingItemId: "item-2" }],
    ["quantity", { quantity: 2 }],
    ["artifact value", { artifact: { kind: "loyalty_number", value: "XYZ-345" } }],
    ["artifact kind", { artifact: { kind: "qr_identity", value: "abc-234" } }],
  ])("a changed %s starts a fresh intent (new date, new key)", (_name, patch) => {
    const { holder, resolvePurchaseDate } = setup();
    const first = holder.prepare(base);
    const changed = holder.prepare({ ...base, ...patch });
    expect(changed).not.toBe(first);
    expect(changed.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(changed.signature).not.toBe(first.signature);
    expect(resolvePurchaseDate).toHaveBeenCalledTimes(2);
  });

  it("discard (Serve next customer / a definitive outcome) starts a fresh lifecycle even for identical input", () => {
    const { holder, resolvePurchaseDate } = setup();
    const first = holder.prepare(base);
    expect(holder.current()).toBe(first);
    holder.discard();
    expect(holder.current()).toBeNull();
    const next = holder.prepare(base);
    expect(next.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(next.request.purchaseDate).not.toBe(first.request.purchaseDate);
    expect(resolvePurchaseDate).toHaveBeenCalledTimes(2);
  });

  it("builds exactly one artifact field, from the scan or the typed number", () => {
    const { holder } = setup();
    const typed = holder.prepare(base);
    expect(typed.request.loyaltyNumberValue).toBe("ABC-234");
    expect(typed.request).not.toHaveProperty("qrReference");
    holder.discard();
    const scanned = holder.prepare({
      ...base,
      artifact: { kind: "qr_identity", value: "opaqueRef_9" },
    });
    expect(scanned.request.qrReference).toBe("opaqueRef_9");
    expect(scanned.request).not.toHaveProperty("loyaltyNumberValue");
  });

  it("the signature is stable and covers every transaction-defining input", () => {
    expect(counterIntentSignature(base)).toBe(counterIntentSignature({ ...base }));
    expect(
      new Set([
        counterIntentSignature(base),
        counterIntentSignature({ ...base, quantity: 3 }),
        counterIntentSignature({ ...base, rewardProgramId: "x" }),
      ]).size,
    ).toBe(3);
  });
});
