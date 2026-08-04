import { describe, expect, it } from "vitest";
import { createTransitionAuthority, TRANSITION_AUTHORITIES } from "./transitionAuthority";
import { IdentityDomainError } from "./identityErrors";

describe("createTransitionAuthority", () => {
  it.each(TRANSITION_AUTHORITIES)("accepts the known authority category %s", (value) => {
    expect(createTransitionAuthority(value)).toBe(value);
  });

  it("rejects an unrecognised authority category", () => {
    expect(() => createTransitionAuthority("caller_supplied_claim")).toThrow(IdentityDomainError);
  });

  it("rejects an empty string", () => {
    expect(() => createTransitionAuthority("")).toThrow(IdentityDomainError);
  });
});
