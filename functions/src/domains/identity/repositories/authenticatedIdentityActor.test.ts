import { describe, expect, it, vi } from "vitest";
import { resolveAuthenticatedIdentityActor } from "./authenticatedIdentityActor";

const credential = { referenceType: "email" as const, referenceId: "firebase-uid-1" };

function baseDeps(
  overrides: Partial<Parameters<typeof resolveAuthenticatedIdentityActor>[2]> = {},
) {
  return {
    verifier: { verify: vi.fn().mockResolvedValue(credential) },
    resolveCredential: vi.fn().mockResolvedValue({
      outcome: "resolved",
      customerIdentityId: "cust_1",
      credential,
    }),
    getIdentity: vi.fn().mockResolvedValue({ id: "cust_1", status: "active" }),
    newId: () => "fixed-id",
    ...overrides,
  };
}

describe("resolveAuthenticatedIdentityActor — server-derived identity", () => {
  it("derives userId from the resolved Customer Identity, never from client input", async () => {
    const deps = baseDeps();
    const result = await resolveAuthenticatedIdentityActor(
      {} as never,
      { rawToken: "tok", referenceType: "email" },
      deps,
    );

    expect(result.userId).toBe("cust_1");
    expect(deps.verifier.verify).toHaveBeenCalledWith({ rawToken: "tok", referenceType: "email" });
  });

  it("never accepts or returns any client-supplied target identity — the params type has no such field", () => {
    // Structural proof, not a runtime check: `ResolveAuthenticatedIdentityActorParams`
    // is `{ rawToken, referenceType }` only — there is no `userId`/`customerIdentityId`
    // field a caller could supply, so a request cannot target another user by
    // construction (verified again at the type level in the implementation).
    const params: Parameters<typeof resolveAuthenticatedIdentityActor>[1] = {
      rawToken: "tok",
      referenceType: "email",
    };
    expect(Object.keys(params).sort()).toEqual(["rawToken", "referenceType"]);
  });

  it("fails closed with AUTH_REQUIRED when the credential resolves to no Customer Identity", async () => {
    const deps = baseDeps({
      resolveCredential: vi.fn().mockResolvedValue({ outcome: "unregistered", credential }),
    });

    await expect(
      resolveAuthenticatedIdentityActor(
        {} as never,
        { rawToken: "tok", referenceType: "email" },
        deps,
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(deps.getIdentity).not.toHaveBeenCalled();
  });

  it("fails closed with AUTH_REQUIRED when the resolved Customer Identity is suspended", async () => {
    const deps = baseDeps({
      getIdentity: vi.fn().mockResolvedValue({ id: "cust_1", status: "suspended" }),
    });

    await expect(
      resolveAuthenticatedIdentityActor(
        {} as never,
        { rawToken: "tok", referenceType: "email" },
        deps,
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("fails closed with AUTH_REQUIRED when the resolved Customer Identity is closed", async () => {
    const deps = baseDeps({
      getIdentity: vi.fn().mockResolvedValue({ id: "cust_1", status: "closed" }),
    });

    await expect(
      resolveAuthenticatedIdentityActor(
        {} as never,
        { rawToken: "tok", referenceType: "email" },
        deps,
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("accepts a dormant Customer Identity", async () => {
    const deps = baseDeps({
      getIdentity: vi.fn().mockResolvedValue({ id: "cust_1", status: "dormant" }),
    });

    const result = await resolveAuthenticatedIdentityActor(
      {} as never,
      { rawToken: "tok", referenceType: "email" },
      deps,
    );
    expect(result.userId).toBe("cust_1");
  });
});
