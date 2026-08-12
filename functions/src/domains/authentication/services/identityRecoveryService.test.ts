/**
 * AUTH-06 — identity-recovery credential-proof orchestration (unit).
 *
 * Proves the authentication-layer contribution in isolation (mocked seams):
 * the verified recovery provider credential is resolved to its OWNING identity
 * through the AUTH-02 resolver (`-09`), a proven `RecoveryProof` is constructed
 * for exactly that identity, and it is handed to the merged `-07`
 * `recoverCustomerIdentityByReference`. AUTH-06 owns no identity state, adds no
 * new error category, and derives the recovery target from the proof itself —
 * never from a caller-supplied id — so a caller can only recover the identity
 * that actually owns the proven provider.
 */

import { describe, expect, it, vi } from "vitest";
import {
  recoverAuthenticatedIdentity,
  type IdentityRecoveryEnvelope,
} from "./identityRecoveryService";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import { resolvedAuthResult, unregisteredAuthResult } from "../models/authResult";
import { AuthenticationDomainError } from "../models/authenticationErrors";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";
import type { EventActor } from "../../../shared/events/domainEvent";

const db = {} as never;
const actor: EventActor = { actorType: "user", actorId: "authuid_1" };
const at = new Date("2026-08-10T12:00:00.000Z");

function credential(referenceType: AuthenticationReferenceType, referenceId: string) {
  return createAuthenticatedCredential({
    referenceType,
    referenceId,
    verifiedAt: at,
    providerSignals: { signInProvider: referenceType },
  });
}

function envelope(): IdentityRecoveryEnvelope {
  return { eventId: "evt_1", correlationId: "corr_1", actor, occurredAt: at.toISOString() };
}

function command(idempotencyKey = "idem_1", proofReference = `pr_${idempotencyKey}`) {
  return { idempotencyKey, requestedAt: at, proofReference };
}

function identity(id: string, status: CustomerIdentity["status"] = "active"): CustomerIdentity {
  return { id, status } as CustomerIdentity;
}

