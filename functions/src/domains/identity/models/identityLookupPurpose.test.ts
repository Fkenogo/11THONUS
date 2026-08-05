import { describe, expect, it } from "vitest";
import { createIdentityLookupPurpose, IDENTITY_LOOKUP_PURPOSES } from "./identityLookupPurpose";
import { IdentityDomainError } from "./identityErrors";

describe("createIdentityLookupPurpose", () => {
  it.each(IDENTITY_LOOKUP_PURPOSES)("accepts the known purpose category %s", (value) => {
    expect(createIdentityLookupPurpose(value)).toBe(value);
  });

  it("rejects an unrecognised purpose category", () => {
    expect(() => createIdentityLookupPurpose("caller_supplied_claim")).toThrow(IdentityDomainError);
  });

  it("rejects an empty string", () => {
    expect(() => createIdentityLookupPurpose("")).toThrow(IdentityDomainError);
  });
});
