import { describe, expect, it } from "vitest";
import { RandomQrReferenceGenerator } from "./randomQrReferenceGenerator";
import { createQrReference } from "../models/qrReference";

describe("RandomQrReferenceGenerator", () => {
  it("generates references that pass createQrReference validation", () => {
    const generator = new RandomQrReferenceGenerator();
    for (let i = 0; i < 20; i++) {
      const reference = generator.generateReference();
      expect(() => createQrReference(reference)).not.toThrow();
    }
  });

  it("generates references that are not trivially predictable/repeating", () => {
    const generator = new RandomQrReferenceGenerator();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      seen.add(generator.generateReference());
    }
    expect(seen.size).toBe(20);
  });
});
