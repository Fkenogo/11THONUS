import { describe, expect, it } from "vitest";
import {
  createCustomerProfile,
  updateCustomerProfile,
  toPublicCustomerProfile,
  serializeCustomerProfileFields,
  deserializeCustomerProfileFields,
  type CreateCustomerProfileParams,
  type CustomerProfile,
} from "./customerProfile";
import { IdentityDomainError } from "./identityErrors";

const acceptedAt = new Date("2026-08-07T10:00:00.000Z");
const createdAt = new Date("2026-08-07T10:00:00.000Z");

function baseParams(
  overrides: Partial<CreateCustomerProfileParams> = {},
): CreateCustomerProfileParams {
  return {
    customerIdentityId: "ci_123",
    firstName: "Aline",
    lastName: "Niyonkuru",
    consentVersions: { termsVersion: "1.0", privacyVersion: "1.0", acceptedAt },
    createdAt,
    createdBy: "actor_1",
    ...overrides,
  };
}

describe("createCustomerProfile", () => {
  it("creates a valid profile from the mandatory fields", () => {
    const profile = createCustomerProfile(baseParams());

    expect(profile.customerIdentityId).toBe("ci_123");
    expect(profile.firstName).toBe("Aline");
    expect(profile.lastName).toBe("Niyonkuru");
    expect(profile.interests).toEqual([]);
    expect(profile.preferredCategories).toEqual([]);
    expect(profile.communicationPreferences).toEqual({
      push: false,
      sms: false,
      email: false,
      whatsapp: false,
      marketingConsent: false,
    });
    expect(profile.consentVersions.termsVersion).toBe("1.0");
    expect(profile.createdAt).toEqual(createdAt);
    expect(profile.updatedAt).toEqual(createdAt);
  });

  it("leaves optional fields absent rather than populating placeholders (Progressive KYC)", () => {
    const profile = createCustomerProfile(baseParams());

    expect(profile.dateOfBirth).toBeUndefined();
    expect(profile.city).toBeUndefined();
    expect("dateOfBirth" in profile).toBe(false);
    expect("city" in profile).toBe(false);
  });

  it("accepts provided optional fields", () => {
    const profile = createCustomerProfile(
      baseParams({ dateOfBirth: "1990-01-01", city: "Bujumbura", interests: ["coffee"] }),
    );

    expect(profile.dateOfBirth).toBe("1990-01-01");
    expect(profile.city).toBe("Bujumbura");
    expect(profile.interests).toEqual(["coffee"]);
  });

  it("computes profileCompletionPercent from populated slots", () => {
    expect(createCustomerProfile(baseParams()).profileCompletionPercent).toBe(33);
    expect(createCustomerProfile(baseParams({ city: "Bujumbura" })).profileCompletionPercent).toBe(
      50,
    );
    expect(
      createCustomerProfile(
        baseParams({
          dateOfBirth: "1990-01-01",
          city: "Bujumbura",
          interests: ["coffee"],
          preferredCategories: ["food"],
        }),
      ).profileCompletionPercent,
    ).toBe(100);
  });

  it("rejects an empty first name", () => {
    expect(() => createCustomerProfile(baseParams({ firstName: "   " }))).toThrow(
      IdentityDomainError,
    );
  });

  it("rejects an empty last name", () => {
    expect(() => createCustomerProfile(baseParams({ lastName: "" }))).toThrow(IdentityDomainError);
  });

  it("rejects a missing customer identity binding", () => {
    expect(() => createCustomerProfile(baseParams({ customerIdentityId: "" }))).toThrow(
      IdentityDomainError,
    );
  });

  it("rejects missing consent versions at write time", () => {
    expect(() =>
      createCustomerProfile(
        baseParams({ consentVersions: { termsVersion: "", privacyVersion: "1.0", acceptedAt } }),
      ),
    ).toThrow(IdentityDomainError);
  });

  it("maps validation failures to the governed VALIDATION_FAILED category", () => {
    try {
      createCustomerProfile(baseParams({ firstName: "" }));
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityDomainError);
      expect((error as IdentityDomainError).category).toBe("VALIDATION_FAILED");
    }
  });

  it("rejects an unsupported gender field (DEC-PROD-012 Option D — gender not collected at MVP)", () => {
    const params = baseParams() as CreateCustomerProfileParams & Record<string, unknown>;
    params.gender = "female";
    expect(() => createCustomerProfile(params)).toThrow(IdentityDomainError);
  });

  it("never carries a gender field on the created profile", () => {
    const profile = createCustomerProfile(baseParams());
    expect("gender" in profile).toBe(false);
  });
});

