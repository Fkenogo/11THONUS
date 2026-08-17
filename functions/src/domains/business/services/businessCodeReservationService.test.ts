import { describe, expect, it } from "vitest";
import {
  reserveBusinessCode,
  MAX_BUSINESS_CODE_GENERATION_ATTEMPTS,
} from "./businessCodeReservationService";
import { BusinessDomainError } from "../models/businessErrors";
import type { BusinessCodeCandidateGenerator } from "./businessCodeGenerator";
import type { BusinessCodeUniquenessPort } from "./businessCodeUniquenessPort";

class FixedSequenceGenerator implements BusinessCodeCandidateGenerator {
  private index = 0;
  constructor(private readonly sequence: string[]) {}
  generateCandidate(): string {
    const value = this.sequence[this.index];
    if (value === undefined) {
      throw new Error("FixedSequenceGenerator exhausted — test provided too few candidates");
    }
    this.index += 1;
    return value;
  }
}

class FakeUniquenessPort implements BusinessCodeUniquenessPort {
  constructor(private readonly reserved: Set<string> = new Set()) {}
  async isAlreadyReserved(candidate: string): Promise<boolean> {
    return this.reserved.has(candidate);
  }
}

class FailingUniquenessPort implements BusinessCodeUniquenessPort {
  async isAlreadyReserved(): Promise<boolean> {
    throw new Error("simulated uniqueness-check backend failure");
  }
}

describe("reserveBusinessCode — first-attempt success", () => {
  it("reserves the first well-formed, unreserved candidate", async () => {
    const result = await reserveBusinessCode({
      generator: new FixedSequenceGenerator(["BIZ234567"]),
      uniquenessPort: new FakeUniquenessPort(),
    });

    expect(result.businessCode).toBe("BIZ234567");
    expect(result.attempts).toBe(1);
  });
});

describe("reserveBusinessCode — collision retry", () => {
  it("retries once on a single collision then succeeds", async () => {
    const result = await reserveBusinessCode({
      generator: new FixedSequenceGenerator(["BIZ234567", "BIZ234568"]),
      uniquenessPort: new FakeUniquenessPort(new Set(["BIZ234567"])),
    });

    expect(result.businessCode).toBe("BIZ234568");
    expect(result.attempts).toBe(2);
  });

  it("exhausts after MAX_BUSINESS_CODE_GENERATION_ATTEMPTS consecutive collisions", async () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const candidates = Array.from(
      { length: MAX_BUSINESS_CODE_GENERATION_ATTEMPTS },
      (_, i) => `BIZ23456${alphabet[i]}`,
    );
    const allReserved = new Set(candidates);

    await expect(
      reserveBusinessCode({
        generator: new FixedSequenceGenerator(candidates),
        uniquenessPort: new FakeUniquenessPort(allReserved),
      }),
    ).rejects.toMatchObject({
      category: "TEMPORARY_UNAVAILABLE",
    });
  });

  it("never exceeds MAX_BUSINESS_CODE_GENERATION_ATTEMPTS calls to the generator", async () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let calls = 0;
    const generator: BusinessCodeCandidateGenerator = {
      generateCandidate: () => {
        const value = `BIZ23456${alphabet[calls]}`;
        calls += 1;
        return value;
      },
    };

    await expect(
      reserveBusinessCode({
        generator,
        uniquenessPort: {
          isAlreadyReserved: async () => true,
        },
      }),
    ).rejects.toThrow(BusinessDomainError);
    expect(calls).toBe(MAX_BUSINESS_CODE_GENERATION_ATTEMPTS);
  });
});

describe("reserveBusinessCode — malformed candidates fail closed (defense in depth)", () => {
  it("rejects a candidate that does not match the governed format even if unreserved", async () => {
    await expect(
      reserveBusinessCode({
        generator: new FixedSequenceGenerator(["not-a-valid-code"]),
        uniquenessPort: new FakeUniquenessPort(),
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });
});

describe("reserveBusinessCode — uniqueness-check failure", () => {
  it("propagates as TEMPORARY_UNAVAILABLE rather than silently retrying forever", async () => {
    await expect(
      reserveBusinessCode({
        generator: new FixedSequenceGenerator(["BIZ234567"]),
        uniquenessPort: new FailingUniquenessPort(),
      }),
    ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
  });
});
