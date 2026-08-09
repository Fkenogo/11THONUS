import { describe, expect, it, vi } from "vitest";
import { confirmPhoneSignIn, startPhoneSignIn } from "./phoneSignInFlow";
import type { AuthenticateOutcome, CallAuthenticate } from "./authenticateClient";

const outcome: AuthenticateOutcome = {
  mode: "registered",
  customerIdentityId: "cid-p",
  session: {
    customerIdentityId: "cid-p",
    authReference: { referenceType: "phone_otp", referenceId: "uid-p" },
    issuedAt: "2026-08-09T00:00:00.000Z",
  },
};

describe("startPhoneSignIn", () => {
  it("delegates to signInWithPhoneNumber and returns its confirmation", async () => {
    const confirmation = { confirm: vi.fn() };
    const signInWithPhoneNumber = vi.fn(async () => confirmation);
    const auth = {} as never;
    const verifier = {} as never;

    const result = await startPhoneSignIn(auth, "+25760000000", verifier, {
      signInWithPhoneNumber,
    });

    expect(signInWithPhoneNumber).toHaveBeenCalledWith(auth, "+25760000000", verifier);
    expect(result).toBe(confirmation);
  });
});

describe("confirmPhoneSignIn", () => {
  it("confirms the code, then authenticates the user as phone_otp", async () => {
    const calls: string[] = [];
    const callAuthenticate: CallAuthenticate = async (payload) => {
      calls.push(payload.referenceType);
      expect(payload.rawToken).toBe("phone-id-token");
      return outcome;
    };
    const confirmation = {
      confirm: async (code: string) => {
        expect(code).toBe("123456");
        return { user: { getIdToken: async () => "phone-id-token" } };
      },
    };

    const result = await confirmPhoneSignIn(confirmation, "123456", { callAuthenticate });

    expect(calls).toEqual(["phone_otp"]);
    expect(result).toEqual(outcome);
  });
});