describe("recoverAuthenticatedIdentity", () => {
  it("resolves the proven credential to its owning identity and hands an accepted proof to -07", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(resolvedAuthResult("cust_1", credential("phone_otp", "authuid_1")));
    const recover = vi.fn().mockResolvedValue(identity("cust_1"));

    const outcome = await recoverAuthenticatedIdentity(
      db,
      credential("phone_otp", "authuid_1"),
      envelope(),
      command(),
      { resolve, recover },
    );

    expect(outcome).toEqual({
      operation: "recovered",
      customerIdentityId: "cust_1",
      methodCategory: "phone_otp",
    });

    expect(recover).toHaveBeenCalledTimes(1);
    const params = recover.mock.calls[0][1];
    // Target is DERIVED from the proof (resolved owner), never client-supplied.
    expect(params.targetReference).toEqual({ type: "customer_identity_id", value: "cust_1" });
    expect(params.recoveryProof.result).toBe("accepted");
    expect(params.recoveryProof.methodCategory).toBe("phone_otp");
    expect(params.recoveryProof.targetCustomerIdentityId).toBe("cust_1");
    expect(params.recoveryProof.authority).toBe("customer_initiated");
    // The proof reference is the endpoint-supplied, verified-proof-bound value.
    expect(params.recoveryProof.proofReference).toBe("pr_idem_1");
    expect(params.recoveryProof.completedAt).toEqual(at);
  });

  it("maps google_sign_in to the linked_provider recovery method category", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(resolvedAuthResult("cust_2", credential("google_sign_in", "authuid_2")));
    const recover = vi.fn().mockResolvedValue(identity("cust_2"));

    const outcome = await recoverAuthenticatedIdentity(
      db,
      credential("google_sign_in", "authuid_2"),
      envelope(),
      command("idem_2"),
      { resolve, recover },
    );

    expect(outcome.methodCategory).toBe("linked_provider");
    expect(recover.mock.calls[0][1].recoveryProof.methodCategory).toBe("linked_provider");
  });

  it("maps email/password to linked_provider (not email_verification — password proves credential control, not mailbox verification) [AUTH-CORR-003]", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(resolvedAuthResult("cust_3", credential("email", "authuid_3")));
    const recover = vi.fn().mockResolvedValue(identity("cust_3"));

    const outcome = await recoverAuthenticatedIdentity(
      db,
      credential("email", "authuid_3"),
      envelope(),
      command("idem_3"),
      { resolve, recover },
    );

    expect(outcome.methodCategory).toBe("linked_provider");
    expect(recover.mock.calls[0][1].recoveryProof.methodCategory).toBe("linked_provider");
    // Never overclaims mailbox verification for a password proof.
    expect(recover.mock.calls[0][1].recoveryProof.methodCategory).not.toBe("email_verification");
  });

  it("fails closed (RESOURCE_NOT_FOUND) and never calls -07 when the credential resolves to no identity", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(unregisteredAuthResult(credential("phone_otp", "ghost")));
    const recover = vi.fn();

    await expect(
      recoverAuthenticatedIdentity(db, credential("phone_otp", "ghost"), envelope(), command(), {
        resolve,
        recover,
      }),
    ).rejects.toMatchObject({
      constructor: AuthenticationDomainError,
      category: "RESOURCE_NOT_FOUND",
    });
    expect(recover).not.toHaveBeenCalled();
  });

  it("rejects an unsafe idempotency key before any resolution or recovery", async () => {
    const resolve = vi.fn();
    const recover = vi.fn();

    await expect(
      recoverAuthenticatedIdentity(
        db,
        credential("phone_otp", "authuid_1"),
        envelope(),
        command("../etc/passwd"),
        {
          resolve,
          recover,
        },
      ),
    ).rejects.toBeInstanceOf(Error);
    expect(resolve).not.toHaveBeenCalled();
    expect(recover).not.toHaveBeenCalled();
  });

  it("propagates a -07 recovery-not-permitted error unchanged (does not swallow it)", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(resolvedAuthResult("cust_3", credential("phone_otp", "authuid_3")));
    const recover = vi.fn().mockRejectedValue(new Error("recovery_not_permitted"));

    await expect(
      recoverAuthenticatedIdentity(
        db,
        credential("phone_otp", "authuid_3"),
        envelope(),
        command("idem_3"),
        {
          resolve,
          recover,
        },
      ),
    ).rejects.toThrow("recovery_not_permitted");
  });

  it("namespaces the idempotency key and binds a deterministic request hash equal across retries", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(resolvedAuthResult("cust_4", credential("phone_otp", "authuid_4")));
    const recover = vi.fn().mockResolvedValue(identity("cust_4"));

    const run = () =>
      recoverAuthenticatedIdentity(
        db,
        credential("phone_otp", "authuid_4"),
        envelope(),
        command("idem_4"),
        {
          resolve,
          recover,
        },
      );
    await run();
    await run();

    const first = recover.mock.calls[0][1];
    const second = recover.mock.calls[1][1];
    expect(first.idempotencyKey).toBe("authentication.recover:idem_4");
    expect(first.requestHash).toBe(second.requestHash);
    expect(first.idempotencyKey).toBe(second.idempotencyKey);
    // Replaying the same (verified-proof-bound) reference reuses it verbatim —
    // this is what lets `-07` reject a replay of the same captured proof.
    expect(first.recoveryProof.proofReference).toBe(second.recoveryProof.proofReference);
  });

  it("carries no credential material on the constructed proof (reference only)", async () => {
    const resolve = vi
      .fn()
      .mockResolvedValue(resolvedAuthResult("cust_5", credential("phone_otp", "authuid_5")));
    const recover = vi.fn().mockResolvedValue(identity("cust_5"));

    await recoverAuthenticatedIdentity(
      db,
      credential("phone_otp", "authuid_5"),
      envelope(),
      command("idem_5", "authrec:opaque_digest"),
      { resolve, recover },
    );

    const proof = recover.mock.calls[0][1].recoveryProof;
    const serialised = JSON.stringify(proof);
    expect(serialised).not.toContain("rawToken");
    expect(proof.proofReference).toBe("authrec:opaque_digest");
  });
});
