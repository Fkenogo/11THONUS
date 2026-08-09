import { describe, expect, it } from "vitest";
import {
  isSafeAuthenticationIdempotencyKey,
  newAuthenticationIdempotencyKey,
} from "./idempotencyKey";

/**
 * The client key becomes a Firestore document id on the AUTH-03 backend
 * (`assertSafeIdempotencyKey`, `^[A-Za-z0-9._:-]+$`, ≤200, not `.`/`..`).
 * AUTH-04 must generate a key the backend provably accepts and never a key it
 * would fail closed on — these tests pin that contract on the client side.
 */
describe("newAuthenticationIdempotencyKey", () => {
  it("generates a key the AUTH-03 backend safe-key contract accepts", () => {
    const key = newAuthenticationIdempotencyKey();
    expect(isSafeAuthenticationIdempotencyKey(key)).toBe(true);
    // Mirror the backend contract directly, independent of our own predicate.
    expect(key).toMatch(/^[A-Za-z0-9._:-]+$/);
    expect(key.length).toBeGreaterThan(0);
    expect(key.length).toBeLessThanOrEqual(200);
  });

  it("generates a distinct key per call (one per sign-in attempt)", () => {
    const keys = new Set(Array.from({ length: 50 }, () => newAuthenticationIdempotencyKey()));
    expect(keys.size).toBe(50);
  });
});

describe("isSafeAuthenticationIdempotencyKey", () => {
  it("accepts a well-formed single-segment key", () => {
    expect(isSafeAuthenticationIdempotencyKey("a1b2c3-d4._:x")).toBe(true);
  });

  it("rejects keys the backend rejects (path, empty, dot, whitespace, over-long)", () => {
    expect(isSafeAuthenticationIdempotencyKey("a/b")).toBe(false);
    expect(isSafeAuthenticationIdempotencyKey("")).toBe(false);
    expect(isSafeAuthenticationIdempotencyKey(".")).toBe(false);
    expect(isSafeAuthenticationIdempotencyKey("..")).toBe(false);
    expect(isSafeAuthenticationIdempotencyKey("has space")).toBe(false);
    expect(isSafeAuthenticationIdempotencyKey("x".repeat(201))).toBe(false);
  });
});
