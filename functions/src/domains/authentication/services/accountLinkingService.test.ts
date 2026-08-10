/**
 * AUTH-05 — account-linking orchestration (unit).
 *
 * Pure orchestration logic, exercised with injected doubles for the AUTH-02
 * resolution and the merged `-08` link/unlink repository — no Firestore.
 * Proves the authentication-layer contribution AUTH-05 owns on top of `-08`:
 *
 *   - the *acting* credential is resolved to an identity and every `-08`
 *     mutation targets **that resolved identity** (never a client-supplied id)
 *     — the same-identity safety property (AUTH-BP §7 step 1);
 *   - an acting credential that resolves to no identity fails closed
 *     (`AUTH_REQUIRED`) before any link/unlink is attempted;
 *   - a cross-identity conflict from `-08` propagates unchanged (fail closed,
 *     never merged — AUTH-BP §7 step 3 / `DEC-AUTH-001` D-A3);
 *   - unlink surfaces `-08`'s ownership and last-reference invariants unchanged;
 *   - idempotency keys are derived deterministically and credential-bound, and
 *     no credential material is ever forwarded to `-08`.
 *
 * End-to-end behaviour against the real `-08`/Firestore transaction is proven
 * in `accountLinkingService.emulator.test.ts`, not here.
 */

import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import { AuthenticationDomainError } from "../models/authenticationErrors";
import { resolvedAuthResult, unregisteredAuthResult } from "../models/authResult";
import {
  authenticationReferenceLinkedToDifferentIdentityError,
  authenticationReferenceNotFoundError,
  lastAuthenticationReferenceCannotBeUnlinkedError,
  IdentityDomainError,
} from "../../identity/models/identityErrors";
import type { CustomerIdentity } from "../../identity/models/customerIdentity";
import {
  linkAuthenticationProvider,
  unlinkAuthenticationProvider,
  type AccountLinkingCommand,
  type AccountLinkingDeps,
} from "./accountLinkingService";

const db = {} as Firestore;

const actor = { actorType: "user", actorId: "acting-ref" } as const;

const envelope = {
  eventId: "evt_auth05_1",
  correlationId: "corr_auth05_1",
  actor,
  occurredAt: "2026-08-09T12:00:00.000Z",
};

const command: AccountLinkingCommand = {
  idempotencyKey: "link_req_key_1",
  requestedAt: new Date("2026-08-09T12:00:00.000Z"),
};

const ACTING_IDENTITY_ID = "identity-acting-001";
/** The one verified Firebase authUid the acting + new providers share (same principal). */
const SHARED_UID = "firebase-uid-shared-1";

function actingCredential() {
  return createAuthenticatedCredential({
    referenceType: "phone_otp",
    referenceId: SHARED_UID,
    verifiedAt: new Date("2026-08-09T12:00:00.000Z"),
    providerSignals: { signInProvider: "phone" },
  });
}

/** A second provider on the SAME verified Firebase principal (same uid). */
function newCredential() {
  return createAuthenticatedCredential({
    referenceType: "google_sign_in",
    referenceId: SHARED_UID,
    verifiedAt: new Date("2026-08-09T12:00:00.000Z"),
    providerSignals: { signInProvider: "google.com" },
  });
}

/** A provider verified for a DIFFERENT Firebase principal (different uid). */
function mismatchedNewCredential() {
  return createAuthenticatedCredential({
    referenceType: "google_sign_in",
    referenceId: "firebase-uid-other-2",
    verifiedAt: new Date("2026-08-09T12:00:00.000Z"),
    providerSignals: { signInProvider: "google.com" },
  });
}

function identity(id: string, status: CustomerIdentity["status"] = "active"): CustomerIdentity {
  return { id, status } as CustomerIdentity;
}

/** getIdentityById double returning an identity in the given access state. */
function loadsIdentity(id: string, status: CustomerIdentity["status"] = "active") {
  return vi.fn(async (_db: Firestore, requestedId: string) => identity(requestedId ?? id, status));
}

/** Resolve-double that maps the acting credential to ACTING_IDENTITY_ID. */
function resolvesActing() {
  return vi.fn(async (_db: Firestore, credential: ReturnType<typeof actingCredential>) =>
    resolvedAuthResult(ACTING_IDENTITY_ID, credential),
  );
}

