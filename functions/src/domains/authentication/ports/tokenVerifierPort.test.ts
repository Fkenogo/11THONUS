import { describe, expect, it } from "vitest";
import type { TokenVerifierPort, RawProviderCredential } from "./tokenVerifierPort";
import {
  createAuthenticatedCredential,
  type AuthenticatedCredential,
} from "../models/authenticatedCredential";

/**
 * The port is a provider-neutral contract only (AUTH-01). AUTH-02 implements
 * the Firebase adapter. This test proves the contract is usable by a fake
 * conforming verifier — no Firebase, no provider logic here.
 */
describe("TokenVerifierPort (contract)", () => {
  it("is satisfiable by a provider-neutral fake yielding an AuthenticatedCredential", async () => {
    const fake: TokenVerifierPort = {
      verify: async (raw: RawProviderCredential): Promise<AuthenticatedCredential> =>
        createAuthenticatedCredential({
          referenceType: raw.referenceType,
          referenceId: `verified:${raw.rawToken.length}`,
          verifiedAt: new Date("2026-08-08T10:00:00.000Z"),
        }),
    };

    const result = await fake.verify({ referenceType: "phone_otp", rawToken: "opaque" });
    expect(result.referenceType).toBe("phone_otp");
    expect(result.referenceId).toBe("verified:6");
  });
});
