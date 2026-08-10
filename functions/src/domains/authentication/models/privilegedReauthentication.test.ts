/**
 * AUTH-07 — Privileged re-authentication freshness policy (unit tests).
 *
 * Pure-domain freshness check: proves the server-enforced maximum-age gate on
 * the trusted `authenticatedAt` (Firebase `auth_time`) — boundary below/at/above
 * the configured maximum, the non-default configurable value, fail-closed on
 * absent/malformed authentication-time evidence, and that verification time
 * (`verifiedAt`) never substitutes for authentication time. No Firebase, no clock
 * of its own — `now` is always injected (server-controlled), never client input.
 */

import { describe, expect, it } from "vitest";
import { createAuthenticatedCredential } from "./authenticatedCredential";
import { AuthenticationDomainError } from "./authenticationErrors";
import {
  DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS,
  assertFreshAuthentication,
} from "./privilegedReauthentication";

const now = new Date("2026-08-10T12:00:00.000Z");

function credentialAuthenticatedAt(authenticatedAt: Date | undefined) {
  return createAuthenticatedCredential({
    referenceType: "phone_otp",
    referenceId: "authuid_1",
    // A *freshly verified* token: verifiedAt is now, so a naive check on
    // verifiedAt would always pass — the gate must use authenticatedAt.
    verifiedAt: now,
    authenticatedAt,
  });
}

describe("assertFreshAuthentication", () => {
  it("defaults the maximum age to the Founder-decided 5 minutes (TRD12 §12.29)", () => {
    expect(DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS).toBe(5 * 60 * 1000);
  });

  it("accepts authentication just below the maximum age", () => {
    const authenticatedAt = new Date(now.getTime() - (5 * 60 * 1000 - 1_000)); // 4m59s ago
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(authenticatedAt), now),
    ).not.toThrow();
  });

  it("accepts authentication exactly at the maximum age (age <= max is eligible)", () => {
    const authenticatedAt = new Date(now.getTime() - 5 * 60 * 1000); // exactly 5m ago
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(authenticatedAt), now),
    ).not.toThrow();
  });

  it("rejects authentication just above the maximum age (AUTH_REQUIRED)", () => {
    const authenticatedAt = new Date(now.getTime() - (5 * 60 * 1000 + 1_000)); // 5m01s ago
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(authenticatedAt), now),
    ).toThrow(AuthenticationDomainError);
    try {
      assertFreshAuthentication(credentialAuthenticatedAt(authenticatedAt), now);
    } catch (error) {
      expect((error as AuthenticationDomainError).category).toBe("AUTH_REQUIRED");
    }
  });

  it("a freshly verified token whose auth_time is old still fails (refresh does not reset freshness)", () => {
    // verifiedAt = now (just verified/refreshed) but authenticated 30 minutes ago.
    const staleAuthenticatedAt = new Date(now.getTime() - 30 * 60 * 1000);
    const credential = credentialAuthenticatedAt(staleAuthenticatedAt);
    expect(credential.verifiedAt).toEqual(now); // proves it is freshly verified
    expect(() => assertFreshAuthentication(credential, now)).toThrow(AuthenticationDomainError);
  });

  it("honours a different injected maximum age (5 minutes is a default, not a fixed constant)", () => {
    const authenticatedAt = new Date(now.getTime() - 8 * 60 * 1000); // 8m ago
    const tenMinutes = 10 * 60 * 1000;
    const oneMinute = 60 * 1000;
    // Eligible under a 10-minute policy...
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(authenticatedAt), now, tenMinutes),
    ).not.toThrow();
    // ...rejected under a 1-minute policy.
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(authenticatedAt), now, oneMinute),
    ).toThrow(AuthenticationDomainError);
  });

  it("fails closed (AUTH_REQUIRED) when authenticatedAt is absent", () => {
    const credential = credentialAuthenticatedAt(undefined);
    expect(() => assertFreshAuthentication(credential, now)).toThrow(AuthenticationDomainError);
    try {
      assertFreshAuthentication(credential, now);
    } catch (error) {
      expect((error as AuthenticationDomainError).category).toBe("AUTH_REQUIRED");
    }
  });

  it("fails closed when authentication time is in the future (anomalous, not fresh)", () => {
    const future = new Date(now.getTime() + 60 * 1000);
    expect(() => assertFreshAuthentication(credentialAuthenticatedAt(future), now)).toThrow(
      AuthenticationDomainError,
    );
  });

  it("requires a valid server-controlled now", () => {
    const authenticatedAt = new Date(now.getTime() - 60 * 1000);
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(authenticatedAt), new Date("not-a-date")),
    ).toThrow(AuthenticationDomainError);
  });

  // A misconfigured policy value must fail closed — never silently disable the
  // gate. With NaN/Infinity, `ageMs > maxAgeMs` is always false, so without a
  // guard a credential of *any* age would pass (fail-open).
  it("fails closed for a non-finite maximum age (NaN — e.g. a malformed setting), even for old authentication", () => {
    const oldAuth = new Date(now.getTime() - 60 * 60 * 1000); // 1h ago
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(oldAuth), now, Number.NaN),
    ).toThrow(AuthenticationDomainError);
  });

  it("fails closed for an infinite maximum age", () => {
    const oldAuth = new Date(now.getTime() - 60 * 60 * 1000);
    expect(() =>
      assertFreshAuthentication(credentialAuthenticatedAt(oldAuth), now, Number.POSITIVE_INFINITY),
    ).toThrow(AuthenticationDomainError);
  });

  it("fails closed for a negative maximum age", () => {
    const recentAuth = new Date(now.getTime() - 1_000);
    expect(() => assertFreshAuthentication(credentialAuthenticatedAt(recentAuth), now, -1)).toThrow(
      AuthenticationDomainError,
    );
  });
});