describe("linkAuthenticationProvider", () => {
  it("links the new provider to the RESOLVED acting identity (same-identity safety)", async () => {
    const resolve = resolvesActing();
    const linkReference = vi.fn(async () => identity(ACTING_IDENTITY_ID));
    const deps: AccountLinkingDeps = {
      resolve,
      getIdentityById: loadsIdentity(ACTING_IDENTITY_ID),
      linkReference,
    };

    const outcome = await linkAuthenticationProvider(
      db,
      actingCredential(),
      newCredential(),
      envelope,
      command,
      deps,
    );

    expect(outcome).toEqual({
      operation: "linked",
      customerIdentityId: ACTING_IDENTITY_ID,
      reference: { referenceType: "google_sign_in", referenceId: SHARED_UID },
    });

    // The single -08 mutation targets the resolved acting identity — never a
    // client-supplied id — and carries only references, no credential material.
    expect(linkReference).toHaveBeenCalledTimes(1);
    const params = linkReference.mock.calls[0][1];
    expect(params.customerIdentityId).toBe(ACTING_IDENTITY_ID);
    expect(params.linkedBy).toBe(ACTING_IDENTITY_ID);
    expect(params.referenceType).toBe("google_sign_in");
    expect(params.referenceId).toBe(SHARED_UID);
    expect(params.authority).toBe("customer_initiated");
    expect(params.reason).toBe("customer_request");
    // Deterministic, credential-bound idempotency key + request hash.
    expect(params.idempotencyKey).toBe("authentication.link:link_req_key_1");
    expect(params.requestHash).toContain(ACTING_IDENTITY_ID);
    expect(params.requestHash).toContain(`google_sign_in:${SHARED_UID}`);
    // No token / provider-signal material forwarded to persistence.
    expect(JSON.stringify(params)).not.toContain("signInProvider");
  });

  it("fails closed (AUTH_REQUIRED) when the acting credential resolves to no identity", async () => {
    const resolve = vi.fn(async (_db: Firestore, credential: ReturnType<typeof actingCredential>) =>
      unregisteredAuthResult(credential),
    );
    const linkReference = vi.fn();
    const deps: AccountLinkingDeps = {
      resolve,
      getIdentityById: loadsIdentity(ACTING_IDENTITY_ID),
      linkReference,
    };

    await expect(
      linkAuthenticationProvider(db, actingCredential(), newCredential(), envelope, command, deps),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(linkReference).not.toHaveBeenCalled();
  });

  it("propagates a cross-identity conflict unchanged (fail closed, never merges)", async () => {
    const resolve = resolvesActing();
    const conflict = authenticationReferenceLinkedToDifferentIdentityError(
      "google_sign_in",
      "new-google-ref",
      ACTING_IDENTITY_ID,
      "identity-other-999",
    );
    const linkReference = vi.fn(async () => {
      throw conflict;
    });
    const deps: AccountLinkingDeps = {
      resolve,
      getIdentityById: loadsIdentity(ACTING_IDENTITY_ID),
      linkReference,
    };

    await expect(
      linkAuthenticationProvider(db, actingCredential(), newCredential(), envelope, command, deps),
    ).rejects.toBe(conflict);
  });

  it("rejects an unsafe idempotency key before resolving or touching -08", async () => {
    const resolve = resolvesActing();
    const linkReference = vi.fn();
    const deps: AccountLinkingDeps = {
      resolve,
      getIdentityById: loadsIdentity(ACTING_IDENTITY_ID),
      linkReference,
    };

    await expect(
      linkAuthenticationProvider(
        db,
        actingCredential(),
        newCredential(),
        envelope,
        { ...command, idempotencyKey: "../escape" },
        deps,
      ),
    ).rejects.toBeInstanceOf(AuthenticationDomainError);
    expect(resolve).not.toHaveBeenCalled();
    expect(linkReference).not.toHaveBeenCalled();
  });
});

describe("unlinkAuthenticationProvider", () => {
  const target = { referenceType: "google_sign_in", referenceId: "new-google-ref" } as const;

  it("unlinks a reference on the resolved acting identity", async () => {
    const resolve = resolvesActing();
    const unlinkReference = vi.fn(async () => identity(ACTING_IDENTITY_ID));
    const deps: AccountLinkingDeps = {
      resolve,
      getIdentityById: loadsIdentity(ACTING_IDENTITY_ID),
      unlinkReference,
    };

    const outcome = await unlinkAuthenticationProvider(
      db,
      actingCredential(),
      target,
      envelope,
      command,
      deps,
    );

    expect(outcome).toEqual({
      operation: "unlinked",
      customerIdentityId: ACTING_IDENTITY_ID,
      reference: { referenceType: "google_sign_in", referenceId: "new-google-ref" },
    });
    const params = unlinkReference.mock.calls[0][1];
    expect(params.customerIdentityId).toBe(ACTING_IDENTITY_ID);
    expect(params.unlinkedBy).toBe(ACTING_IDENTITY_ID);
    expect(params.idempotencyKey).toBe("authentication.unlink:link_req_key_1");
  });

  it("surfaces -08's last-reference invariant unchanged", async () => {
    const resolve = resolvesActing();
    const err = lastAuthenticationReferenceCannotBeUnlinkedError(ACTING_IDENTITY_ID);
    const unlinkReference = vi.fn(async () => {
      throw err;
    });
    const deps: AccountLinkingDeps = {
      resolve,
      getIdentityById: loadsIdentity(ACTING_IDENTITY_ID),
      unlinkReference,
    };

    await expect(
      unlinkAuthenticationProvider(db, actingCredential(), target, envelope, command, deps),
    ).rejects.toBe(err);
  });

  it("surfaces -08's ownership check (unlinking a non-owned reference is not-found)", async () => {
    const resolve = resolvesActing();
    const err = authenticationReferenceNotFoundError("new-google-ref");
    const unlinkReference = vi.fn(async () => {
      throw err;
    });
    const deps: AccountLinkingDeps = {
      resolve,
      getIdentityById: loadsIdentity(ACTING_IDENTITY_ID),
      unlinkReference,
    };

    await expect(
      unlinkAuthenticationProvider(db, actingCredential(), target, envelope, command, deps),
    ).rejects.toBeInstanceOf(IdentityDomainError);
  });
});

describe("acting-identity access-state gate (F1, AUTH-BP §7 step 1)", () => {
  const target = { referenceType: "google_sign_in", referenceId: "new-google-ref" } as const;

  it("link fails closed (ACCOUNT_SUSPENDED) when the acting identity is suspended, before any -08 mutation", async () => {
    const resolve = resolvesActing();
    const getIdentityById = loadsIdentity(ACTING_IDENTITY_ID, "suspended");
    const linkReference = vi.fn();
    const deps: AccountLinkingDeps = { resolve, getIdentityById, linkReference };

    await expect(
      linkAuthenticationProvider(db, actingCredential(), newCredential(), envelope, command, deps),
    ).rejects.toMatchObject({ category: "ACCOUNT_SUSPENDED" });
    expect(linkReference).not.toHaveBeenCalled();
  });

  it("link fails closed (AUTH_FORBIDDEN) when the acting identity is in any other non-active state", async () => {
    const resolve = resolvesActing();
    const getIdentityById = loadsIdentity(ACTING_IDENTITY_ID, "locked");
    const linkReference = vi.fn();
    const deps: AccountLinkingDeps = { resolve, getIdentityById, linkReference };

    await expect(
      linkAuthenticationProvider(db, actingCredential(), newCredential(), envelope, command, deps),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    expect(linkReference).not.toHaveBeenCalled();
  });

  it("unlink fails closed (ACCOUNT_SUSPENDED) when the acting identity is suspended, before any -08 mutation", async () => {
    const resolve = resolvesActing();
    const getIdentityById = loadsIdentity(ACTING_IDENTITY_ID, "suspended");
    const unlinkReference = vi.fn();
    const deps: AccountLinkingDeps = { resolve, getIdentityById, unlinkReference };

    await expect(
      unlinkAuthenticationProvider(db, actingCredential(), target, envelope, command, deps),
    ).rejects.toMatchObject({ category: "ACCOUNT_SUSPENDED" });
    expect(unlinkReference).not.toHaveBeenCalled();
  });

  it("unlink fails closed (AUTH_FORBIDDEN) when the acting identity is in any other non-active state", async () => {
    const resolve = resolvesActing();
    const getIdentityById = loadsIdentity(ACTING_IDENTITY_ID, "locked");
    const unlinkReference = vi.fn();
    const deps: AccountLinkingDeps = { resolve, getIdentityById, unlinkReference };

    await expect(
      unlinkAuthenticationProvider(db, actingCredential(), target, envelope, command, deps),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    expect(unlinkReference).not.toHaveBeenCalled();
  });

  it("F2 defense-in-depth: link fails closed when the new provider's verified uid differs from the acting uid, before any -08 mutation", async () => {
    const resolve = resolvesActing();
    const getIdentityById = loadsIdentity(ACTING_IDENTITY_ID, "active");
    const linkReference = vi.fn();
    const deps: AccountLinkingDeps = { resolve, getIdentityById, linkReference };

    await expect(
      linkAuthenticationProvider(
        db,
        actingCredential(),
        mismatchedNewCredential(),
        envelope,
        command,
        deps,
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    // The same-principal gate fires before -08 — no reference is ever written.
    expect(linkReference).not.toHaveBeenCalled();
  });

  it("F2 defense-in-depth: link proceeds when the new provider shares the acting verified uid (same Firebase principal)", async () => {
    const resolve = resolvesActing();
    const getIdentityById = loadsIdentity(ACTING_IDENTITY_ID, "active");
    const linkReference = vi.fn(async () => identity(ACTING_IDENTITY_ID));
    const deps: AccountLinkingDeps = { resolve, getIdentityById, linkReference };

    const outcome = await linkAuthenticationProvider(
      db,
      actingCredential(),
      newCredential(),
      envelope,
      command,
      deps,
    );

    expect(outcome.operation).toBe("linked");
    expect(linkReference).toHaveBeenCalledTimes(1);
  });

  it("link on an active acting identity proceeds to the -08 mutation", async () => {
    const resolve = resolvesActing();
    const getIdentityById = loadsIdentity(ACTING_IDENTITY_ID, "active");
    const linkReference = vi.fn(async () => identity(ACTING_IDENTITY_ID));
    const deps: AccountLinkingDeps = { resolve, getIdentityById, linkReference };

    const outcome = await linkAuthenticationProvider(
      db,
      actingCredential(),
      newCredential(),
      envelope,
      command,
      deps,
    );

    expect(outcome.operation).toBe("linked");
    expect(getIdentityById).toHaveBeenCalledWith(db, ACTING_IDENTITY_ID);
    expect(linkReference).toHaveBeenCalledTimes(1);
  });
});
