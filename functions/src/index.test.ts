import { describe, expect, it } from "vitest";
import {
  MVP_REFERENCE_TYPES,
  parseCreateBusinessCommand,
  parseBusinessProfilePatch,
  parseBusinessBranchProfilePatch,
  parseCreateStaffInvitationRequest,
  parseRevokeStaffInvitationRequest,
  parseAcceptBusinessTermsRequest,
  parseSetDisplayNameRequest,
  parseGetMyDisplayNameRequest,
} from "./index";

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

/**
 * Adversarial mass-assignment regression (`ENG-P2-002C`, Phase M) — the
 * same runtime proof `ENG-P2-002B`'s independent review established for
 * `parseCreateBusinessCommand`: a malicious raw payload attaching
 * authority-sensitive fields must never survive the whitelist parser at
 * runtime, not merely be absent from the TypeScript type.
 */
describe("parseBusinessProfilePatch (mass-assignment boundary)", () => {
  it("drops id/businessCode/ownerUserId/status/createdAt/schemaVersion/subscriptionId even if present on the payload", () => {
    const malicious = {
      displayName: "Legit New Name",
      id: "attacker-id",
      businessCode: "BIZATTACK1",
      ownerUserId: "attacker-uid",
      status: "active",
      createdAt: "2020-01-01T00:00:00.000Z",
      schemaVersion: 999,
      // `subscriptionId` (controlled-resume review, Phase J): no
      // subscription/billing governance exists yet (`ENG-P2-003` not
      // started) — an ungoverned value here must never reach the domain
      // layer through this ordinary profile-update permission.
      subscriptionId: "attacker-controlled-plan",
    };

    const patch = parseBusinessProfilePatch(malicious);
    const patchKeys = Object.keys(patch);

    for (const forbiddenKey of [
      "id",
      "businessCode",
      "ownerUserId",
      "status",
      "createdAt",
      "schemaVersion",
      "subscriptionId",
    ]) {
      expect(patchKeys).not.toContain(forbiddenKey);
    }
    expect(patch.displayName).toBe("Legit New Name");
  });

  it("rejects a non-string value for a legitimate field rather than coercing it", () => {
    expect(() => parseBusinessProfilePatch({ displayName: 12345 })).toThrow();
    expect(() => parseBusinessProfilePatch({ displayName: { $ne: null } })).toThrow();
  });

  it("accepts an explicit null as a request to clear an optional field", () => {
    const patch = parseBusinessProfilePatch({ address: null });
    expect("address" in patch).toBe(true);
    expect(patch.address).toBeUndefined();
  });

  it("an omitted field never appears in the resulting patch at all (true partial update)", () => {
    const patch = parseBusinessProfilePatch({ displayName: "Only This" });
    expect(Object.keys(patch)).toEqual(["displayName"]);
  });
});

describe("parseBusinessBranchProfilePatch (mass-assignment boundary)", () => {
  it("drops id/businessId/createdAt/schemaVersion even if present on the payload", () => {
    const malicious = {
      displayName: "Legit Branch Name",
      id: "attacker-id",
      businessId: "attacker-business",
      createdAt: "2020-01-01T00:00:00.000Z",
      schemaVersion: 999,
    };

    const patch = parseBusinessBranchProfilePatch(malicious);
    const patchKeys = Object.keys(patch);

    for (const forbiddenKey of ["id", "businessId", "createdAt", "schemaVersion"]) {
      expect(patchKeys).not.toContain(forbiddenKey);
    }
    expect(patch.displayName).toBe("Legit Branch Name");
  });

  it("rejects a non-string value for a legitimate field", () => {
    expect(() => parseBusinessBranchProfilePatch({ city: 12345 })).toThrow();
  });
});

/**
 * `ENG-P3-002A` Phase X — adversarial mass-assignment regression for the
 * new Staff/Terms transport whitelist parsers, same discipline as
 * `parseCreateBusinessCommand`/`parseBusinessProfilePatch` above.
 */
describe("parseCreateStaffInvitationRequest (mass-assignment boundary)", () => {
  it("drops invitedBy/status/id even if present on the payload — only businessId/role/deliveryTarget survive", () => {
    const malicious = {
      businessId: "biz-a",
      role: "staff",
      deliveryTarget: { type: "email", value: "person@example.com" },
      invitedBy: "attacker",
      status: "accepted",
      id: "attacker-id",
    };
    const parsed = parseCreateStaffInvitationRequest(malicious);
    expect(parsed).toEqual({
      businessId: "biz-a",
      role: "staff",
      deliveryTarget: { type: "email", value: "person@example.com" },
    });
  });

  it("rejects a missing businessId/role/deliveryTarget", () => {
    expect(() => parseCreateStaffInvitationRequest({})).toThrow();
    expect(() => parseCreateStaffInvitationRequest({ businessId: "biz-a" })).toThrow();
    expect(() =>
      parseCreateStaffInvitationRequest({ businessId: "biz-a", role: "staff" }),
    ).toThrow();
  });
});

