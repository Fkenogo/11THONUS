import { describe, expect, it } from "vitest";
import { toCallAuthenticate } from "./authenticateCallable";
import { AuthenticateError, type AuthenticateOutcome } from "./authenticateClient";

const outcome: AuthenticateOutcome = {
  mode: "signed_in",
  customerIdentityId: "cid-9",
  session: {
    customerIdentityId: "cid-9",
    authReference: { referenceType: "google_sign_in", referenceId: "uid-9" },
    issuedAt: "2026-08-09T00:00:00.000Z",
  },
};

describe("toCallAuthenticate", () => {
  it("returns the callable's data on success", async () => {
    const call = toCallAuthenticate(async () => ({ data: outcome }));

    const result = await call({
      rawToken: "t",
      referenceType: "google_sign_in",
      idempotencyKey: "k",
    });

    expect(result).toEqual(outcome);
  });

  it("normalizes a FirebaseError code into a mapped AuthenticateError", async () => {
    const call = toCallAuthenticate(async () => {
      throw Object.assign(new Error("permission denied for reasons"), {
        code: "functions/permission-denied",
      });
    });

    await expect(
      call({ rawToken: "t", referenceType: "phone_otp", idempotencyKey: "k" }),
    ).rejects.toBeInstanceOf(AuthenticateError);
    await expect(
      call({ rawToken: "t", referenceType: "phone_otp", idempotencyKey: "k" }),
    ).rejects.toMatchObject({ code: "auth_forbidden" });
  });

  it("collapses an unknown error into an opaque failure (no server message leaked)", async () => {
    const call = toCallAuthenticate(async () => {
      throw new Error("internal stack trace with secrets");
    });

    await expect(
      call({ rawToken: "t", referenceType: "phone_otp", idempotencyKey: "k" }),
    ).rejects.toMatchObject({ code: "failed" });
  });
});
