/**
 * AUTH-03 — registration / sign-in orchestration (unit).
 *
 * Pure orchestration logic, exercised with injected doubles for every
 * Customer Identity / resolution / idempotency dependency — no Firestore.
 * Proves the new-vs-returning branch, the sign-in access-state gate, the
 * credential-keyed registration composition (distinct create/link keys and
 * event ids), the request-level idempotency gate (acquired / duplicate-replay /
 * in-progress-conflict), safe-key validation, and — per the AUTH-BP §12 /
 * AUTH-01 boundary — that AUTH-03 issues a session but never emits
 * `CustomerAuthenticated` (no emit seam exists on this service).
 *
 * Concurrency and partial-failure resume are proven against the real emulator
 * (see `registrationSignInService.emulator.test.ts`), not mocks.
 */

import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import { AuthenticationDomainError } from "../models/authenticationErrors";
import {
  assertSafeIdempotencyKey,
  registerOrSignIn,
  type RegistrationSignInDeps,
} from "./registrationSignInService";
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

/** Default idempotency seams: the request key is freshly acquired; no create record yet. */
function idem(overrides: Partial<RegistrationSignInDeps> = {}): RegistrationSignInDeps {
  return {
    reserveIdempotencyKey: vi.fn().mockResolvedValue({ outcome: "acquired" }),
    completeIdempotencyKey: vi.fn().mockResolvedValue(undefined),
    failIdempotencyKey: vi.fn().mockResolvedValue(undefined),
    peekIdempotencyKey: vi.fn().mockResolvedValue({ outcome: "new" }),
    ...overrides,
  };
}

describe("registerOrSignIn — returning user (resolved)", () => {
  it("signs in an active resolved identity and issues a session (no identity mutation)", async () => {
    const createIdentity = vi.fn();
    const linkReference = vi.fn();
    const deps = idem({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_1",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_1", "active")),
      createIdentity,
      linkReference,
    });

    const outcome = await registerOrSignIn(db, credential(), envelope, command, deps);

    expect(outcome.mode).toBe("signed_in");
    expect(outcome.customerIdentityId).toBe("cust_1");
    expect(outcome.session.customerIdentityId).toBe("cust_1");
    expect(outcome.session.issuedAt).toEqual(command.issuedAt);
    expect(createIdentity).not.toHaveBeenCalled();
    expect(linkReference).not.toHaveBeenCalled();
    // The completed command is cached for replay.
    expect(deps.completeIdempotencyKey).toHaveBeenCalledTimes(1);
  });

  it("fails closed with ACCOUNT_SUSPENDED for a suspended identity (no session)", async () => {
    const deps = idem({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_s",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_s", "suspended")),
    });

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) => e instanceof AuthenticationDomainError && e.category === "ACCOUNT_SUSPENDED",
    );
    // A failed command releases the key for retry.
    expect(deps.failIdempotencyKey).toHaveBeenCalledTimes(1);
  });

  it("fails closed with AUTH_FORBIDDEN for a locked identity", async () => {
    const deps = idem({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_l",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_l", "locked")),
    });

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) => e instanceof AuthenticationDomainError && e.category === "AUTH_FORBIDDEN",
    );
  });

  it("fails closed with AUTH_FORBIDDEN for any other non-active status (e.g. closed)", async () => {
    const deps = idem({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_c",
        credential: credential(),
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_c", "closed")),
    });

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) => e instanceof AuthenticationDomainError && e.category === "AUTH_FORBIDDEN",
    );
  });
});

