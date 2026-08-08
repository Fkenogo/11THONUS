/**
 * AUTH-03 — registration / sign-in orchestration (unit).
 *
 * Pure orchestration logic, exercised with injected doubles for every
 * Customer Identity / resolution dependency — no Firestore. Proves the
 * new-vs-returning branch, the sign-in access-state gate, the derived
 * (distinct) idempotency keys for the registration `-01`/`-08` composition,
 * and — per the AUTH-BP §12 / AUTH-01 boundary — that AUTH-03 issues a
 * session but never emits `CustomerAuthenticated` itself (no emit seam
 * exists on this service; that fire-and-forget trust signal is AUTH-08).
 */

import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import { AuthenticationDomainError } from "../models/authenticationErrors";
import { registerOrSignIn, type RegistrationSignInDeps } from "./registrationSignInService";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";

const db = {} as Firestore;

const actor = { actorType: "system", actorId: "system" } as const;

const envelope = {
  eventId: "evt_1",
  correlationId: "corr_1",
  actor,
  occurredAt: "2026-08-08T12:00:00.000Z",
};

const command = {
  idempotencyKey: "req_key_1",
  requestHash: "req_hash_1",
  issuedAt: new Date("2026-08-08T12:00:00.000Z"),
};

function credential() {
  return createAuthenticatedCredential({
    referenceType: "phone_otp",
    referenceId: "authuid_abc",
    verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
    providerSignals: { signInProvider: "phone" },
  });
}

function identityWithStatus(id: string, status: CustomerIdentity["status"]): CustomerIdentity {
  return {
    id,
    status,
    authenticationReferences: [{ referenceId: "authuid_abc", referenceType: "phone_otp" }],
  } as unknown as CustomerIdentity;
}

describe("registerOrSignIn — returning user (resolved)", () => {
  it("signs in an active resolved identity and issues a session (no identity mutation)", async () => {
    const createIdentity = vi.fn();
    const linkReference = vi.fn();
    const deps: RegistrationSignInDeps = {
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_1",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_1", "active")),
      createIdentity,
      linkReference,
    };

    const outcome = await registerOrSignIn(db, credential(), envelope, command, deps);

    expect(outcome.mode).toBe("signed_in");
    expect(outcome.customerIdentityId).toBe("cust_1");
    expect(outcome.session.customerIdentityId).toBe("cust_1");
    expect(outcome.session.authReference).toEqual({
      referenceType: "phone_otp",
      referenceId: "authuid_abc",
    });
    expect(outcome.session.issuedAt).toEqual(command.issuedAt);
    // No identity mutation on ordinary sign-in.
    expect(createIdentity).not.toHaveBeenCalled();
    expect(linkReference).not.toHaveBeenCalled();
  });

  it("fails closed with ACCOUNT_SUSPENDED for a suspended identity (no session)", async () => {
    const deps: RegistrationSignInDeps = {
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_s",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_s", "suspended")),
    };

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) => e instanceof AuthenticationDomainError && e.category === "ACCOUNT_SUSPENDED",
    );
  });

  it("fails closed with AUTH_FORBIDDEN for a locked identity", async () => {
    const deps: RegistrationSignInDeps = {
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_l",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_l", "locked")),
    };

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) => e instanceof AuthenticationDomainError && e.category === "AUTH_FORBIDDEN",
    );
  });

  it("fails closed with AUTH_FORBIDDEN for any other non-active status (e.g. closed)", async () => {
    const deps: RegistrationSignInDeps = {
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_c",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_c", "closed")),
    };

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) => e instanceof AuthenticationDomainError && e.category === "AUTH_FORBIDDEN",
    );
  });
});

describe("registerOrSignIn — new user (unregistered)", () => {
  it("registers via -01 then -08 and issues a session (mode registered)", async () => {
    const generated = "cust_new_gen";
    const createIdentity = vi.fn().mockResolvedValue(identityWithStatus(generated, "active"));
    const linkReference = vi.fn().mockResolvedValue(identityWithStatus(generated, "active"));
    const deps: RegistrationSignInDeps = {
      resolve: vi.fn().mockResolvedValue({ outcome: "unregistered", credential: credential() }),
      createIdentity,
      linkReference,
      generateCustomerIdentityId: () => generated,
    };

    const outcome = await registerOrSignIn(db, credential(), envelope, command, deps);

    expect(outcome.mode).toBe("registered");
    expect(outcome.customerIdentityId).toBe(generated);
    expect(outcome.session.customerIdentityId).toBe(generated);

    // -01 creation received the initial reference derived from the credential.
    expect(createIdentity).toHaveBeenCalledTimes(1);
    const createArg = createIdentity.mock.calls[0]![1];
    expect(createArg.customerIdentityId).toBe(generated);
    expect(createArg.initialAuthenticationReference).toMatchObject({
      referenceId: "authuid_abc",
      referenceType: "phone_otp",
    });

    // -08 established the authoritative reference for the same identity.
    expect(linkReference).toHaveBeenCalledTimes(1);
    const linkArg = linkReference.mock.calls[0]![1];
    expect(linkArg.customerIdentityId).toBe(generated);
    expect(linkArg.referenceId).toBe("authuid_abc");
    expect(linkArg.referenceType).toBe("phone_otp");

    // The two idempotent identity operations must not collide on one key.
    expect(createArg.idempotencyKey).not.toBe(linkArg.idempotencyKey);
    expect(createArg.idempotencyKey).toContain("req_key_1");
    expect(linkArg.idempotencyKey).toContain("req_key_1");

    // Each emitted event must carry a distinct eventId — the outbox is keyed by
    // eventId, so a shared id would overwrite CustomerIdentityRegistered.
    expect(createArg.eventId).not.toBe(linkArg.eventId);
    expect(createArg.eventId).toContain("evt_1");
    expect(linkArg.eventId).toContain("evt_1");
  });

  it("propagates a cross-identity link conflict (fail closed) from -08", async () => {
    const generated = "cust_new_conflict";
    const conflict = new AuthenticationDomainError("VALIDATION_FAILED", "cross-identity conflict");
    const deps: RegistrationSignInDeps = {
      resolve: vi.fn().mockResolvedValue({ outcome: "unregistered", credential: credential() }),
      createIdentity: vi.fn().mockResolvedValue(identityWithStatus(generated, "active")),
      linkReference: vi.fn().mockRejectedValue(conflict),
      generateCustomerIdentityId: () => generated,
    };

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toBe(
      conflict,
    );
  });
});
