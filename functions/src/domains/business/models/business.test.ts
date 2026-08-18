import { describe, expect, it } from "vitest";
import { createBusiness, transitionBusinessStatus, updateBusinessProfile } from "./business";
import { BUSINESS_STATUSES } from "./businessStatus";

const baseParams = () => ({
  id: "biz-1",
  businessCode: "BIZABCDEF",
  ownerUserId: "user-1",
  displayName: "Kwetu Café",
  primaryCategoryId: "category-1",
  countryCode: "BI",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  supportedLanguages: ["fr", "en"],
  createdAt: new Date("2026-08-17T00:00:00.000Z"),
});

describe("createBusiness", () => {
  it("accepts valid required fields and produces a business in draft status", () => {
    const business = createBusiness(baseParams());
    expect(business.id).toBe("biz-1");
    expect(business.businessCode).toBe("BIZABCDEF");
    expect(business.ownerUserId).toBe("user-1");
    expect(business.status).toBe("draft");
    expect(business.schemaVersion).toBe(1);
    expect(business.createdAt).toEqual(business.updatedAt);
  });

  it("every required field is enforced", () => {
    const required: (keyof ReturnType<typeof baseParams>)[] = [
      "id",
      "businessCode",
      "ownerUserId",
      "displayName",
      "primaryCategoryId",
      "countryCode",
      "currencyCode",
      "timezone",
      "city",
      "contactPhone",
    ];
    for (const field of required) {
      expect(() => createBusiness({ ...baseParams(), [field]: "" })).toThrow();
    }
  });

  it("rejects a malformed businessCode", () => {
    expect(() => createBusiness({ ...baseParams(), businessCode: "not-a-code" })).toThrow();
  });

  it("rejects a malformed countryCode (not ISO 3166-1 alpha-2 shape)", () => {
    expect(() => createBusiness({ ...baseParams(), countryCode: "BDI" })).toThrow();
  });

  it("rejects a malformed currencyCode (not ISO 4217 shape)", () => {
    expect(() => createBusiness({ ...baseParams(), currencyCode: "bif" })).toThrow();
    expect(() => createBusiness({ ...baseParams(), currencyCode: "BI" })).toThrow();
  });

  it("accepts an empty supportedLanguages array (TRD10 §10.6.3 types it string[], not a non-empty array — no minimum cardinality is governed; matches the identity domain's own precedent for required array fields, customerProfile.ts's interests/preferredCategories, 'governed reference lists, default empty')", () => {
    const business = createBusiness({ ...baseParams(), supportedLanguages: [] });
    expect(business.supportedLanguages).toEqual([]);
  });

  it("rejects a supportedLanguages array containing a blank entry", () => {
    expect(() => createBusiness({ ...baseParams(), supportedLanguages: ["fr", ""] })).toThrow();
  });

  it("leaves every optional field undefined when omitted", () => {
    const business = createBusiness(baseParams());
    expect(business.legalName).toBeUndefined();
    expect(business.businessTypeId).toBeUndefined();
    expect(business.address).toBeUndefined();
    expect(business.contactEmail).toBeUndefined();
    expect(business.logoUrl).toBeUndefined();
    expect(business.subscriptionId).toBeUndefined();
  });

  it("accepts every optional field when provided", () => {
    const business = createBusiness({
      ...baseParams(),
      legalName: "Kwetu Café SARL",
      businessTypeId: "type-1",
      address: "12 Rue de la Paix",
      contactEmail: "owner@example.com",
      logoUrl: "https://example.com/logo.png",
      subscriptionId: "sub-1",
    });
    expect(business.legalName).toBe("Kwetu Café SARL");
    expect(business.businessTypeId).toBe("type-1");
    expect(business.address).toBe("12 Rue de la Paix");
    expect(business.contactEmail).toBe("owner@example.com");
    expect(business.logoUrl).toBe("https://example.com/logo.png");
    expect(business.subscriptionId).toBe("sub-1");
  });

  it("no invented field (e.g. businessCode format) can influence authority — status is always draft regardless of input", () => {
    const business = createBusiness(baseParams());
    // createBusiness's own params type has no `status` field at all —
    // this is a structural (compile-time), not merely runtime, guarantee.
    expect(business.status).toBe("draft");
  });

  it("produces exactly the TRD10 §10.6.3 field set — no extra field, no secondary Business-auth principal, no client-authority field", () => {
    const business = createBusiness(baseParams());
    expect(business).toEqual({
      id: "biz-1",
      businessCode: "BIZABCDEF",
      legalName: undefined,
      displayName: "Kwetu Café",
      ownerUserId: "user-1",
      primaryCategoryId: "category-1",
      businessTypeId: undefined,
      countryCode: "BI",
      currencyCode: "BIF",
      timezone: "Africa/Bujumbura",
      city: "Bujumbura",
      address: undefined,
      contactPhone: "+25761234567",
      contactEmail: undefined,
      logoUrl: undefined,
      supportedLanguages: ["fr", "en"],
      status: "draft",
      subscriptionId: undefined,
      createdAt: baseParams().createdAt,
      updatedAt: baseParams().createdAt,
      schemaVersion: 1,
    });
  });
});

