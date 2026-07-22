import { describe, expect, it } from "vitest";
import { PLATFORM_REGION } from "./region";

describe("PLATFORM_REGION", () => {
  it("is the DEC-TECH-005 approved Version 1 region", () => {
    expect(PLATFORM_REGION).toBe("europe-west1");
  });
});