describe("parseRevokeStaffInvitationRequest (mass-assignment boundary)", () => {
  it("only reads businessId/invitationId — extra fields are dropped", () => {
    const malicious = {
      businessId: "biz-a",
      invitationId: "inv-1",
      status: "revoked",
      revokedBy: "attacker",
    };
    const parsed = parseRevokeStaffInvitationRequest(malicious);
    expect(parsed).toEqual({ businessId: "biz-a", invitationId: "inv-1" });
  });
});

describe("parseAcceptBusinessTermsRequest (mass-assignment boundary, security-critical)", () => {
  it("only reads businessId/languageCode/collectionMethod — acceptingCustomerIdentityId/termsVersion/acceptedAt are structurally absent from the output even if present on the payload", () => {
    const malicious = {
      businessId: "biz-a",
      languageCode: "en",
      collectionMethod: "onboarding_wizard",
      acceptingCustomerIdentityId: "cust_attacker",
      termsVersion: "attacker_chosen_v99",
      acceptedAt: "2020-01-01T00:00:00.000Z",
    };
    const parsed = parseAcceptBusinessTermsRequest(malicious);
    expect(parsed).toEqual({
      businessId: "biz-a",
      languageCode: "en",
      collectionMethod: "onboarding_wizard",
    });
    expect(Object.keys(parsed)).not.toContain("acceptingCustomerIdentityId");
    expect(Object.keys(parsed)).not.toContain("termsVersion");
    expect(Object.keys(parsed)).not.toContain("acceptedAt");
  });

  it("rejects a missing businessId", () => {
    expect(() => parseAcceptBusinessTermsRequest({})).toThrow();
  });

  it("languageCode/collectionMethod are genuinely optional", () => {
    const parsed = parseAcceptBusinessTermsRequest({ businessId: "biz-a" });
    expect(parsed).toEqual({
      businessId: "biz-a",
      languageCode: undefined,
      collectionMethod: undefined,
    });
  });
});

describe("parseSetDisplayNameRequest (mass-assignment boundary, security-critical — IDENTITY-PROFILE-A)", () => {
  const validPayload = {
    rawToken: "raw-token",
    referenceType: "email",
    displayName: "Fred Kenogo",
    idempotencyKey: "key-1",
  };

  it("only reads rawToken/referenceType/displayName/idempotencyKey — a client-supplied target identity is structurally absent from the output even if present on the payload", () => {
    const malicious = {
      ...validPayload,
      userId: "attacker-controlled-uid",
      customerIdentityId: "cust_attacker",
      targetUserId: "cust_victim",
      updatedBy: "cust_attacker",
      updatedAt: "2020-01-01T00:00:00.000Z",
    };

    const parsed = parseSetDisplayNameRequest(malicious);

    expect(parsed).toEqual(validPayload);
    for (const forbiddenKey of [
      "userId",
      "customerIdentityId",
      "targetUserId",
      "updatedBy",
      "updatedAt",
    ]) {
      expect(Object.keys(parsed)).not.toContain(forbiddenKey);
      expect((parsed as Record<string, unknown>)[forbiddenKey]).toBeUndefined();
    }
  });

  it("rejects a missing/non-string displayName", () => {
    expect(() => parseSetDisplayNameRequest({ ...validPayload, displayName: undefined })).toThrow();
    expect(() => parseSetDisplayNameRequest({ ...validPayload, displayName: 42 })).toThrow();
  });

  it("rejects a missing rawToken/referenceType/idempotencyKey", () => {
    expect(() => parseSetDisplayNameRequest({ ...validPayload, rawToken: undefined })).toThrow();
    expect(() =>
      parseSetDisplayNameRequest({ ...validPayload, idempotencyKey: undefined }),
    ).toThrow();
  });
});

describe("parseGetMyDisplayNameRequest (mass-assignment boundary — IDENTITY-PROFILE-A)", () => {
  it("only reads rawToken/referenceType — a client-supplied target identity is structurally absent even if present on the payload", () => {
    const malicious = {
      rawToken: "raw-token",
      referenceType: "email",
      userId: "attacker-controlled-uid",
      customerIdentityId: "cust_victim",
    };

    const parsed = parseGetMyDisplayNameRequest(malicious);

    expect(parsed).toEqual({ rawToken: "raw-token", referenceType: "email" });
    expect(Object.keys(parsed)).not.toContain("userId");
    expect(Object.keys(parsed)).not.toContain("customerIdentityId");
  });
});
