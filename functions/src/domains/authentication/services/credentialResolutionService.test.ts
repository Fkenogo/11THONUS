/**
 * AUTH-02 — Credential → identity resolution service (unit tests).
 *
 * Exercised at its injection seam: a test double stands in for the merged
 * `-09` `lookupCustomerIdentityByAuthenticationReference`, so these tests
 * prove *our* outcome mapping (resolved / unregistered / error propagation)
 * without a Firestore. The real wiring against a real Firestore emulator is
 * covered by `credentialResolutionService.emulator.test.ts`.
 */

import { describe, expect, it, vi } from "vitest";
import { resolveAuthenticatedCredential } from "./credentialResolutionService";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import {
  IdentityDomainError,
  identityLookupNotFoundError,
  malformedIdentityLookupError,
} from "../../identity/models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

const actor: EventActor = { actorType: "system", actorId: "system" };

const envelope = {
  eventId: "evt_auth_1",
  correlationId: "corr_auth_1",
  actor,
  occurredAt: "2026-08-08T12:00:00.000Z",
};

const credential = createAuthenticatedCredential({
  referenceType: "google_sign_in",
  referenceId: "authuid_xyz",
  verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
  providerSignals: { signInProvider: "google.com" },
});

// A Firestore is never touched in these unit tests — the lookup is faked.
const db = {} as never;

describe("resolveAuthenticatedCredential", () => {
  it("resolves a credential that maps to an existing identity (sign-in path)", async () => {
    const lookup = vi.fn().mockResolvedValue({
      customerIdentityId: "cust_1",
      status: "active",
      authenticationReferences: [],
    });

    const result = await resolveAuthenticatedCredential(db, credential, envelope, { lookup });

    expect(result).toEqual({
      outcome: "resolved",
      customerIdentityId: "cust_1",
      credential,
    });
  });

  it("maps a not-found lookup to the unregistered (registration) path", async () => {
    const lookup = vi
      .fn()
      .mockRejectedValue(identityLookupNotFoundError("authentication_reference"));

    const result = await resolveAuthenticatedCredential(db, credential, envelope, { lookup });

    expect(result).toEqual({ outcome: "unregistered", credential });
  });

  it("queries the lookup with purpose 'authentication' and the credential's reference", async () => {
    const lookup = vi.fn().mockResolvedValue({
      customerIdentityId: "cust_1",
      status: "active",
      authenticationReferences: [],
    });

    await resolveAuthenticatedCredential(db, credential, envelope, { lookup });

    expect(lookup).toHaveBeenCalledWith(db, {
      ...envelope,
      referenceType: "google_sign_in",
      referenceId: "authuid_xyz",
      purpose: "authentication",
    });
  });

  it("propagates a non-not-found identity error (e.g. malformed) unchanged", async () => {
    const lookup = vi
      .fn()
      .mockRejectedValue(malformedIdentityLookupError("authentication_reference", "bad"));

    await expect(
      resolveAuthenticatedCredential(db, credential, envelope, { lookup }),
    ).rejects.toBeInstanceOf(IdentityDomainError);
    await expect(
      resolveAuthenticatedCredential(db, credential, envelope, { lookup }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("propagates an unexpected error unchanged (fails closed, never swallows)", async () => {
    const boom = new Error("infrastructure failure");
    const lookup = vi.fn().mockRejectedValue(boom);

    await expect(resolveAuthenticatedCredential(db, credential, envelope, { lookup })).rejects.toBe(
      boom,
    );
  });
});
