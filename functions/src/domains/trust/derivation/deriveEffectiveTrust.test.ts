import { describe, expect, it } from "vitest";
import { deriveEffectiveTrust } from "./deriveEffectiveTrust";
import * as deriveEffectiveTrustModule from "./deriveEffectiveTrust";
import {
  CURRENT_TRUST_RULE_VERSION,
  type CustomerIdentityReadResult,
  type EffectiveTrustDerivationInput,
  type TrustRecordReadResult,
} from "./types";

const CUSTOMER_IDENTITY_ID = "cust_001";
const DAY_MS = 86_400_000;

function found(hasSuccessfulAuthentication: boolean): TrustRecordReadResult {
  return { kind: "found", hasSuccessfulAuthentication };
}

function registeredAgo(now: Date, days: number): CustomerIdentityReadResult {
  return { kind: "found", registeredAt: new Date(now.getTime() - days * DAY_MS) };
}

function baseInput(
  overrides: Partial<EffectiveTrustDerivationInput> = {},
): EffectiveTrustDerivationInput {
  const now = new Date("2026-08-16T00:00:00.000Z");
  return {
    customerIdentityId: CUSTOMER_IDENTITY_ID,
    customerIdentity: registeredAgo(now, 0),
    trustRecord: found(false),
    now,
    ruleVersion: CURRENT_TRUST_RULE_VERSION,
    ...overrides,
  };
}

function expectDerived(input: EffectiveTrustDerivationInput) {
  const outcome = deriveEffectiveTrust(input);
  if (outcome.kind !== "derived") {
    throw new Error(`Expected a derived result, got failure: ${JSON.stringify(outcome)}`);
  }
  return outcome.result;
}

function expectFailed(input: EffectiveTrustDerivationInput) {
  const outcome = deriveEffectiveTrust(input);
  if (outcome.kind !== "failed") {
    throw new Error(`Expected a failed result, got: ${JSON.stringify(outcome)}`);
  }
  return outcome;
}