describe("registerOrSignIn — new user (unregistered)", () => {
  it("registers via -01 then -08, credential-keyed, and issues a session (mode registered)", async () => {
    const generated = "cust_new_gen";
    const createIdentity = vi.fn().mockResolvedValue(identityWithStatus(generated, "active"));
    const linkReference = vi.fn().mockResolvedValue(identityWithStatus(generated, "active"));
    const deps = idem({
      resolve: vi.fn().mockResolvedValue({ outcome: "unregistered", credential: credential() }),
      createIdentity,
      linkReference,
      generateCustomerIdentityId: () => generated,
    });

    const outcome = await registerOrSignIn(db, credential(), envelope, command, deps);

    expect(outcome.mode).toBe("registered");
    expect(outcome.customerIdentityId).toBe(generated);

    const createArg = createIdentity.mock.calls[0]![1];
    const linkArg = linkReference.mock.calls[0]![1];
    expect(createArg.customerIdentityId).toBe(generated);
    expect(createArg.initialAuthenticationReference).toMatchObject({
      referenceId: "authuid_abc",
      referenceType: "phone_otp",
    });

    // Registration idempotency is keyed by the CREDENTIAL (not the client key),
    // so concurrent registrations for the same reference serialise on it.
    expect(createArg.idempotencyKey).toBe(
      "authentication.register:phone_otp:authuid_abc:identity.create",
    );
    expect(linkArg.idempotencyKey).toBe(
      "authentication.register:phone_otp:authuid_abc:identity.linkAuthenticationReference",
    );
    expect(createArg.idempotencyKey).not.toBe(linkArg.idempotencyKey);

    // Distinct event ids so the outbox (keyed by eventId) does not overwrite.
    expect(createArg.eventId).not.toBe(linkArg.eventId);
    expect(createArg.eventId).toContain("evt_1");
    expect(linkArg.eventId).toContain("evt_1");
  });

  it("recovers the identity id from the durable create record on a resume (does not regenerate)", async () => {
    const createIdentity = vi.fn().mockResolvedValue(identityWithStatus("cust_original", "active"));
    const linkReference = vi.fn().mockResolvedValue(identityWithStatus("cust_original", "active"));
    const generate = vi.fn(() => "cust_SHOULD_NOT_BE_USED");
    const deps = idem({
      resolve: vi.fn().mockResolvedValue({ outcome: "unregistered", credential: credential() }),
      // The create step already completed on a prior attempt → recover its id.
      peekIdempotencyKey: vi.fn().mockResolvedValue({
        outcome: "duplicate",
        record: { resultReference: "users/cust_original" },
      }),
      createIdentity,
      linkReference,
      generateCustomerIdentityId: generate,
    });

    const outcome = await registerOrSignIn(db, credential(), envelope, command, deps);

    expect(outcome.customerIdentityId).toBe("cust_original");
    expect(generate).not.toHaveBeenCalled();
    expect(createIdentity.mock.calls[0]![1].customerIdentityId).toBe("cust_original");
  });

  it("propagates a cross-identity link conflict (fail closed) from -08", async () => {
    const conflict = new AuthenticationDomainError("VALIDATION_FAILED", "cross-identity conflict");
    const deps = idem({
      resolve: vi.fn().mockResolvedValue({ outcome: "unregistered", credential: credential() }),
      createIdentity: vi.fn().mockResolvedValue(identityWithStatus("cust_x", "active")),
      linkReference: vi.fn().mockRejectedValue(conflict),
      generateCustomerIdentityId: () => "cust_x",
    });

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toBe(
      conflict,
    );
    expect(deps.failIdempotencyKey).toHaveBeenCalledTimes(1);
  });
});

describe("registerOrSignIn — request-level idempotency gate", () => {
  it("replays the original registered outcome on a same-key duplicate (never switches to sign-in)", async () => {
    const resolve = vi.fn();
    const deps = idem({
      reserveIdempotencyKey: vi.fn().mockResolvedValue({
        outcome: "duplicate",
        record: {
          resultReference: "users/cust_orig",
          responseSnapshot: { mode: "registered", issuedAt: "2026-08-08T12:00:00.000Z" },
        },
      }),
      resolve,
    });

    const outcome = await registerOrSignIn(db, credential(), envelope, command, deps);

    expect(outcome.mode).toBe("registered");
    expect(outcome.customerIdentityId).toBe("cust_orig");
    expect(outcome.session.issuedAt).toEqual(new Date("2026-08-08T12:00:00.000Z"));
    // Replayed from cache — the command body never runs again.
    expect(resolve).not.toHaveBeenCalled();
  });

  it("fails closed with IDEMPOTENCY_CONFLICT on a concurrent same-key attempt (in_progress)", async () => {
    const deps = idem({
      reserveIdempotencyKey: vi.fn().mockResolvedValue({ outcome: "in_progress" }),
    });

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof AuthenticationDomainError && e.category === "IDEMPOTENCY_CONFLICT",
    );
  });

  it("fails closed with IDEMPOTENCY_CONFLICT when the key is reused with a different credential (conflict)", async () => {
    const deps = idem({
      reserveIdempotencyKey: vi
        .fn()
        .mockResolvedValue({ outcome: "conflict", error: { code: "IDEMPOTENCY_CONFLICT" } }),
    });

    await expect(registerOrSignIn(db, credential(), envelope, command, deps)).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof AuthenticationDomainError && e.category === "IDEMPOTENCY_CONFLICT",
    );
  });
});

describe("assertSafeIdempotencyKey", () => {
  it("rejects a path-bearing key before it reaches Firestore (VALIDATION_FAILED)", () => {
    expect(() => assertSafeIdempotencyKey("a/b")).toThrow(AuthenticationDomainError);
    try {
      assertSafeIdempotencyKey("a/b");
    } catch (e) {
      expect((e as AuthenticationDomainError).category).toBe("VALIDATION_FAILED");
    }
  });

  it("rejects empty, dot, over-long, and control/space keys; accepts a UUID", () => {
    expect(() => assertSafeIdempotencyKey("")).toThrow();
    expect(() => assertSafeIdempotencyKey(".")).toThrow();
    expect(() => assertSafeIdempotencyKey("..")).toThrow();
    expect(() => assertSafeIdempotencyKey("a b")).toThrow();
    expect(() => assertSafeIdempotencyKey("x".repeat(201))).toThrow();
    expect(() => assertSafeIdempotencyKey("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).not.toThrow();
  });
});
