import { describe, expect, it } from "vitest";
import { createTrustReference } from "./trustReference";
import { IdentityDomainError } from "./identityErrors";

describe("createTrustReference", () => {
  it("creates a reference carrying only an opaque trust-record pointer and attribution", () => {
    const createdAt = new Date("2026-08-02T00:00:00.000Z");
    const reference = createTrustReference({
      trustRecordId: "trust_9f3a1c2b",
      createdAt,
      createdBy: "system",
    });

    expect(reference).toEqual({
      trustRecordId: "trust_9f3a1c2b",
      createdAt,
      createdBy: "system",
    });
  });

  it("rejects an empty trustRecordId", () => {
    expect(() =>
      createTrustReference({ trustRecordId: "", createdAt: new Date(), createdBy: "system" }),
    ).toThrow(IdentityDomainError);
  });

  it("does not accept any field resembling verification state", () => {
    const reference = createTrustReference({
      trustRecordId: "trust_9f3a1c2b",
      createdAt: new Date(),
      createdBy: null,
    });

    expect(Object.keys(reference).sort()).toEqual(
      ["createdAt", "createdBy", "trustRecordId"].sort(),
    );
  });
});
