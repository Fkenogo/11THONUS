import { describe, expect, it, vi } from "vitest";
import {
  AuthenticateError,
  authenticate,
  mapCallableErrorCode,
  type AuthenticateOutcome,
  type CallAuthenticate,
} from "./authenticateClient";
import { isSafeAuthenticationIdempotencyKey } from "./idempotencyKey";

const outcome: AuthenticateOutcome = {
  mode: "registered",
  customerIdentityId: "cid-1",
  session: {
    customerIdentityId: "cid-1",
    authReference: { referenceType: "phone_otp", referenceId: "uid-1" },
    issuedAt: "2026-08-09T00:00:00.000Z",
  },
};

describe("authenticate", () => {
  it("sends the verified ID token, provider type, and a backend-safe idempotency key", async () => {
    const calls: Array<Parameters<CallAuthenticate>[0]> = [];
    const callAuthenticate: CallAuthenticate = async (payload) => {
      calls.push(payload);
      return outcome;
    };

    const result = await authenticate(
      { getIdToken: async () => "id-token-abc", referenceType: "phone_otp" },
      { callAuthenticate },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].rawToken).toBe("id-token-abc");
    expect(calls[0].referenceType).toBe("phone_otp");
    expect(isSafeAuthenticationIdempotencyKey(calls[0].idempotencyKey)).toBe(true);
    expect(result).toEqual(outcome);
  });

  it("reuses the SAME idempotency key on a transient retry (consumes AUTH-03 replay)", async () => {
    const seenKeys: string[] = [];
    let attempt = 0;
    const callAuthenticate: CallAuthenticate = async (payload) => {
      seenKeys.push(payload.idempotencyKey);
      attempt += 1;
      if (attempt === 1) throw new AuthenticateError("unavailable");
      return outcome;
    };

    const result = await authenticate(
      { getIdToken: async () => "id-token-abc", referenceType: "google_sign_in" },
      { callAuthenticate },
    );

    expect(seenKeys).toHaveLength(2);
    expect(seenKeys[0]).toBe(seenKeys[1]); // same key ⇒ backend replays, never a divergent outcome
    expect(result).toEqual(outcome);
  });

  it("does not retry a non-transient failure — surfaces it immediately", async () => {
    const callAuthenticate = vi.fn<CallAuthenticate>(async () => {
      throw new AuthenticateError("auth_forbidden");
    });

    await expect(
      authenticate(
        { getIdToken: async () => "id-token-abc", referenceType: "phone_otp" },
        { callAuthenticate },
      ),
    ).rejects.toMatchObject({ code: "auth_forbidden" });
    expect(callAuthenticate).toHaveBeenCalledTimes(1);
  });

  it("retries a deadline-exceeded (timeout) failure reusing the same key (ambiguous result)", async () => {
    const seenKeys: string[] = [];
    let attempt = 0;
    const callAuthenticate: CallAuthenticate = async (payload) => {
      seenKeys.push(payload.idempotencyKey);
      attempt += 1;
      if (attempt === 1) throw new AuthenticateError("timeout");
      return outcome;
    };

    const result = await authenticate(
      { getIdToken: async () => "id-token-abc", referenceType: "phone_otp" },
      { callAuthenticate },
    );

    expect(seenKeys).toHaveLength(2);
    expect(seenKeys[0]).toBe(seenKeys[1]);
    expect(result).toEqual(outcome);
  });

  it("stops retrying after the bounded attempt limit and surfaces the transient error", async () => {
    const callAuthenticate = vi.fn<CallAuthenticate>(async () => {
      throw new AuthenticateError("unavailable");
    });

    await expect(
      authenticate(
        { getIdToken: async () => "id-token-abc", referenceType: "phone_otp" },
        { callAuthenticate },
      ),
    ).rejects.toMatchObject({ code: "unavailable" });
    expect(callAuthenticate).toHaveBeenCalledTimes(2);
  });

  it("returns no credential material (only mode/customerIdentityId/session)", async () => {
    const callAuthenticate: CallAuthenticate = async () => outcome;
    const result = await authenticate(
      { getIdToken: async () => "id-token-abc", referenceType: "phone_otp" },
      { callAuthenticate },
    );
    expect(Object.keys(result).sort()).toEqual(["customerIdentityId", "mode", "session"]);
    expect(JSON.stringify(result)).not.toContain("id-token-abc");
  });
});

describe("mapCallableErrorCode — enumeration-resistant transport mapping", () => {
  it("maps the AUTH-03 callable transport codes to stable client codes", () => {
    expect(mapCallableErrorCode("functions/unauthenticated")).toBe("auth_required");
    expect(mapCallableErrorCode("functions/permission-denied")).toBe("auth_forbidden");
    expect(mapCallableErrorCode("functions/not-found")).toBe("not_found");
    expect(mapCallableErrorCode("functions/invalid-argument")).toBe("validation_failed");
    expect(mapCallableErrorCode("functions/aborted")).toBe("conflict");
    expect(mapCallableErrorCode("functions/unavailable")).toBe("unavailable");
    expect(mapCallableErrorCode("functions/deadline-exceeded")).toBe("timeout");
  });

  it("maps internal/unknown codes to a single opaque failure (no leakage)", () => {
    expect(mapCallableErrorCode("functions/internal")).toBe("failed");
    expect(mapCallableErrorCode("something-else")).toBe("failed");
    expect(mapCallableErrorCode(undefined)).toBe("failed");
  });
});
