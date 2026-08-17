import { describe, expect, it } from "vitest";
import { MVP_REFERENCE_TYPES, parseCreateBusinessCommand } from "./index";

/**
 * Regression guard for the callable-boundary provider allow-list
 * (`parseAuthenticateRequest`/`parseReferenceType` gate every
 * authenticate/link/unlink/recovery request against this set before token
 * verification). It must mirror the Founder MVP provider policy
 * (`AUTH-CORR-003`: Google + Email/Password + optional Phone OTP); a missing
 * entry would reject that provider with `invalid-argument` end-to-end.
 */
describe("MVP_REFERENCE_TYPES (callable boundary allow-list)", () => {
  it("accepts exactly the MVP providers incl. email [AUTH-CORR-003]", () => {
    expect([...MVP_REFERENCE_TYPES].sort()).toEqual(["email", "google_sign_in", "phone_otp"]);
  });

  it("admits `email` so Email/Password requests reach verification", () => {
    expect(MVP_REFERENCE_TYPES.has("email")).toBe(true);
  });

  it("still rejects deferred providers (fail closed)", () => {
    expect(MVP_REFERENCE_TYPES.has("future_provider")).toBe(false);
  });
});

/**
 * Adversarial mass-assignment regression (ENG-P2-002B independent review,
 * Phase E). `CreateBusinessRequest`'s TypeScript type having no `ownerUserId`
 * key is a compile-time guarantee only — it says nothing about what a raw,
 * untyped `request.data` payload can smuggle in at runtime through object
 * spread. This proves the *runtime* parser actually drops every
 * authority-sensitive field a malicious client could attach to the payload,
 * rather than merely relying on the TypeScript contract 002A already
 * provides.
 */
describe("parseCreateBusinessCommand (mass-assignment boundary)", () => {
  const validPayload = {
    displayName: "Test Cafe",
    primaryCategoryId: "cat_food",
    countryCode: "US",
    currencyCode: "USD",
    timezone: "America/Los_Angeles",
    city: "Springfield",
    contactPhone: "+15550100",
    supportedLanguages: ["en"],
    rawToken: "tok",
    referenceType: "email",
    idempotencyKey: "key-1",
  };

  it("drops every authority-sensitive field an attacker attaches to the payload", () => {
    const malicious = {
      ...validPayload,
      ownerUserId: "attacker-controlled-uid",
      membershipId: "attacker-membership",
      role: "owner",
      businessCode: "BIZATTACK1",
      branchId: "attacker-branch",
      businessId: "attacker-business",
      status: "active",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
      schemaVersion: 999,
      permissions: [{ permissionId: "everything", direction: "grant" }],
    };

    const parsed = parseCreateBusinessCommand(malicious);
    const parsedKeys = Object.keys(parsed);

    for (const forbiddenKey of [
      "ownerUserId",
      "membershipId",
      "role",
      "businessCode",
      "branchId",
      "businessId",
      "status",
      "createdAt",
      "updatedAt",
      "schemaVersion",
      "permissions",
    ]) {
      expect(parsedKeys).not.toContain(forbiddenKey);
      expect((parsed as Record<string, unknown>)[forbiddenKey]).toBeUndefined();
    }

    // The legitimate fields still pass through unchanged.
    expect(parsed.displayName).toBe("Test Cafe");
    expect(parsed.idempotencyKey).toBe("key-1");
  });

  it("parses to exactly the whitelisted field set — nothing more, nothing less", () => {
    const parsed = parseCreateBusinessCommand({
      ...validPayload,
      unexpectedExtraField: "should be dropped",
    });

    expect(Object.keys(parsed).sort()).toEqual(
      [
        "legalName",
        "displayName",
        "primaryCategoryId",
        "businessTypeId",
        "countryCode",
        "currencyCode",
        "timezone",
        "city",
        "address",
        "contactPhone",
        "contactEmail",
        "logoUrl",
        "supportedLanguages",
        "subscriptionId",
        "rawToken",
        "referenceType",
        "idempotencyKey",
      ].sort(),
    );
  });
});
