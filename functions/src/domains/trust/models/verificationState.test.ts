import { describe, expect, it } from "vitest";
import { createVerificationState } from "./verificationState";
import { TrustDomainError } from "./trustErrors";

describe("createVerificationState", () => {
  it("accepts both flags false (default/unverified state)", () => {
    const state = createVerificationState({ phoneVerified: false, emailVerified: false });
    expect(state).toEqual({ phoneVerified: false, emailVerified: false });
  });

  it("accepts a mix of verified flags", () => {
    const state = createVerificationState({ phoneVerified: true, emailVerified: false });
    expect(state).toEqual({ phoneVerified: true, emailVerified: false });
  });

  it("rejects a non-boolean phoneVerified value", () => {
    expect(() =>
      createVerificationState({ phoneVerified: "yes" as unknown as boolean, emailVerified: false }),
    ).toThrow(TrustDomainError);
  });

  it("rejects a non-boolean emailVerified value", () => {
    expect(() =>
      createVerificationState({ phoneVerified: false, emailVerified: 1 as unknown as boolean }),
    ).toThrow(TrustDomainError);
  });
});
