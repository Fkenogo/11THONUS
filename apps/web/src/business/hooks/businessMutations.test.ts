import { describe, expect, it, vi } from "vitest";
import { keyForRequest, settleKeyOnError } from "./businessMutations";
import { createIdempotencyKeyHolder, type IdempotencyKeyHolder } from "../api/idempotencyKeyHolder";
import type { BusinessApiError } from "../api/businessCallableClient";

function fakeHolder(): IdempotencyKeyHolder & { clear: ReturnType<typeof vi.fn<() => void>> } {
  return { getKey: () => "irrelevant", clear: vi.fn<() => void>() };
}

function sequentialKeyHolder(): IdempotencyKeyHolder {
  let n = 0;
  return createIdempotencyKeyHolder(() => `key-${n++}`);
}

/**
 * `ENG-P3-002-CORR-EST-IDEMP-001-REVIEW`, Phase H/L: independent proof of the
 * client-side half of the correction's convergence property. The server
 * change (in-progress reservation -> retryable `TEMPORARY_UNAVAILABLE`,
 * mapped here to the client code `"unavailable"`) only prevents the
 * Package H duplicate-Business race if the client actually keeps the same
 * held idempotency key on that specific error and only that error family —
 * this test proves that behavior directly, without needing a live callable
 * or a rendered mutation hook.
 *
 * Asserts directly against a spied `holder.clear()` rather than inferring
 * retention from `getKey()`'s returned value — a review mutation
 * (`holder.clear()` called unconditionally) passed an earlier version of
 * this file that used a constant-string key factory for the "retains"
 * cases, because a cleared-then-regenerated constant key is indistinguishable
 * from a held one by value. Spying on the call itself has no such blind spot.
 */
describe("settleKeyOnError (createBusiness idempotency key retention)", () => {
  it("retains the held key on the retryable 'unavailable' code (in-progress reservation, mapped from TEMPORARY_UNAVAILABLE)", () => {
    const holder = fakeHolder();

    settleKeyOnError(holder, { code: "unavailable" } as BusinessApiError);

    expect(holder.clear).not.toHaveBeenCalled();
  });

  it("retains the held key on the retryable 'timeout' code", () => {
    const holder = fakeHolder();

    settleKeyOnError(holder, { code: "timeout" } as BusinessApiError);

    expect(holder.clear).not.toHaveBeenCalled();
  });

  it("discards the held key on a genuine, non-retryable conflict (materially different same-key request)", () => {
    const holder = fakeHolder();

    settleKeyOnError(holder, { code: "conflict" } as BusinessApiError);

    expect(holder.clear).toHaveBeenCalledOnce();
  });

  it("discards the held key on a definitive validation failure", () => {
    const holder = fakeHolder();

    settleKeyOnError(holder, { code: "validation_failed" } as BusinessApiError);

    expect(holder.clear).toHaveBeenCalledOnce();
  });

  it("discards the held key when the error carries no recognizable code (fail closed to a fresh key, never stuck replaying)", () => {
    const holder = fakeHolder();

    settleKeyOnError(holder, new Error("unexpected"));

    expect(holder.clear).toHaveBeenCalledOnce();
  });
});

/**
 * `PLATFORM-BASELINE-004A-CORR-001` (Codex review, P2): a single lifecycle
 * mutation hook instance serves every row of Team Management, so its held
 * key must be scoped to whichever target it was last issued for — a key
 * retained after a retryable failure against one member must never be
 * replayed against a different one (the server-side request hash binds the
 * key to the target, so a mismatched replay would deterministically return
 * a conflict instead of performing the newly requested action).
 */
describe("keyForRequest (target-scoped idempotency key rotation)", () => {
  it("reuses the same key across repeated calls for the same target (retry semantics preserved)", () => {
    const holder = sequentialKeyHolder();
    const lastSignature = { current: null as string | null };

    const first = keyForRequest(holder, lastSignature, "mem-A");
    const second = keyForRequest(holder, lastSignature, "mem-A");

    expect(second).toBe(first);
  });

  it("rotates to a fresh key when the target changes", () => {
    const holder = sequentialKeyHolder();
    const lastSignature = { current: null as string | null };

    const forA = keyForRequest(holder, lastSignature, "mem-A");
    const forB = keyForRequest(holder, lastSignature, "mem-B");

    expect(forB).not.toBe(forA);
  });

  it("does not rotate on the very first call (nothing held yet)", () => {
    const holder = fakeHolder();
    const lastSignature = { current: null as string | null };

    keyForRequest(holder, lastSignature, "mem-A");

    expect(holder.clear).not.toHaveBeenCalled();
  });

  it("keeps rotating correctly across an interleaved A/B/A sequence", () => {
    const holder = sequentialKeyHolder();
    const lastSignature = { current: null as string | null };

    const a1 = keyForRequest(holder, lastSignature, "mem-A");
    const b1 = keyForRequest(holder, lastSignature, "mem-B");
    const a2 = keyForRequest(holder, lastSignature, "mem-A");

    expect(b1).not.toBe(a1);
    expect(a2).not.toBe(b1);
  });
});
