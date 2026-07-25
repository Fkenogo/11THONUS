import { describe, expect, it } from "vitest";
import { resolveTrustedActor } from "./actorValidation";

describe("resolveTrustedActor", () => {
  it("sets userId and authUid from the trusted auth context's uid — the function accepts no client-supplied actor input at all", () => {
    const actor = resolveTrustedActor({ uid: "trusted-uid" });

    expect(actor.userId).toBe("trusted-uid");
    expect(actor.authUid).toBe("trusted-uid");
  });

  it("populates roleContext/businessId/membershipId from the auth token when present", () => {
    const actor = resolveTrustedActor({
      uid: "trusted-uid",
      token: { roleContext: "owner", businessId: "biz-1", membershipId: "member-1" },
    });

    expect(actor.roleContext).toBe("owner");
    expect(actor.businessId).toBe("biz-1");
    expect(actor.membershipId).toBe("member-1");
  });

  it("omits optional fields entirely when the auth token does not carry them", () => {
    const actor = resolveTrustedActor({ uid: "trusted-uid" });

    expect(actor).not.toHaveProperty("roleContext");
    expect(actor).not.toHaveProperty("businessId");
    expect(actor).not.toHaveProperty("membershipId");
  });
});
