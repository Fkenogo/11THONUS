import { describe, expect, it } from "vitest";
import {
  INVITATION_EXPIRY_DURATION_MS,
  computeInvitationExpiresAt,
  isInvitationPastExpiry,
} from "./invitationPolicy";

describe("invitationPolicy", () => {
  it("computes expiresAt as invitedAt + the named TTL constant", () => {
    const invitedAt = new Date("2026-08-19T00:00:00.000Z");
    const expiresAt = computeInvitationExpiresAt(invitedAt);
    expect(expiresAt.getTime() - invitedAt.getTime()).toBe(INVITATION_EXPIRY_DURATION_MS);
  });

  it("is not past expiry strictly before expiresAt", () => {
    const expiresAt = new Date("2026-08-26T00:00:00.000Z");
    const now = new Date(expiresAt.getTime() - 1);
    expect(isInvitationPastExpiry(expiresAt, now)).toBe(false);
  });

  it("is past expiry exactly at expiresAt (boundary is inclusive)", () => {
    const expiresAt = new Date("2026-08-26T00:00:00.000Z");
    expect(isInvitationPastExpiry(expiresAt, expiresAt)).toBe(true);
  });

  it("is past expiry after expiresAt", () => {
    const expiresAt = new Date("2026-08-26T00:00:00.000Z");
    const now = new Date(expiresAt.getTime() + 1);
    expect(isInvitationPastExpiry(expiresAt, now)).toBe(true);
  });
});
