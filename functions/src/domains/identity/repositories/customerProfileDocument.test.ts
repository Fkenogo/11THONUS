import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import {
  fromCustomerProfileDocument,
  toCustomerProfileFields,
  fromCustomerProfileFields,
} from "./customerProfileDocument";
import { IdentityDomainError } from "../models/identityErrors";
import { createCustomerProfile, type CustomerProfile } from "../models/customerProfile";

const now = Timestamp.fromDate(new Date("2026-08-04T00:00:00.000Z"));

describe("fromCustomerProfileDocument", () => {
  it("parses a minimal shell document (loyaltyNumber/qrReference optional)", () => {
    const raw = {
      id: "cust_1",
      userId: "cust_1",
      schemaVersion: 1,
      status: "active",
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };
    const profile = fromCustomerProfileDocument(raw);
    expect(profile.id).toBe("cust_1");
    expect(profile.userId).toBe("cust_1");
    expect(profile.loyaltyNumber).toBeUndefined();
    expect(profile.qrReference).toBeUndefined();
  });

  it("parses a shell document carrying loyaltyNumber and qrReference", () => {
    const raw = {
      id: "cust_1",
      userId: "cust_1",
      loyaltyNumber: "ABC234",
      qrReference: "ref1",
      schemaVersion: 1,
      status: "active",
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };
    const profile = fromCustomerProfileDocument(raw);
    expect(profile.loyaltyNumber).toBe("ABC234");
    expect(profile.qrReference).toBe("ref1");
  });

  it("rejects a malformed document missing userId", () => {
    expect(() => fromCustomerProfileDocument({ id: "cust_1" })).toThrow(IdentityDomainError);
  });
});

const acceptedAt = new Date("2026-08-07T10:00:00.000Z");
const profileCreatedAt = new Date("2026-08-07T10:00:00.000Z");

// Read a stored acceptedAt the way the read path does — tolerating either a
// Firestore Timestamp (has toDate) or a pass-through Date (cast convention).
function asDate(value: unknown): Date {
  const candidate = value as { toDate?: () => Date };
  return typeof candidate?.toDate === "function" ? candidate.toDate() : (value as Date);
}

function makeProfile(overrides: Record<string, unknown> = {}): CustomerProfile {
  return createCustomerProfile({
    customerIdentityId: "ci_123",
    firstName: "Aline",
    lastName: "Niyonkuru",
    consentVersions: { termsVersion: "1.0", privacyVersion: "1.0", acceptedAt },
    createdAt: profileCreatedAt,
    createdBy: "actor_1",
    ...overrides,
  });
}

function bindingFor(profile: CustomerProfile) {
  return {
    customerIdentityId: profile.customerIdentityId,
    createdAt: profile.createdAt,
    createdBy: profile.createdBy,
    updatedAt: profile.updatedAt,
    updatedBy: profile.updatedBy,
  };
}

describe("toCustomerProfileFields", () => {
  it("maps the -02 profile fields and converts consentVersions.acceptedAt to a Firestore Timestamp", () => {
    const fields = toCustomerProfileFields(makeProfile());

    expect(fields.firstName).toBe("Aline");
    expect(fields.lastName).toBe("Niyonkuru");
    expect(fields.interests).toEqual([]);
    expect(fields.profileCompletionPercent).toBe(33);
    // consentVersions.acceptedAt is handed to Firestore as the accepted
    // instant (the Admin SDK converts Date→Timestamp on write, matching the
    // toTimestampLike cast convention in userDocument.ts); the meaningful
    // contract here is that the correct instant is carried.
    expect(asDate(fields.consentVersions.acceptedAt)).toEqual(acceptedAt);
  });

  it("omits absent optionals (Progressive KYC) and never emits gender or the identity binding", () => {
    const fields = toCustomerProfileFields(makeProfile()) as Record<string, unknown>;

    expect("dateOfBirth" in fields).toBe(false);
    expect("city" in fields).toBe(false);
    expect("gender" in fields).toBe(false);
    expect("customerIdentityId" in fields).toBe(false);
    expect("id" in fields).toBe(false);
    expect("userId" in fields).toBe(false);
  });

  it("carries present optionals", () => {
    const fields = toCustomerProfileFields(
      makeProfile({ dateOfBirth: "1990-01-01", city: "Bujumbura", interests: ["coffee"] }),
    );
    expect(fields.dateOfBirth).toBe("1990-01-01");
    expect(fields.city).toBe("Bujumbura");
    expect(fields.interests).toEqual(["coffee"]);
  });
});

describe("fromCustomerProfileFields", () => {
  it("round-trips a domain profile through the Firestore field converter", () => {
    const profile = makeProfile({
      dateOfBirth: "1990-01-01",
      city: "Bujumbura",
      interests: ["coffee"],
      preferredCategories: ["food"],
    });
    const stored = toCustomerProfileFields(profile);
    const restored = fromCustomerProfileFields(stored, bindingFor(profile));

    expect(restored).toEqual(profile);
  });

  it("round-trips a minimal profile (absent optionals stay absent)", () => {
    const profile = makeProfile();
    const restored = fromCustomerProfileFields(
      toCustomerProfileFields(profile),
      bindingFor(profile),
    );

    expect(restored).toEqual(profile);
    expect("dateOfBirth" in restored).toBe(false);
    expect("city" in restored).toBe(false);
  });

  it("accepts a raw acceptedAt that is already a Date (defensive Timestamp/Date handling)", () => {
    const profile = makeProfile();
    const stored = toCustomerProfileFields(profile) as Record<string, unknown>;
    // simulate a store/emulator that hydrated acceptedAt to a Date
    (stored.consentVersions as { acceptedAt: unknown }).acceptedAt = acceptedAt;
    const restored = fromCustomerProfileFields(stored, bindingFor(profile));

    expect(restored.consentVersions.acceptedAt).toEqual(acceptedAt);
  });

  it("throws a governed IdentityDomainError when the stored record is malformed", () => {
    const profile = makeProfile();
    expect(() => fromCustomerProfileFields({ lastName: "Niyonkuru" }, bindingFor(profile))).toThrow(
      IdentityDomainError,
    );
  });
});