describe("updateCustomerProfile", () => {
  const existing = createCustomerProfile(baseParams());
  const updatedAt = new Date("2026-08-08T09:00:00.000Z");

  it("applies permitted field updates and re-stamps update attribution", () => {
    const next = updateCustomerProfile(
      existing,
      { city: "Gitega", interests: ["tea"] },
      { updatedAt, updatedBy: "actor_2" },
    );

    expect(next.city).toBe("Gitega");
    expect(next.interests).toEqual(["tea"]);
    expect(next.updatedAt).toEqual(updatedAt);
    expect(next.updatedBy).toBe("actor_2");
    expect(next.createdAt).toEqual(existing.createdAt);
  });

  it("recomputes profileCompletionPercent after an update", () => {
    const next = updateCustomerProfile(
      existing,
      { city: "Gitega" },
      { updatedAt, updatedBy: "actor_2" },
    );
    expect(next.profileCompletionPercent).toBe(50);
  });

  it("rejects changing the immutable identity binding", () => {
    const params = { customerIdentityId: "ci_999" } as Record<string, unknown>;
    expect(() =>
      updateCustomerProfile(existing, params, { updatedAt, updatedBy: "actor_2" }),
    ).toThrow(IdentityDomainError);
  });

  it("rejects clearing a mandatory field", () => {
    expect(() =>
      updateCustomerProfile(existing, { firstName: "  " }, { updatedAt, updatedBy: "actor_2" }),
    ).toThrow(IdentityDomainError);
  });

  it("rejects an unsupported gender field on update", () => {
    const params = { gender: "male" } as Record<string, unknown>;
    expect(() =>
      updateCustomerProfile(existing, params, { updatedAt, updatedBy: "actor_2" }),
    ).toThrow(IdentityDomainError);
  });
});

describe("toPublicCustomerProfile", () => {
  it("reveals only non-sensitive fields (PR-005)", () => {
    const profile = createCustomerProfile(
      baseParams({ dateOfBirth: "1990-01-01", city: "Bujumbura" }),
    );
    const pub = toPublicCustomerProfile(profile) as Record<string, unknown>;

    expect(pub.firstName).toBe("Aline");
    expect("dateOfBirth" in pub).toBe(false);
    expect("city" in pub).toBe(false);
    expect("consentVersions" in pub).toBe(false);
    expect("communicationPreferences" in pub).toBe(false);
    expect("lastName" in pub).toBe(false);
  });
});

describe("serializeCustomerProfileFields / deserializeCustomerProfileFields", () => {
  it("serializes only the mutable profile fields, omitting absent optionals and gender", () => {
    const profile = createCustomerProfile(baseParams());
    const fields = serializeCustomerProfileFields(profile) as Record<string, unknown>;

    expect(fields.firstName).toBe("Aline");
    expect(fields.lastName).toBe("Niyonkuru");
    expect(fields.interests).toEqual([]);
    expect(fields.profileCompletionPercent).toBe(33);
    expect("dateOfBirth" in fields).toBe(false);
    expect("city" in fields).toBe(false);
    expect("gender" in fields).toBe(false);
    expect("customerIdentityId" in fields).toBe(false);
  });

  it("round-trips a profile through serialize + deserialize", () => {
    const profile = createCustomerProfile(
      baseParams({ dateOfBirth: "1990-01-01", city: "Bujumbura", interests: ["coffee"] }),
    );
    const fields = serializeCustomerProfileFields(profile);
    const restored: CustomerProfile = deserializeCustomerProfileFields(fields, {
      customerIdentityId: profile.customerIdentityId,
      createdAt: profile.createdAt,
      createdBy: profile.createdBy,
      updatedAt: profile.updatedAt,
      updatedBy: profile.updatedBy,
    });

    expect(restored).toEqual(profile);
  });

  it("throws a governed error when the stored record is malformed", () => {
    expect(() =>
      deserializeCustomerProfileFields(
        { lastName: "Niyonkuru" },
        {
          customerIdentityId: "ci_123",
          createdAt,
          createdBy: null,
          updatedAt: createdAt,
          updatedBy: null,
        },
      ),
    ).toThrow(IdentityDomainError);
  });
});
