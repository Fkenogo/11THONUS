import { describe, expect, it } from "vitest";
import { issueLoyaltyNumber, MAX_ISSUANCE_ATTEMPTS } from "./loyaltyNumberIssuanceService";
import { LoyaltyNumberDomainError } from "../models/loyaltyNumberErrors";
import type { LoyaltyNumberCandidateGenerator } from "./loyaltyNumberGenerator";
import type { LoyaltyNumberUniquenessPort } from "./loyaltyNumberUniquenessPort";
import type { LoyaltyNumber } from "../models/loyaltyNumber";

const actor = { actorType: "system" as const, actorId: "loyalty-number-service" };
const envelope = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor,
  occurredAt: "2026-08-04T00:00:00.000Z",
};
const now = new Date("2026-08-04T00:00:00.000Z");

class FixedSequenceGenerator implements LoyaltyNumberCandidateGenerator {
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

class FakeUniquenessPort implements LoyaltyNumberUniquenessPort {
  constructor(private readonly alreadyAssigned: Set<LoyaltyNumber> = new Set()) {}
  async isAlreadyAssigned(candidate: LoyaltyNumber): Promise<boolean> {
    return this.alreadyAssigned.has(candidate);
  }
}

class FailingUniquenessPort implements LoyaltyNumberUniquenessPort {
  async isAlreadyAssigned(): Promise<boolean> {
    throw new Error("simulated uniqueness-check backend failure");
  }
}

describe("issueLoyaltyNumber — successful issuance", () => {
  it("issues a new loyalty number for an identity with no existing assignment", async () => {
    const result = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      generator: new FixedSequenceGenerator(["ABC-234"]),
      uniquenessPort: new FakeUniquenessPort(),
    });

    expect(result.assignment.customerIdentityId).toBe("cust_1");
    expect(result.assignment.loyaltyNumber).toBe("ABC234");
    expect(result.assignment.assignedAt).toBe(now);
  });

  it("emits exactly one LoyaltyNumberIssued event on first-attempt success", async () => {
    const result = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      generator: new FixedSequenceGenerator(["ABC-234"]),
      uniquenessPort: new FakeUniquenessPort(),
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.eventType).toBe("loyaltyNumber.loyalty_number_issued.v1");
  });

  it("different identities may receive different numbers", async () => {
    const first = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      generator: new FixedSequenceGenerator(["ABC-234"]),
      uniquenessPort: new FakeUniquenessPort(),
    });
    const second = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_2",
      assignedAt: now,
      generator: new FixedSequenceGenerator(["DEF-567"]),
      uniquenessPort: new FakeUniquenessPort(),
    });

    expect(first.assignment.loyaltyNumber).not.toBe(second.assignment.loyaltyNumber);
    expect(first.assignment.customerIdentityId).toBe("cust_1");
    expect(second.assignment.customerIdentityId).toBe("cust_2");
  });
});

