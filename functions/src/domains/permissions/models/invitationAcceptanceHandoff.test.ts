/**
 * `ENG-P2-003A` — Invitation acceptance handoff contract tests (Phase J).
 * TDD: written before `invitationAcceptanceHandoff.ts` exists.
 */

import { describe, it, expect } from "vitest";
import {
  createAcceptInvitationRequest,
  type AcceptInvitationRequest,
  type AcceptInvitationResult,
} from "./invitationAcceptanceHandoff";

describe("createAcceptInvitationRequest", () => {
  it("accepts a well-formed invitation reference", () => {
    const request = createAcceptInvitationRequest({ invitationReference: "opaque-ref-1" });
    expect(request).toEqual({ invitationReference: "opaque-ref-1" });
  });

  it("rejects a blank invitation reference", () => {
    expect(() => createAcceptInvitationRequest({ invitationReference: "" })).toThrow();
  });

  it("has no userId field on the request type at compile time", () => {
    // Type-level assertion: AcceptInvitationRequest must not accept/declare
    // a userId key. If a future edit adds one, this assignment stops
    // compiling (caught by `tsc --noEmit` / typecheck), proving the
    // client-facing request cannot select the authoritative membership
    // userId (Phase J).
    type AssertNoUserId = "userId" extends keyof AcceptInvitationRequest ? never : true;
    const assertion: AssertNoUserId = true;
    expect(assertion).toBe(true);
  });

  it("AcceptInvitationResult carries the server-derived userId (output only, never client input)", () => {
    const result: AcceptInvitationResult = {
      membershipId: "mem-1",
      businessId: "biz-a",
      userId: "user-1",
      role: "staff",
      acceptedAt: new Date(),
    };
    expect(result.userId).toBe("user-1");
  });
});