describe("deriveEffectiveTrust — CAP-P2-ITM-C", () => {
  const now = new Date("2026-08-16T00:00:00.000Z");

  describe("no authentication evidence (scenarios 1-4)", () => {
    it.each([0, 29.99, 30, 365])("age %s days, no auth -> unverified", (days) => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, days),
        trustRecord: found(false),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("unverified");
    });
  });

  describe("authentication evidence present (scenarios 5-8)", () => {
    it("age 0 -> provisional", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 0),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("provisional");
    });

    it("just below 30 elapsed days (29 days) -> provisional", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 29),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("provisional");
    });

    it("exactly 30 elapsed days -> established", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 30),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("established");
    });

    it("just above 30 elapsed days (31 days) -> established", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("established");
    });

    it("29 days + 23h59m59s (still < 30 elapsed days) -> provisional", () => {
      const registeredAt = new Date(
        now.getTime() - (29 * DAY_MS + 23 * 3_600_000 + 59 * 60_000 + 59_000),
      );
      const input = baseInput({
        customerIdentity: { kind: "found", registeredAt },
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("provisional");
    });

    it("30 days + 1 second (just past the crossing) -> established", () => {
      const registeredAt = new Date(now.getTime() - (30 * DAY_MS + 1_000));
      const input = baseInput({
        customerIdentity: { kind: "found", registeredAt },
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("established");
    });
  });

  describe("recovery neutrality (scenarios 9-12)", () => {
    // Recovery evidence never reaches this pure function as a positive/
    // negative signal at all (AD-ITM-2) — `TrustRecordReadResult` only
    // ever carries `hasSuccessfulAuthentication`, structurally guaranteeing
    // no recovery-only path can influence the derived band. These cases
    // confirm the *outcome* recovery-only evidence produces is identical
    // to no evidence at all.
    it("recovery only, age < 30 -> unverified", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 5),
        trustRecord: found(false),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("unverified");
    });

    it("recovery only, age >= 30 -> unverified", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 45),
        trustRecord: found(false),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("unverified");
    });

    it("auth + recovery, age < 30 -> provisional", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 5),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("provisional");
    });

    it("auth + recovery, age >= 30 -> established", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 45),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("established");
    });
  });

  describe("invariants (scenarios 13-15, 24, 26-29)", () => {
    it("provider type cannot affect the result (not representable in the input at all)", () => {
      // `TrustRecordReadResult`/`CustomerIdentityReadResult` carry no
      // provider field — this is a type-level guarantee, exercised here
      // only to document the invariant alongside the others.
      const input = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("established");
    });

    it("number of authentication events cannot affect the result (boolean evidence only)", () => {
      const once = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: found(true),
        now,
      });
      const stillJustTrue = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: { kind: "found", hasSuccessfulAuthentication: true },
        now,
      });
      expect(expectDerived(once).effectiveTrustLevel).toBe(
        expectDerived(stillJustTrue).effectiveTrustLevel,
      );
    });

    it("persisted trustLevel cannot override the result (not part of the input type at all)", () => {
      // `TrustRecordReadResult` never carries a `trustLevel` field —
      // structurally impossible for a stale cached value to reach this
      // function, let alone override its output.
      const input = baseInput({
        customerIdentity: registeredAgo(now, 5),
        trustRecord: found(true),
        now,
      });
      expect(expectDerived(input).effectiveTrustLevel).toBe("provisional");
    });

    it("repeated identical inputs produce identical results", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: found(true),
        now,
      });
      const a = expectDerived(input);
      const b = expectDerived(input);
      expect(a).toEqual(b);
    });

    it("result contains no credential/PII fields", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: found(true),
        now,
      });
      const result = expectDerived(input);
      const keys = Object.keys(result).concat(Object.keys(result.basis));
      for (const forbidden of ["email", "phone", "token", "otp", "password", "credential"]) {
        expect(keys.some((key) => key.toLowerCase().includes(forbidden))).toBe(false);
      }
    });

    it("no numeric trust score exists on the result", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: found(true),
        now,
      });
      const result = expectDerived(input);
      expect(result).not.toHaveProperty("score");
      expect(result).not.toHaveProperty("trustScore");
    });

    it("no downward-transition code path exists — a lower elapsed age never reduces a fixed evidence state below its rule-defined band", () => {
      const established = expectDerived(
        baseInput({ customerIdentity: registeredAgo(now, 31), trustRecord: found(true), now }),
      );
      const provisional = expectDerived(
        baseInput({ customerIdentity: registeredAgo(now, 5), trustRecord: found(true), now }),
      );
      // Distinct ages produce distinct bands by re-derivation, never by
      // mutating a previous result — there is no "previous result" input
      // to this pure function at all, only fresh evidence + time.
      expect(established.effectiveTrustLevel).toBe("established");
      expect(provisional.effectiveTrustLevel).toBe("provisional");
    });

    it("no operator-facing field exists on the result (internal-only, AD-ITM-4)", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 31),
        trustRecord: found(true),
        now,
      });
      const result = expectDerived(input);
      expect(result).not.toHaveProperty("operatorVisible");
      expect(result).not.toHaveProperty("customerFacingLabel");
    });
  });

  describe("rule version handling (scenarios 16-17)", () => {
    it("unsupported (but well-formed) rule version fails closed", () => {
      const outcome = expectFailed(baseInput({ ruleVersion: CURRENT_TRUST_RULE_VERSION + 1 }));
      expect(outcome.reason).toBe("unsupported_rule_version");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });

    it.each([0, -1, 1.5, Number.NaN])("malformed rule version (%s) fails closed", (ruleVersion) => {
      const outcome = expectFailed(baseInput({ ruleVersion }));
      expect(outcome.reason).toBe("malformed_rule_version");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });
  });

  describe("missing/malformed trust record (scenarios 18-19)", () => {
    it("missing trust record for a known identity fails closed to unverified (ITM-DESIGN-001 §13 — expected steady state, not an error)", () => {
      const input = baseInput({
        customerIdentity: registeredAgo(now, 45),
        trustRecord: { kind: "not_found" },
        now,
      });
      const result = expectDerived(input);
      expect(result.effectiveTrustLevel).toBe("unverified");
      expect(result.basis.hasSuccessfulAuthentication).toBe(false);
    });

    it("malformed trust record fails closed", () => {
      const outcome = expectFailed(
        baseInput({ customerIdentity: registeredAgo(now, 45), trustRecord: { kind: "malformed" } }),
      );
      expect(outcome.reason).toBe("trust_record_malformed");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });

    it("transient trust record read failure fails closed as TEMPORARY_UNAVAILABLE", () => {
      const outcome = expectFailed(
        baseInput({
          customerIdentity: registeredAgo(now, 45),
          trustRecord: { kind: "transient_failure" },
        }),
      );
      expect(outcome.reason).toBe("trust_record_read_failed");
      expect(outcome.errorCategory).toBe("TEMPORARY_UNAVAILABLE");
    });
  });

  describe("missing/malformed Customer Identity (scenarios 20-21)", () => {
    it("missing Customer Identity fails closed", () => {
      const outcome = expectFailed(baseInput({ customerIdentity: { kind: "not_found" } }));
      expect(outcome.reason).toBe("customer_identity_not_found");
      expect(outcome.errorCategory).toBe("RESOURCE_NOT_FOUND");
    });

    it("malformed Customer Identity fails closed", () => {
      const outcome = expectFailed(baseInput({ customerIdentity: { kind: "malformed" } }));
      expect(outcome.reason).toBe("customer_identity_malformed");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });

    it("transient Customer Identity read failure fails closed as TEMPORARY_UNAVAILABLE", () => {
      const outcome = expectFailed(baseInput({ customerIdentity: { kind: "transient_failure" } }));
      expect(outcome.reason).toBe("customer_identity_read_failed");
      expect(outcome.errorCategory).toBe("TEMPORARY_UNAVAILABLE");
    });
  });

  describe("invalid time (scenarios 22-23)", () => {
    it("future registeredAt fails closed", () => {
      const future = new Date(now.getTime() + DAY_MS);
      const outcome = expectFailed(
        baseInput({ customerIdentity: { kind: "found", registeredAt: future }, now }),
      );
      expect(outcome.reason).toBe("registered_at_in_future");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });

    it("malformed registeredAt (invalid Date) fails closed", () => {
      const outcome = expectFailed(
        baseInput({ customerIdentity: { kind: "found", registeredAt: new Date("not-a-date") } }),
      );
      expect(outcome.reason).toBe("registered_at_invalid");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });

    it("invalid `now` fails closed", () => {
      const outcome = expectFailed(baseInput({ now: new Date("not-a-date") }));
      expect(outcome.reason).toBe("invalid_current_time");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });

    it("`now` earlier than registeredAt fails closed (registered-in-future from now's perspective)", () => {
      const registeredAt = new Date("2026-08-16T00:00:00.000Z");
      const earlierNow = new Date("2026-08-15T00:00:00.000Z");
      const outcome = expectFailed(
        baseInput({ customerIdentity: { kind: "found", registeredAt }, now: earlierNow }),
      );
      expect(outcome.reason).toBe("registered_at_in_future");
    });
  });

  describe("empty customerIdentityId", () => {
    it("blank customerIdentityId fails closed", () => {
      const outcome = expectFailed(baseInput({ customerIdentityId: "   " }));
      expect(outcome.reason).toBe("invalid_customer_identity_id");
      expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    });
  });

  describe("no regression logic exists (scenario 27)", () => {
    it("the module exports only the pure derivation function — no mutation/regression function", () => {
      expect(Object.keys(deriveEffectiveTrustModule).sort()).toEqual(["deriveEffectiveTrust"]);
    });
  });
});
