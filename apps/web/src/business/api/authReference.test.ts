import { describe, expect, it } from "vitest";
import { UnresolvedAuthReferenceError, resolveAuthReferenceType } from "./authReference";

describe("resolveAuthReferenceType", () => {
  it("maps Firebase's google.com provider id to the backend's google_sign_in referenceType", () => {
    expect(resolveAuthReferenceType("google.com")).toBe("google_sign_in");
  });

  it("maps Firebase's password provider id to the backend's email referenceType", () => {
    expect(resolveAuthReferenceType("password")).toBe("email");
  });

  it("maps Firebase's phone provider id to the backend's phone_otp referenceType", () => {
    expect(resolveAuthReferenceType("phone")).toBe("phone_otp");
  });

  it("throws for an unmapped/unknown provider id rather than guessing", () => {
    expect(() => resolveAuthReferenceType("apple.com")).toThrow(UnresolvedAuthReferenceError);
    expect(() => resolveAuthReferenceType(undefined)).toThrow(UnresolvedAuthReferenceError);
  });
});