describe("issueLoyaltyNumber — idempotency and existing assignment", () => {
  it("returns the already-issued number unchanged, generating nothing new", async () => {
    const existingAssignment = {
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
      assignedAt: new Date("2026-08-01T00:00:00.000Z"),
    };
    const generator = new FixedSequenceGenerator([]); // would throw if invoked

    const result = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      existingAssignment,
      generator,
      uniquenessPort: new FakeUniquenessPort(),
    });

    expect(result.assignment).toEqual(existingAssignment);
    expect(result.events).toHaveLength(0);
  });

  it("recovery-facing lookup returns the existing number where the interface permits", async () => {
    const existingAssignment = {
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
      assignedAt: new Date("2026-08-01T00:00:00.000Z"),
    };

    const first = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      existingAssignment,
      generator: new FixedSequenceGenerator([]),
      uniquenessPort: new FakeUniquenessPort(),
    });
    const second = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      existingAssignment,
      generator: new FixedSequenceGenerator([]),
      uniquenessPort: new FakeUniquenessPort(),
    });

    expect(first.assignment.loyaltyNumber).toBe(second.assignment.loyaltyNumber);
  });

  it("does not create a second number for the same identity across repeat calls", async () => {
    const generator = new FixedSequenceGenerator(["ABC-234"]);
    const uniquenessPort = new FakeUniquenessPort();

    const firstCall = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      generator,
      uniquenessPort,
    });

    const secondCall = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      existingAssignment: firstCall.assignment,
      generator: new FixedSequenceGenerator([]),
      uniquenessPort,
    });

    expect(secondCall.assignment.loyaltyNumber).toBe(firstCall.assignment.loyaltyNumber);
  });

  it("throws conflictingLoyaltyNumberAssignmentError when the existing assignment belongs to a different identity", async () => {
    const existingAssignment = {
      customerIdentityId: "cust_OTHER",
      loyaltyNumber: "ABC234",
      assignedAt: now,
    };

    await expect(
      issueLoyaltyNumber({
        ...envelope,
        customerIdentityId: "cust_1",
        assignedAt: now,
        existingAssignment,
        generator: new FixedSequenceGenerator([]),
        uniquenessPort: new FakeUniquenessPort(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
  });
});

describe("issueLoyaltyNumber — collision handling", () => {
  it("retries after a single collision and succeeds on the second candidate", async () => {
    const uniquenessPort = new FakeUniquenessPort(new Set(["ABC234"]));
    const result = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      generator: new FixedSequenceGenerator(["ABC-234", "DEF-567"]),
      uniquenessPort,
    });

    expect(result.assignment.loyaltyNumber).toBe("DEF567");
    expect(result.events).toHaveLength(2);
    expect(result.events[0]?.eventType).toBe(
      "loyaltyNumber.loyalty_number_issuance_collision_detected.v1",
    );
    expect(result.events[1]?.eventType).toBe("loyaltyNumber.loyalty_number_issued.v1");
  });

  it("handles multiple consecutive collisions before succeeding", async () => {
    const uniquenessPort = new FakeUniquenessPort(new Set(["ABC234", "DEF567"]));
    const result = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      generator: new FixedSequenceGenerator(["ABC-234", "DEF-567", "GHJ-789"]),
      uniquenessPort,
    });

    expect(result.assignment.loyaltyNumber).toBe("GHJ789");
    expect(result.events).toHaveLength(3);
  });

  it("never includes the colliding candidate value in a collision event payload", async () => {
    const uniquenessPort = new FakeUniquenessPort(new Set(["ABC234"]));
    const result = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      generator: new FixedSequenceGenerator(["ABC-234", "DEF-567"]),
      uniquenessPort,
    });

    expect(JSON.stringify(result.events[0])).not.toContain("ABC234");
  });

  it("fails deterministically once the bounded retry limit is exhausted", async () => {
    const alwaysColliding = new FakeUniquenessPort();
    alwaysColliding.isAlreadyAssigned = async () => true;

    const candidates = Array.from({ length: MAX_ISSUANCE_ATTEMPTS }, (_, i) =>
      i === 0 ? "ABC-234" : `AB${String.fromCharCode(68 + i)}-234`,
    );

    await expect(
      issueLoyaltyNumber({
        ...envelope,
        customerIdentityId: "cust_1",
        assignedAt: now,
        generator: new FixedSequenceGenerator(candidates),
        uniquenessPort: alwaysColliding,
      }),
    ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
  });

  it("uses a deterministic candidate sequence under test (no hidden randomness)", async () => {
    const uniquenessPort = new FakeUniquenessPort();
    const runOnce = () =>
      issueLoyaltyNumber({
        ...envelope,
        customerIdentityId: "cust_1",
        assignedAt: now,
        generator: new FixedSequenceGenerator(["ABC-234"]),
        uniquenessPort,
      });

    const a = await runOnce();
    const b = await runOnce();
    expect(a.assignment.loyaltyNumber).toBe(b.assignment.loyaltyNumber);
  });
});

describe("issueLoyaltyNumber — uniqueness-check failure boundary", () => {
  it("wraps a uniqueness-port failure in a domain error", async () => {
    await expect(
      issueLoyaltyNumber({
        ...envelope,
        customerIdentityId: "cust_1",
        assignedAt: now,
        generator: new FixedSequenceGenerator(["ABC-234"]),
        uniquenessPort: new FailingUniquenessPort(),
      }),
    ).rejects.toMatchObject({ category: "INTEGRATION_FAILED" });
  });
});

describe("issueLoyaltyNumber — eligibility and validation", () => {
  it("rejects issuance for an identity explicitly marked ineligible with no existing number", async () => {
    await expect(
      issueLoyaltyNumber({
        ...envelope,
        customerIdentityId: "cust_1",
        assignedAt: now,
        identityEligibleForIssuance: false,
        generator: new FixedSequenceGenerator([]),
        uniquenessPort: new FakeUniquenessPort(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
  });

  it("still returns the existing number for an ineligible identity that already has one (closed identity keeps its number)", async () => {
    const existingAssignment = {
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
      assignedAt: now,
    };

    const result = await issueLoyaltyNumber({
      ...envelope,
      customerIdentityId: "cust_1",
      assignedAt: now,
      existingAssignment,
      identityEligibleForIssuance: false,
      generator: new FixedSequenceGenerator([]),
      uniquenessPort: new FakeUniquenessPort(),
    });

    expect(result.assignment.loyaltyNumber).toBe("ABC234");
  });

  it("rejects an invalid customer identity id", async () => {
    await expect(
      issueLoyaltyNumber({
        ...envelope,
        customerIdentityId: "",
        assignedAt: now,
        generator: new FixedSequenceGenerator([]),
        uniquenessPort: new FakeUniquenessPort(),
      }),
    ).rejects.toThrow(LoyaltyNumberDomainError);
  });
});

describe("issueLoyaltyNumber — architecture: no recycling", () => {
  it("exposes no release, free, or recycle operation", async () => {
    const serviceModule = await import("./loyaltyNumberIssuanceService");
    const exportedNames = Object.keys(serviceModule);
    const forbidden = exportedNames.filter((name) => /release|free|recycl|reuse/i.test(name));
    expect(forbidden).toEqual([]);
  });
});
