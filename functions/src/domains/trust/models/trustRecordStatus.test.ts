import { describe, expect, it } from "vitest";
import {
  createTrustRecordStatus,
  isTrustRecordStatus,
  TRUST_RECORD_STATUSES,
} from "./trustRecordStatus";
import { TrustDomainError } from "./trustErrors";

describe("createTrustRecordStatus", () => {
  it.each(TRUST_RECORD_STATUSES)("accepts the known status %s", (value) => {
    expect(createTrustRecordStatus(value)).toBe(value);
  });

  it("rejects an unrecognised status", () => {
    expect(() => createTrustRecordStatus("archived")).toThrow(TrustDomainError);
  });

  it("rejects an empty string", () => {
    expect(() => createTrustRecordStatus("")).toThrow(TrustDomainError);
  });
});

describe("isTrustRecordStatus", () => {
  it("returns false for an unrecognised value", () => {
    expect(isTrustRecordStatus("banned")).toBe(false);
  });
});
