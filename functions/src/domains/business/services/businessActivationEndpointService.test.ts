/**
 * Business activation endpoint composition (unit).
 *
 * Proves the transport wiring in isolation (mocked seams, no Firestore):
 * the raw credential is verified once, the actor is resolved from that same
 * verified credential, genuinely-verified second-factor evidence is derived
 * from it (never invented), and the command receives the server-derived
 * administrator id — never a client-supplied one. Failures propagate
 * unchanged before the command ever runs.
 */

import { describe, expect, it, vi } from "vitest";
import { handleActivateBusinessAfterVerification } from "./businessActivationEndpointService";
import { createAuthenticatedCredential } from "../../authentication/models/authenticatedCredential";

const db = {} as never;

const NOW = new Date("2026-09-12T00:00:00.000Z");
const FRESH_AUTHENTICATED_AT = new Date("2026-09-11T23:59:00.000Z");
const STALE_AUTHENTICATED_AT = new Date("2026-09-11T23:00:00.000Z");

function credential(verifiedSecondFactor: boolean, authenticatedAt?: Date) {
  return createAuthenticatedCredential({
    referenceType: "phone_otp",
    referenceId: "authuid_admin",
    verifiedAt: new Date("2026-09-11T00:00:00.000Z"),
    providerSignals: { signInProvider: "phone" },
    verifiedSecondFactor,
    ...(authenticatedAt === undefined ? {} : { authenticatedAt }),
  });
}

function request() {
  return {
    rawToken: "raw-token",
    referenceType: "phone_otp" as const,
    businessId: "biz-1",
    idempotencyKey: "key_1",
  };
}

describe("handleActivateBusinessAfterVerification", () => {
  it("verifies once, resolves the actor from the verified credential, and delegates with server-derived authority", async () => {
    const verifier = {
      verify: vi.fn().mockResolvedValue(credential(true, FRESH_AUTHENTICATED_AT)),
    };
    const resolveActor = vi.fn().mockResolvedValue({ userId: "cust_admin" });
    const activate = vi.fn().mockResolvedValue({ outcome: "executed", result: {} });

    const outcome = await handleActivateBusinessAfterVerification(db, request(), {
      verifier,
      resolveActor,
      activate,
      now: () => NOW,
    });

    expect(verifier.verify).toHaveBeenCalledTimes(1);
    expect(resolveActor).toHaveBeenCalledTimes(1);
    expect(activate).toHaveBeenCalledTimes(1);
    const params = activate.mock.calls[0]![1];
    expect(params.adminUserId).toBe("cust_admin");
    expect(params.verifiedMfaSatisfied).toBe(true);
    expect(params.businessId).toBe("biz-1");
    expect(params.idempotencyKey).toBe("key_1");
    expect(params.requestHash).toBe("business.activateAfterVerification:biz-1:cust_admin");
    expect(outcome).toEqual({ outcome: "executed", result: {} });
  });

  it("passes verifiedMfaSatisfied:false through without deciding (the command denies)", async () => {
    const verifier = {
      verify: vi.fn().mockResolvedValue(credential(false, FRESH_AUTHENTICATED_AT)),
    };
    const resolveActor = vi.fn().mockResolvedValue({ userId: "cust_admin" });
    const activate = vi.fn().mockResolvedValue({ outcome: "denied", reason: "X" });

    await handleActivateBusinessAfterVerification(db, request(), {
      verifier,
      resolveActor,
      activate,
      now: () => NOW,
    });

    expect(activate.mock.calls[0]![1].verifiedMfaSatisfied).toBe(false);
  });

  it("rejects a stale authenticatedAt before the command runs (privileged freshness gate)", async () => {
    const verifier = {
      verify: vi.fn().mockResolvedValue(credential(true, STALE_AUTHENTICATED_AT)),
    };
    const resolveActor = vi.fn().mockResolvedValue({ userId: "cust_admin" });
    const activate = vi.fn();

    await expect(
      handleActivateBusinessAfterVerification(db, request(), {
        verifier,
        resolveActor,
        activate,
        now: () => NOW,
      }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(activate).not.toHaveBeenCalled();
  });

  it("rejects missing authenticatedAt evidence before the command runs", async () => {
    const verifier = { verify: vi.fn().mockResolvedValue(credential(true)) };
    const resolveActor = vi.fn().mockResolvedValue({ userId: "cust_admin" });
    const activate = vi.fn();

    await expect(
      handleActivateBusinessAfterVerification(db, request(), {
        verifier,
        resolveActor,
        activate,
        now: () => NOW,
      }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(activate).not.toHaveBeenCalled();
  });

  it("propagates verifier failure before actor resolution or activation", async () => {
    const verifier = { verify: vi.fn().mockRejectedValue(new Error("bad token")) };
    const resolveActor = vi.fn();
    const activate = vi.fn();

    await expect(
      handleActivateBusinessAfterVerification(db, request(), { verifier, resolveActor, activate }),
    ).rejects.toThrow("bad token");
    expect(resolveActor).not.toHaveBeenCalled();
    expect(activate).not.toHaveBeenCalled();
  });

  it("propagates actor-resolution failure before activation", async () => {
    const verifier = { verify: vi.fn().mockResolvedValue(credential(true)) };
    const resolveActor = vi.fn().mockRejectedValue(new Error("not eligible"));
    const activate = vi.fn();

    await expect(
      handleActivateBusinessAfterVerification(db, request(), { verifier, resolveActor, activate }),
    ).rejects.toThrow("not eligible");
    expect(activate).not.toHaveBeenCalled();
  });
});
