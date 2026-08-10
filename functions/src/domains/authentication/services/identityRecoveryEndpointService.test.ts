/**
 * AUTH-06 — identity-recovery endpoint composition (unit).
 *
 * Verifies that the endpoint verifies the recovery credential through the
 * AUTH-02 `TokenVerifierPort`, builds a governed envelope/command, delegates to
 * the AUTH-06 orchestration, and shapes a credential-free result. No Firestore;
 * the verifier and orchestration are injected doubles.
 */

import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { TokenVerifierPort, RawProviderCredential } from "../ports/tokenVerifierPort";
import {
  handleRecoverIdentity,
  type IdentityRecoveryEndpointDeps,
} from "./identityRecoveryEndpointService";

const db = {} as Firestore;

function verifierFor(): { verifier: TokenVerifierPort; verify: ReturnType<typeof vi.fn> } {
  const verify = vi.fn(async (raw: RawProviderCredential) =>
    createAuthenticatedCredential({
      referenceType: raw.referenceType,
      referenceId: `uid_${raw.rawToken}`,
      verifiedAt: new Date("2026-08-10T12:00:00.000Z"),
      providerSignals: { signInProvider: raw.referenceType },
    }),
  );
  return { verifier: { verify }, verify };
}

const fixedNow = new Date("2026-08-10T12:00:00.000Z");

describe("handleRecoverIdentity", () => {
  it("verifies the recovery credential and delegates, returning a credential-free result", async () => {
    const { verifier, verify } = verifierFor();
    const recover = vi.fn(async () => ({
      operation: "recovered" as const,
      customerIdentityId: "identity-1",
      methodCategory: "phone_otp" as const,
    }));
    const deps: IdentityRecoveryEndpointDeps = {
      verifier,
      recover,
      now: () => fixedNow,
      newId: () => "id-fixed",
    };

    const result = await handleRecoverIdentity(
      db,
      { rawToken: "recovery-token", referenceType: "phone_otp", idempotencyKey: "req-1" },
      deps,
    );

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith({ rawToken: "recovery-token", referenceType: "phone_otp" });

    // Delegated with the verified credential, a governed envelope, and the client key.
    expect(recover).toHaveBeenCalledTimes(1);
    const [, credential, envelope, command] = recover.mock.calls[0];
    expect(credential.referenceId).toBe("uid_recovery-token");
    expect(credential.referenceType).toBe("phone_otp");
    expect(envelope).toEqual({
      eventId: "id-fixed",
      correlationId: "id-fixed",
      actor: { actorType: "user", actorId: "uid_recovery-token" },
      occurredAt: fixedNow.toISOString(),
    });
    expect(command).toEqual({ idempotencyKey: "req-1", requestedAt: fixedNow });

    expect(result).toEqual({
      operation: "recovered",
      customerIdentityId: "identity-1",
      methodCategory: "phone_otp",
    });
    // No credential material on the transport result.
    expect(JSON.stringify(result)).not.toContain("recovery-token");
  });

  it("propagates a verifier failure (fail closed) without calling the orchestration", async () => {
    const verify = vi.fn(async () => {
      throw new Error("invalid_token");
    });
    const recover = vi.fn();
    const deps: IdentityRecoveryEndpointDeps = { verifier: { verify }, recover };

    await expect(
      handleRecoverIdentity(
        db,
        { rawToken: "bad", referenceType: "phone_otp", idempotencyKey: "req-2" },
        deps,
      ),
    ).rejects.toThrow("invalid_token");
    expect(recover).not.toHaveBeenCalled();
  });
});