describe("transitionBusinessStatus", () => {
  it("performs a governed transition", () => {
    const business = createBusiness(baseParams());
    const updatedAt = new Date("2026-08-18T00:00:00.000Z");
    const { business: next } = transitionBusinessStatus(business, "pending_verification", {
      updatedAt,
    });
    expect(next.status).toBe("pending_verification");
    expect(next.updatedAt).toBe(updatedAt);
  });

  it("rejects an ungoverned transition", () => {
    const business = createBusiness(baseParams());
    expect(() => transitionBusinessStatus(business, "active", { updatedAt: new Date() })).toThrow();
  });

  it("rejects any transition once archived", () => {
    let business = createBusiness(baseParams());
    for (const to of [
      "pending_verification",
      "trial",
      "active",
      "expired",
      "closed",
      "archived",
    ] as const) {
      business = transitionBusinessStatus(business, to, { updatedAt: new Date() }).business;
    }
    expect(business.status).toBe("archived");
    expect(() => transitionBusinessStatus(business, "closed", { updatedAt: new Date() })).toThrow();
  });

  it("all 8 governed statuses are individually reachable in some sequence", () => {
    // Sanity check that BUSINESS_STATUSES and the transition table stay
    // in sync — a status this domain declares but the table can never
    // reach would be a genuine defect.
    expect(BUSINESS_STATUSES).toHaveLength(8);
  });
});

describe("updateBusinessProfile (ENG-P2-002C)", () => {
  const updatedAt = new Date("2026-08-19T00:00:00.000Z");

  it("updates only the supplied mutable fields, leaving everything else unchanged", () => {
    const business = createBusiness(baseParams());
    const updated = updateBusinessProfile(business, {
      displayName: "New Name Café",
      updatedAt,
    });

    expect(updated.displayName).toBe("New Name Café");
    expect(updated.updatedAt).toBe(updatedAt);
    // Untouched fields survive unchanged.
    expect(updated.city).toBe(business.city);
    expect(updated.contactPhone).toBe(business.contactPhone);
  });

  it("re-validates the resulting merged state, not just the patch in isolation", () => {
    const business = createBusiness(baseParams());
    expect(() => updateBusinessProfile(business, { displayName: "", updatedAt })).toThrow();
    expect(() => updateBusinessProfile(business, { countryCode: "usa", updatedAt })).toThrow();
    expect(() => updateBusinessProfile(business, { currencyCode: "dollars", updatedAt })).toThrow();
    expect(() =>
      updateBusinessProfile(business, { supportedLanguages: ["fr", ""], updatedAt }),
    ).toThrow();
  });

  it("accepts an empty supportedLanguages array (no minimum-cardinality rule, TRD10 §10.6.3)", () => {
    const business = createBusiness(baseParams());
    const updated = updateBusinessProfile(business, { supportedLanguages: [], updatedAt });
    expect(updated.supportedLanguages).toEqual([]);
  });

  it("allows clearing an optional field back to undefined", () => {
    const business = createBusiness({ ...baseParams(), address: "123 Main St" });
    const updated = updateBusinessProfile(business, { address: undefined, updatedAt });
    expect(updated.address).toBeUndefined();
  });

  it("the params type has no id/businessCode/ownerUserId/status/createdAt/schemaVersion key at all", () => {
    const business = createBusiness(baseParams());
    // @ts-expect-error — id is not part of the update-params shape.
    updateBusinessProfile(business, { id: "attacker-id", updatedAt });
    // @ts-expect-error — businessCode is not part of the update-params shape.
    updateBusinessProfile(business, { businessCode: "BIZATTACK1", updatedAt });
    // @ts-expect-error — ownerUserId is not part of the update-params shape.
    updateBusinessProfile(business, { ownerUserId: "attacker-uid", updatedAt });
    // @ts-expect-error — status is not part of the update-params shape.
    updateBusinessProfile(business, { status: "active", updatedAt });
    // @ts-expect-error — createdAt is not part of the update-params shape.
    updateBusinessProfile(business, { createdAt: new Date(0), updatedAt });
    // @ts-expect-error — schemaVersion is not part of the update-params shape.
    updateBusinessProfile(business, { schemaVersion: 999, updatedAt });
  });

  it("runtime: even if a caller forges the params object past the type system, immutable fields never change", () => {
    const business = createBusiness(baseParams());
    const forged = {
      displayName: "Legit Update",
      updatedAt,
      id: "attacker-id",
      businessCode: "BIZATTACK1",
      ownerUserId: "attacker-uid",
      status: "active",
      createdAt: new Date(0),
      schemaVersion: 999,
    } as unknown as Parameters<typeof updateBusinessProfile>[1];

    const updated = updateBusinessProfile(business, forged);

    expect(updated.id).toBe(business.id);
    expect(updated.businessCode).toBe(business.businessCode);
    expect(updated.ownerUserId).toBe(business.ownerUserId);
    expect(updated.status).toBe(business.status);
    expect(updated.createdAt).toBe(business.createdAt);
    expect(updated.schemaVersion).toBe(business.schemaVersion);
    // Only the legitimate field changed.
    expect(updated.displayName).toBe("Legit Update");
  });
});
