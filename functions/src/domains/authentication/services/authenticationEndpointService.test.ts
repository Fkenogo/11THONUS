/**
 * AUTH-03 — authentication endpoint composition (unit).
 *
 * Proves the endpoint verifies before orchestrating, threads a credential-free
 * envelope/command through, shapes a transport-safe result, and fails closed
 * on verification failure (orchestration never runs).
 */

import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import { authenticationRequiredError } from "../models/authenticationErrors";
import { createSessionContext } from "../models/sessionContext";
import type { TokenVerifierPort } from "../ports/tokenVerifierPort";
import { handleAuthenticate } from "./authenticationEndpointService";

const db = {} as Firestore;

function credential() {
  return createAuthenticatedCredential({
    referenceType: "phone_otp",
    referenceId: "authuid_abc",
    verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
    providerSignals: { signInProvider: "phone" },
  });
}

function verifierReturning(cred = credential()): TokenVerifierPort {
  return { verify: vi.fn().mockResolvedValue(cred) };
}

describe("handleAuthenticate", () => {
  it("verifies then orchestrates, returning a transport-safe (ISO, credential-free) result", async () => {
    const issuedAt = new Date("2026-08-08T12:00:00.000Z");
    const orchestrate = vi.fn().mockResolvedValue({
      mode: "signed_in",
      customerIdentityId: "cust_1",
      session: createSessionContext({
        customerIdentityId: "cust_1",
        credential: credential(),
        issuedAt,
      }),
    });

    const result = await handleAuthenticate(
      db,
      { rawToken: "raw.token.value", referenceType: "phone_otp", idempotencyKey: "req_1" },
      { verifier: verifierReturning(), orchestrate, now: () => issuedAt, newId: () => "id_x" },
    );

    expect(result).toEqual({
      mode: "signed_in",
      customerIdentityId: "cust_1",
      session: {
        customerIdentityId: "cust_1",
        authReference: { referenceType: "phone_otp", referenceId: "authuid_abc" },
        issuedAt: "2026-08-08T12:00:00.000Z",
      },
    });
    // No raw token leaks into the serialized result.
    expect(JSON.stringify(result)).not.toContain("raw.token.value");

    // The command bound the idempotency key to the verified credential.
    const command = orchestrate.mock.calls[0]![3];
    expect(command.idempotencyKey).toBe("req_1");
    expect(command.requestHash).toBe("authenticate:phone_otp:authuid_abc");
  });

  it("fails closed when verification fails — orchestration is never called", async () => {
    const orchestrate = vi.fn();
    const verifier: TokenVerifierPort = {
      verify: vi.fn().mockRejectedValue(authenticationRequiredError()),
    };

    await expect(
      handleAuthenticate(
        db,
        { rawToken: "", referenceType: "phone_otp", idempotencyKey: "req_1" },
        { verifier, orchestrate },
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(orchestrate).not.toHaveBeenCalled();
  });
});
