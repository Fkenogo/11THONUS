import { describe, expect, it } from "vitest";
import { maskPhoneNumber } from "./mask";

describe("maskPhoneNumber", () => {
  it("masks all but the last two digits of an E.164 Burundi number, preserving a leading +", () => {
    expect(maskPhoneNumber("+25779123456")).toBe("+*********56");
  });

  it("masks a shorter number down to the same last-two-digits rule", () => {
    expect(maskPhoneNumber("+2577912")).toBe("+*****12");
  });

  it("returns a fixed placeholder for an empty string", () => {
    expect(maskPhoneNumber("")).toBe("(none)");
  });

  it("masks a number with no leading plus sign using the same digit-count rule", () => {
    expect(maskPhoneNumber("25779123456")).toBe("*********56");
  });
});
