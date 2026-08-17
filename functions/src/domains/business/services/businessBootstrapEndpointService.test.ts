import { describe, expect, it, vi } from "vitest";
import { handleCreateBusiness } from "./businessBootstrapEndpointService";
import { BusinessDomainError } from "../models/businessErrors";
import type { CreateBusinessRequest } from "../models/businessBootstrap";

const validRequest: CreateBusinessRequest = {
  displayName: "Test Cafe",
  primaryCategoryId: "cat_food",
  countryCode: "US",
  currencyCode: "USD",
  timezone: "America/Los_Angeles",
  city: "Springfield",
  contactPhone: "+15550100",
  supportedLanguages: ["en"],
};

const credential = { referenceType: "email" as const, referenceId: "firebase-uid-1" };

function baseDeps(overrides: Partial<Parameters<typeof handleCreateBusiness>[2]> = {}) {
  return {
    verifier: { verify: vi.fn().mockResolvedValue(credential) },
    resolveCredential: vi.fn().mockResolvedValue({
      outcome: "resolved",
      customerIdentityId: "cust_1",
      credential,
    }),
    getIdentity: vi.fn().mockResolvedValue({ customerIdentityId: "cust_1", status: "active" }),
    bootstrap: vi.fn().mockResolvedValue({
      businessId: "biz_1",
      businessCode: "BIZ234567",
      branchId: "branch_1",
      status: "draft",
    }),
    now: () => new Date("2026-08-17T00:00:00.000Z"),
    newId: () => "fixed-id",
    ...overrides,
  };
}

describe("handleCreateBusiness — owner resolution authority", () => {
  it("derives ownerUserId from the resolved Customer Identity, never from client input", async () => {
    const deps = baseDeps();
    const result = await handleCreateBusiness(
      {} as never,
      { ...validRequest, rawToken: "tok", referenceType: "email", idempotencyKey: "key-1" },
      deps,
    );

    expect(deps.bootstrap).toHaveBeenCalledWith(
      expect.anything(),
      validRequest,
      expect.objectContaining({ ownerUserId: "cust_1" }),
    );
    expect(result.businessId).toBe("biz_1");
  });

  it("fails closed with AUTH_REQUIRED when the credential resolves to no Customer Identity", async () => {
    const deps = baseDeps({
      resolveCredential: vi.fn().mockResolvedValue({ outcome: "unregistered", credential }),
    });

    await expect(
      handleCreateBusiness(
        {} as never,
        { ...validRequest, rawToken: "tok", referenceType: "email", idempotencyKey: "key-1" },
        deps,
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(deps.bootstrap).not.toHaveBeenCalled();
  });

  it("fails closed with AUTH_REQUIRED when the resolved Customer Identity is suspended", async () => {
    const deps = baseDeps({
      getIdentity: vi.fn().mockResolvedValue({ customerIdentityId: "cust_1", status: "suspended" }),
    });

    await expect(
      handleCreateBusiness(
        {} as never,
        { ...validRequest, rawToken: "tok", referenceType: "email", idempotencyKey: "key-1" },
        deps,
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(deps.bootstrap).not.toHaveBeenCalled();
  });

  it("fails closed with AUTH_REQUIRED when the resolved Customer Identity is closed", async () => {
    const deps = baseDeps({
      getIdentity: vi.fn().mockResolvedValue({ customerIdentityId: "cust_1", status: "closed" }),
    });

    await expect(
      handleCreateBusiness(
        {} as never,
        { ...validRequest, rawToken: "tok", referenceType: "email", idempotencyKey: "key-1" },
        deps,
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("propagates an unverified-token failure before ever touching identity resolution or bootstrap", async () => {
    const deps = baseDeps({
      verifier: { verify: vi.fn().mockRejectedValue(new Error("bad token")) },
    });

    await expect(
      handleCreateBusiness(
        {} as never,
        { ...validRequest, rawToken: "bad", referenceType: "email", idempotencyKey: "key-1" },
        deps,
      ),
    ).rejects.toThrow("bad token");
    expect(deps.resolveCredential).not.toHaveBeenCalled();
    expect(deps.bootstrap).not.toHaveBeenCalled();
  });

  it("the client-facing request type structurally cannot carry an ownerUserId field", () => {
    // @ts-expect-error — CreateBusinessRequest has no ownerUserId key; this is a compile-time guarantee.
    const attempt: CreateBusinessRequest = { ...validRequest, ownerUserId: "attacker-controlled" };
    expect(attempt).toBeDefined();
  });
});

describe("handleCreateBusiness — result shape", () => {
  it("returns exactly the bounded CreateBusinessResult from the bootstrap layer", async () => {
    const deps = baseDeps();
    const result = await handleCreateBusiness(
      {} as never,
      { ...validRequest, rawToken: "tok", referenceType: "email", idempotencyKey: "key-1" },
      deps,
    );

    expect(result).toEqual({
      businessId: "biz_1",
      businessCode: "BIZ234567",
      branchId: "branch_1",
      status: "draft",
    });
  });
});

describe("handleCreateBusiness — error type", () => {
  it("uses BusinessDomainError for the owner-resolution failures", async () => {
    const deps = baseDeps({
      resolveCredential: vi.fn().mockResolvedValue({ outcome: "unregistered", credential }),
    });

    let caught: unknown;
    try {
      await handleCreateBusiness(
        {} as never,
        { ...validRequest, rawToken: "tok", referenceType: "email", idempotencyKey: "key-1" },
        deps,
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(BusinessDomainError);
  });
});
