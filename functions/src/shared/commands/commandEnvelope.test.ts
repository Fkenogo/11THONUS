import { describe, expect, it } from "vitest";
import type { CommandEnvelope } from "./commandEnvelope";

describe("CommandEnvelope", () => {
  it("accepts an envelope with only the required actor fields", () => {
    const envelope: CommandEnvelope<{ amount: number }> = {
      commandId: "cmd-1",
      commandType: "purchase.recordPurchase.v1",
      commandVersion: 1,
      idempotencyKey: "idem-1",
      actor: { userId: "user-1", authUid: "auth-1" },
      correlationId: "corr-1",
      payload: { amount: 100 },
    };

    expect(envelope.payload.amount).toBe(100);
  });

  it("accepts an envelope with every optional actor and top-level field populated", () => {
    const envelope: CommandEnvelope<{ amount: number }> = {
      commandId: "cmd-1",
      commandType: "purchase.recordPurchase.v1",
      commandVersion: 1,
      idempotencyKey: "idem-1",
      actor: {
        userId: "user-1",
        authUid: "auth-1",
        roleContext: "owner",
        businessId: "biz-1",
        membershipId: "member-1",
      },
      issuedAtClient: "2026-07-25T00:00:00.000Z",
      correlationId: "corr-1",
      payload: { amount: 100 },
    };

    expect(envelope.actor.businessId).toBe("biz-1");
  });
});
