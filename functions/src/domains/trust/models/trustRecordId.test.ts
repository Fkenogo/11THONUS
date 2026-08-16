import { describe, expect, it } from "vitest";
import { createTrustRecordId } from "./trustRecordId";
import { TrustDomainError } from "./trustErrors";

describe("createTrustRecordId", () => {
  it("accepts a non-empty id", () => {
    expect(createTrustRecordId("trust-record-1")).toBe("trust-record-1");
  });

  it("rejects an empty string", () => {
    expect(() => createTrustRecordId("")).toThrow(TrustDomainError);
  });

  it("rejects a whitespace-only string", () => {
    expect(() => createTrustRecordId("   ")).toThrow(TrustDomainError);
  });
});
