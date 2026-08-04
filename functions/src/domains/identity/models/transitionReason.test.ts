import { describe, expect, it } from "vitest";
import { createTransitionReason, TRANSITION_REASONS } from "./transitionReason";
import { IdentityDomainError } from "./identityErrors";

describe("createTransitionReason", () => {
  it.each(TRANSITION_REASONS)("accepts the known reason category %s", (value) => {
    expect(createTransitionReason(value)).toBe(value);
  });

  it("rejects an unrecognised reason category", () => {
    expect(() => createTransitionReason("customer described their whole life story")).toThrow(
      IdentityDomainError,
    );
  });

  it("rejects an empty string", () => {
    expect(() => createTransitionReason("")).toThrow(IdentityDomainError);
  });
});
