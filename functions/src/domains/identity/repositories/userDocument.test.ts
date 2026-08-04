import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { toUserDocument, fromUserDocument } from "./userDocument";
import { IdentityDomainError } from "../models/identityErrors";
import type { CustomerIdentity } from "../models/customerIdentity";

const now = Timestamp.fromDate(new Date("2026-08-04T00:00:00.000Z"));

function buildDomainIdentity(): CustomerIdentity {
  return {
    id: "cust_1",
    status: "active",
    createdAt: new Date("2026-08-04T00:00:00.000Z"),
    createdBy: "cust_1",
    updatedAt: new Date("2026-08-04T00:00:00.000Z"),
    updatedBy: "cust_1",
    authenticationReferences: [
      {
        referenceId: "authuid_1",
        referenceType: "phone_otp",
        linkStatus: "linked",
        createdAt: new Date("2026-08-04T00:00:00.000Z"),
        createdBy: "cust_1",
      },
    ],
  };
}

describe("toUserDocument", () => {
  it("maps a domain CustomerIdentity into the Firestore document shape", () => {
    const doc = toUserDocument(buildDomainIdentity());
    expect(doc.id).toBe("cust_1");
    expect(doc.status).toBe("active");
    expect(doc.authenticationReferences).toHaveLength(1);
    expect(doc.authenticationReferences[0]?.referenceId).toBe("authuid_1");
    expect(doc.trustReference).toBeNull();
  });

  it("maps a defined trustReference through", () => {
    const identity: CustomerIdentity = {
      ...buildDomainIdentity(),
      trustReference: { trustRecordId: "trust_1", createdAt: new Date(), createdBy: "cust_1" },
    };
    const doc = toUserDocument(identity);
    expect(doc.trustReference?.trustRecordId).toBe("trust_1");
  });

  it("never includes an authUid, credential, or verification-state top-level field", () => {
    const doc = toUserDocument(buildDomainIdentity());
    const topLevelKeys = Object.keys(doc).map((key) => key.toLowerCase());
    for (const forbidden of ["authuid", "password", "token", "verified", "verificationstate"]) {
      expect(topLevelKeys).not.toContain(forbidden);
    }
  });
});

describe("fromUserDocument", () => {
  it("round-trips a valid document back into a domain-shaped CustomerIdentity", () => {
    const raw = {
      id: "cust_1",
      schemaVersion: 1,
      status: "active",
      authenticationReferences: [
        {
          referenceId: "authuid_1",
          referenceType: "phone_otp",
          linkStatus: "linked",
          createdAt: now,
          createdBy: "cust_1",
        },
      ],
      trustReference: null,
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };

    const identity = fromUserDocument(raw);
    expect(identity.id).toBe("cust_1");
    expect(identity.status).toBe("active");
    expect(identity.authenticationReferences).toHaveLength(1);
  });

  it("rejects a malformed document missing required fields", () => {
    expect(() => fromUserDocument({ id: "cust_1" })).toThrow(IdentityDomainError);
  });

  it("rejects a document with an unrecognised status value", () => {
    const raw = {
      id: "cust_1",
      schemaVersion: 1,
      status: "not_a_real_status",
      authenticationReferences: [],
      trustReference: null,
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };
    expect(() => fromUserDocument(raw)).toThrow(IdentityDomainError);
  });

  it("rejects a document with a non-array authenticationReferences field", () => {
    const raw = {
      id: "cust_1",
      schemaVersion: 1,
      status: "active",
      authenticationReferences: "not-an-array",
      trustReference: null,
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };
    expect(() => fromUserDocument(raw)).toThrow(IdentityDomainError);
  });
});
