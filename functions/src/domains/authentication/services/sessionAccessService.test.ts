/**
 * AUTH-07 — Session / access gating service (unit).
 *
 * The reusable server-side gates identity-protected actions consume:
 *
 *   - `authorizeIdentityProtectedAction` — resolve a *verified* credential to an
 *     existing, access-permitted identity and establish the `SessionContext`
 *     (session establishment + protected-action gate). Browsing never calls it.
 *   - `authorizePrivilegedAction` — the protected-action gate *plus* the
 *     server-enforced privileged re-authentication freshness gate (AUTH-BP §9,
 *     TRD12 §12.29).
 *
 * Exercised with injected doubles for the AUTH-02 resolver and the merged
 * `getCustomerIdentityById` — no Firestore. It consumes those responsibilities;
 * it does not duplicate resolution, access-state ownership, or the token store.
 * Per the AUTH-BP §12 / AUTH-01 boundary AUTH-07 emits **no** domain events
 * (`CustomerAuthenticated` stays AUTH-08) — there is no emit seam here.
 */

import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";
import {
  authorizeIdentityProtectedAction,
  authorizePrivilegedAction,
  type SessionAccessDeps,
} from "./sessionAccessService";

const db = {} as Firestore;

const envelope = {
  eventId: "evt_1",
  correlationId: "corr_1",
  actor: { actorType: "user", actorId: "authuid_abc" } as const,
  occurredAt: "2026-08-10T12:00:00.000Z",
};

const serverNow = new Date("2026-08-10T12:00:00.000Z");

function credential(authenticatedAt: Date | undefined = new Date("2026-08-10T11:58:00.000Z")) {
  return createAuthenticatedCredential({
    referenceType: "phone_otp",
    referenceId: "authuid_abc",
    verifiedAt: serverNow,
    authenticatedAt,
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

function deps(overrides: Partial<SessionAccessDeps> = {}): SessionAccessDeps {
  return {
    resolve: vi.fn().mockResolvedValue({
      outcome: "resolved",
      customerIdentityId: "cust_1",
      credential: credential(),
    }),
    getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_1", "active")),
    ...overrides,
  };
}

describe("authorizeIdentityProtectedAction — protected-action gate", () => {
  it("establishes a session for a verified credential resolving to an active identity", async () => {
    const session = await authorizeIdentityProtectedAction(db, credential(), envelope, deps(), {
      now: () => serverNow,
    });
    expect(session.customerIdentityId).toBe("cust_1");
    expect(session.authReference).toEqual({
      referenceType: "phone_otp",
      referenceId: "authuid_abc",
    });
    expect(session.issuedAt).toEqual(serverNow);
  });

  it("fails closed (AUTH_REQUIRED) when the credential resolves to no identity", async () => {
    const d = deps({
      resolve: vi.fn().mockResolvedValue({ outcome: "unregistered", credential: credential() }),
    });
    await expect(
      authorizeIdentityProtectedAction(db, credential(), envelope, d, { now: () => serverNow }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(d.getIdentityById).not.toHaveBeenCalled();
  });

  it("rejects a suspended identity (ACCOUNT_SUSPENDED, no session)", async () => {
    const d = deps({
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_1", "suspended")),
    });
    await expect(
      authorizeIdentityProtectedAction(db, credential(), envelope, d, { now: () => serverNow }),
    ).rejects.toMatchObject({ category: "ACCOUNT_SUSPENDED" });
  });

  it("rejects any other non-active identity (AUTH_FORBIDDEN, fail closed)", async () => {
    const d = deps({
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_1", "locked")),
    });
    await expect(
      authorizeIdentityProtectedAction(db, credential(), envelope, d, { now: () => serverNow }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });
});

describe("authorizePrivilegedAction — protected-action gate + freshness", () => {
  it("authorizes a privileged action for recent authentication (2 min ago, default 5 min)", async () => {
    const session = await authorizePrivilegedAction(db, credential(), envelope, deps(), {
      now: () => serverNow,
    });
    expect(session.customerIdentityId).toBe("cust_1");
  });

  it("rejects a privileged action when authentication is stale (30 min ago) even if just verified", async () => {
    const stale = credential(new Date(serverNow.getTime() - 30 * 60 * 1000));
    const d = deps({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_1",
        credential: stale,
      }),
    });
    await expect(
      authorizePrivilegedAction(db, stale, envelope, d, { now: () => serverNow }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("rejects a privileged action when authenticatedAt is absent (fail closed)", async () => {
    // Built without `authenticatedAt` (a default parameter would be substituted
    // for an explicit `undefined`, so construct it directly).
    const noAuthTime = createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: "authuid_abc",
      verifiedAt: serverNow,
      providerSignals: { signInProvider: "phone" },
    });
    const d = deps({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_1",
        credential: noAuthTime,
      }),
    });
    await expect(
      authorizePrivilegedAction(db, noAuthTime, envelope, d, { now: () => serverNow }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("enforces the access-state gate before freshness (suspended + stale → ACCOUNT_SUSPENDED)", async () => {
    const stale = credential(new Date(serverNow.getTime() - 30 * 60 * 1000));
    const d = deps({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_1",
        credential: stale,
      }),
      getIdentityById: vi.fn().mockResolvedValue(identityWithStatus("cust_1", "suspended")),
    });
    await expect(
      authorizePrivilegedAction(db, stale, envelope, d, { now: () => serverNow }),
    ).rejects.toMatchObject({ category: "ACCOUNT_SUSPENDED" });
  });

  it("honours a configurable freshness window (8 min ago passes under a 10-min policy)", async () => {
    const eightMinAgo = credential(new Date(serverNow.getTime() - 8 * 60 * 1000));
    const d = deps({
      resolve: vi.fn().mockResolvedValue({
        outcome: "resolved",
        customerIdentityId: "cust_1",
        credential: eightMinAgo,
      }),
    });
    const session = await authorizePrivilegedAction(db, eightMinAgo, envelope, d, {
      now: () => serverNow,
      maxAgeMs: 10 * 60 * 1000,
    });
    expect(session.customerIdentityId).toBe("cust_1");
  });
});
