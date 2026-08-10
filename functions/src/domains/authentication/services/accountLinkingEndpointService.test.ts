/**
 * AUTH-05 — account-linking endpoint composition (unit).
 *
 * Verifies that the endpoint verifies the acting credential (always) and the
 * new credential (link only) through the AUTH-02 `TokenVerifierPort`, builds a
 * governed envelope/command, delegates to the orchestration, and shapes a
 * credential-free result. No Firestore; the verifier and orchestration are
 * injected doubles.
 */

import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { TokenVerifierPort, RawProviderCredential } from "../ports/tokenVerifierPort";
import {
  handleLinkProvider,
  handleUnlinkProvider,
  type AccountLinkingEndpointDeps,
} from "./accountLinkingEndpointService";

const db = {} as Firestore;

/** A verifier double keyed by raw token → reference id/type, recording inputs. */
function verifierFor(): { verifier: TokenVerifierPort; verify: ReturnType<typeof vi.fn> } {
  const verify = vi.fn(async (raw: RawProviderCredential) =>
    createAuthenticatedCredential({
      referenceType: raw.referenceType,
      referenceId: `${raw.referenceType}:${raw.rawToken}`,
      verifiedAt: new Date("2026-08-09T12:00:00.000Z"),
      providerSignals: { signInProvider: raw.referenceType },
    }),
  );
  return { verifier: { verify }, verify };
}

const fixedNow = new Date("2026-08-09T12:00:00.000Z");

describe("handleLinkProvider", () => {
  it("verifies both credentials and delegates the link, returning a credential-free result", async () => {
    const { verifier, verify } = verifierFor();
    const linkProvider = vi.fn(async () => ({
      operation: "linked" as const,
      customerIdentityId: "identity-1",
      reference: { referenceType: "google_sign_in" as const, referenceId: "google_sign_in:new" },
    }));
    const deps: AccountLinkingEndpointDeps = {
      verifier,
      linkProvider,
      now: () => fixedNow,
      newId: () => "id-fixed",
    };

    const result = await handleLinkProvider(
      db,
      {
        actingRawToken: "acting-token",
        actingReferenceType: "phone_otp",
        newRawToken: "new-token",
        newReferenceType: "google_sign_in",
        idempotencyKey: "req-1",
      },
      deps,
    );

    // Both tokens verified (acting + new).
    expect(verify).toHaveBeenCalledTimes(2);
    expect(verify).toHaveBeenCalledWith({ rawToken: "acting-token", referenceType: "phone_otp" });
    expect(verify).toHaveBeenCalledWith({ rawToken: "new-token", referenceType: "google_sign_in" });

    // Delegated with the verified acting + new credentials and the client key.
    expect(linkProvider).toHaveBeenCalledTimes(1);
    const [, actingCred, newCred, , command] = linkProvider.mock.calls[0];
    expect(actingCred.referenceId).toBe("phone_otp:acting-token");
    expect(newCred.referenceId).toBe("google_sign_in:new-token");
    expect(command.idempotencyKey).toBe("req-1");

    expect(result).toEqual({
      operation: "linked",
      customerIdentityId: "identity-1",
      reference: { referenceType: "google_sign_in", referenceId: "google_sign_in:new" },
    });
    // No token material in the transport result.
    expect(JSON.stringify(result)).not.toContain("token");
  });

  it("fails closed if the new credential cannot be verified (no link attempted)", async () => {
    const verify = vi
      .fn()
      .mockResolvedValueOnce(
        createAuthenticatedCredential({
          referenceType: "phone_otp",
          referenceId: "acting",
          verifiedAt: fixedNow,
        }),
      )
      .mockRejectedValueOnce(new Error("invalid new token"));
    const linkProvider = vi.fn();
    const deps: AccountLinkingEndpointDeps = { verifier: { verify }, linkProvider };

    await expect(
      handleLinkProvider(
        db,
        {
          actingRawToken: "acting-token",
          actingReferenceType: "phone_otp",
          newRawToken: "bad",
          newReferenceType: "google_sign_in",
          idempotencyKey: "req-1",
        },
        deps,
      ),
    ).rejects.toThrow();
    expect(linkProvider).not.toHaveBeenCalled();
  });
});

describe("handleUnlinkProvider", () => {
  it("verifies only the acting credential and delegates the unlink of the named target", async () => {
    const { verifier, verify } = verifierFor();
    const unlinkProvider = vi.fn(async () => ({
      operation: "unlinked" as const,
      customerIdentityId: "identity-1",
      reference: { referenceType: "google_sign_in" as const, referenceId: "google-ref" },
    }));
    const deps: AccountLinkingEndpointDeps = {
      verifier,
      unlinkProvider,
      now: () => fixedNow,
      newId: () => "id-fixed",
    };

    const result = await handleUnlinkProvider(
      db,
      {
        actingRawToken: "acting-token",
        actingReferenceType: "phone_otp",
        targetReferenceType: "google_sign_in",
        targetReferenceId: "google-ref",
        idempotencyKey: "req-2",
      },
      deps,
    );

    // Only the acting token is verified — the target is named, not re-verified.
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith({ rawToken: "acting-token", referenceType: "phone_otp" });

    const [, actingCred, target] = unlinkProvider.mock.calls[0];
    expect(actingCred.referenceId).toBe("phone_otp:acting-token");
    expect(target).toEqual({ referenceType: "google_sign_in", referenceId: "google-ref" });

    expect(result).toEqual({
      operation: "unlinked",
      customerIdentityId: "identity-1",
      reference: { referenceType: "google_sign_in", referenceId: "google-ref" },
    });
  });
});
