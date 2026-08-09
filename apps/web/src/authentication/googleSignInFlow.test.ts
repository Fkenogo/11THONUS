import { describe, expect, it, vi } from "vitest";
import { signInWithGoogle } from "./googleSignInFlow";
import type { AuthenticateOutcome, CallAuthenticate } from "./authenticateClient";

const outcome: AuthenticateOutcome = {
  mode: "signed_in",
  customerIdentityId: "cid-g",
  session: {
    customerIdentityId: "cid-g",
    authReference: { referenceType: "google_sign_in", referenceId: "uid-g" },
    issuedAt: "2026-08-09T00:00:00.000Z",
  },
};

describe("signInWithGoogle", () => {
  it("runs the Google popup, then authenticates the user as google_sign_in", async () => {
    const seen: string[] = [];
    const callAuthenticate: CallAuthenticate = async (payload) => {
      seen.push(payload.referenceType);
      expect(payload.rawToken).toBe("google-id-token");
      return outcome;
    };
    const signIn = vi.fn(async () => ({ user: { getIdToken: async () => "google-id-token" } }));
    const auth = {} as never;

    const result = await signInWithGoogle(auth, { signIn, callAuthenticate });

    expect(signIn).toHaveBeenCalledWith(auth);
    expect(seen).toEqual(["google_sign_in"]);
    expect(result).toEqual(outcome);
  });

  it("propagates a provider popup failure without calling the backend", async () => {
    const callAuthenticate = vi.fn<CallAuthenticate>(async () => outcome);
    const signIn = vi.fn(async () => {
      throw new Error("popup closed");
    });

    await expect(signInWithGoogle({} as never, { signIn, callAuthenticate })).rejects.toThrow(
      "popup closed",
    );
    expect(callAuthenticate).not.toHaveBeenCalled();
  });
});
