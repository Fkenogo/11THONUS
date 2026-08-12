import { describe, expect, it, vi } from "vitest";
import { registerWithEmailPassword, signInWithEmailPassword } from "./emailPasswordSignInFlow";
import {
  AuthenticateError,
  type AuthenticateOutcome,
  type AuthenticatePayload,
} from "./authenticateClient";

const auth = { id: "auth" } as never;

const outcome = (mode: AuthenticateOutcome["mode"]): AuthenticateOutcome => ({
  mode,
  customerIdentityId: "cid",
  session: {
    customerIdentityId: "cid",
    authReference: { referenceType: "email", referenceId: "authuid_e" },
    issuedAt: "2026-08-12T00:00:00.000Z",
  },
});

function fakeUser(token = "id-token-email") {
  return { user: { getIdToken: vi.fn(async () => token) } };
}

describe("emailPasswordSignInFlow (AUTH-CORR-003)", () => {
  it("registers a new Email/Password user and authenticates as an `email` credential", async () => {
    const register = vi.fn(async () => fakeUser());
    const calls: AuthenticatePayload[] = [];
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      calls.push(p);
      return outcome("registered");
    });

    const result = await registerWithEmailPassword(auth, "new@user.co", "pw123456", {
      callAuthenticate,
      register,
      newIdempotencyKey: () => "key-1",
    });

    expect(register).toHaveBeenCalledWith(auth, "new@user.co", "pw123456");
    expect(result.mode).toBe("registered");
    // Bridged to AUTH-03 with the derived `email` reference type; token passed once.
    expect(calls[0]).toMatchObject({ referenceType: "email", rawToken: "id-token-email" });
  });

  it("signs in a returning Email/Password user as an `email` credential", async () => {
    const signIn = vi.fn(async () => fakeUser());
    const callAuthenticate = vi.fn(async () => outcome("signed_in"));

    const result = await signInWithEmailPassword(auth, "back@user.co", "pw123456", {
      callAuthenticate,
      signIn,
      newIdempotencyKey: () => "key-2",
    });

    expect(signIn).toHaveBeenCalledWith(auth, "back@user.co", "pw123456");
    expect(result.mode).toBe("signed_in");
  });

  it("reuses one idempotency key across a transient retry (AUTH-03 replay gate preserved)", async () => {
    const seenKeys: string[] = [];
    let attempt = 0;
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      seenKeys.push(p.idempotencyKey);
      attempt += 1;
      if (attempt === 1) throw new AuthenticateError("unavailable");
      return outcome("signed_in");
    });

    await signInWithEmailPassword(auth, "back@user.co", "pw", {
      callAuthenticate,
      signIn: async () => fakeUser(),
      newIdempotencyKey: () => "stable-key",
    });

    expect(seenKeys).toEqual(["stable-key", "stable-key"]);
  });

  it("does not persist, log, or return the password", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const password = "sup3r-secret-pw";
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      // The password must never reach the backend payload.
      expect(JSON.stringify(p)).not.toContain(password);
      return outcome("signed_in");
    });

    const result = await signInWithEmailPassword(auth, "u@x.co", password, {
      callAuthenticate,
      signIn: async () => fakeUser(),
      newIdempotencyKey: () => "k",
    });

    expect(JSON.stringify(result)).not.toContain(password);
    for (const spy of [logSpy, errSpy]) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(password);
      }
    }
    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
