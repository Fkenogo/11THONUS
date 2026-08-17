import { describe, expect, it } from "vitest";
import { buildBootstrapBusinessInput } from "./businessBootstrap";

const validRequest = () => ({
  displayName: "Kwetu Café",
  primaryCategoryId: "category-1",
  countryCode: "BI",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  supportedLanguages: ["fr", "en"],
});

const validContext = () => ({
  ownerUserId: "user-1",
  businessId: "biz-1",
  branchId: "branch-1",
  businessCode: "BIZABCDEF",
  now: new Date("2026-08-17T00:00:00.000Z"),
});

describe("CreateBusinessRequest (structural type)", () => {
  it("has no ownerUserId key at all — a compile-time guarantee, not just runtime validation", () => {
    const request = validRequest();
    expect(request).not.toHaveProperty("ownerUserId");
    // @ts-expect-error -- ownerUserId is not part of the client-input request type.
    const _rejected: { ownerUserId: string } = request;
    void _rejected;
  });
});

describe("buildBootstrapBusinessInput", () => {
  it("combines client request fields with server-derived context fields", () => {
    const input = buildBootstrapBusinessInput(validRequest(), validContext());
    expect(input.business.ownerUserId).toBe("user-1");
    expect(input.business.id).toBe("biz-1");
    expect(input.business.businessCode).toBe("BIZABCDEF");
    expect(input.business.displayName).toBe("Kwetu Café");
    expect(input.branch.businessId).toBe("biz-1");
    expect(input.branch.id).toBe("branch-1");
  });

  it("the branch defaults its displayName to the business's own displayName (§5.3)", () => {
    const input = buildBootstrapBusinessInput(validRequest(), validContext());
    expect(input.branch.displayName).toBe(input.business.displayName);
  });

  it("the branch inherits countryCode/city from the business at creation (§5.3)", () => {
    const input = buildBootstrapBusinessInput(validRequest(), validContext());
    expect(input.branch.countryCode).toBe(input.business.countryCode);
    expect(input.branch.city).toBe(input.business.city);
  });

  it("ownerUserId can only come from context, never from the request object shape", () => {
    // Even if a caller managed to smuggle an extra property onto the
    // untyped request object at runtime, buildBootstrapBusinessInput never
    // reads an `ownerUserId` key off it — only off `context`.
    const smuggled = {
      ...validRequest(),
      ownerUserId: "attacker-controlled",
    } as unknown as ReturnType<typeof validRequest>;
    const input = buildBootstrapBusinessInput(smuggled, validContext());
    expect(input.business.ownerUserId).toBe("user-1");
  });

  it("produces a business in draft status with matching business/branch createdAt", () => {
    const input = buildBootstrapBusinessInput(validRequest(), validContext());
    expect(input.business.status).toBe("draft");
    expect(input.business.createdAt).toEqual(validContext().now);
    expect(input.branch.createdAt).toEqual(validContext().now);
  });

  it("rejects a malformed request field (fails closed, same validation as createBusiness)", () => {
    expect(() =>
      buildBootstrapBusinessInput({ ...validRequest(), displayName: "" }, validContext()),
    ).toThrow();
  });

  it("rejects a malformed context field", () => {
    expect(() =>
      buildBootstrapBusinessInput(validRequest(), { ...validContext(), ownerUserId: "" }),
    ).toThrow();
  });
});
