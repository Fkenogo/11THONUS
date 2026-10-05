import { describe, expect, it } from "vitest";
import {
  toCallCustomerExperienceOverview,
  toCallCustomerIdentityPresentation,
} from "./customerExperienceClient";

const actor = { getIdToken: async () => "token", referenceType: "email" } as const;

describe("customer experience callable adapters", () => {
  it("requests the signed-in customer's canonical identity without a target identity", async () => {
    const call = toCallCustomerIdentityPresentation(async (payload) => {
      expect(payload).toEqual({ rawToken: "token", referenceType: "email" });
      return {
        data: {
          displayName: "Amina",
          loyaltyNumber: "LN-123456",
          qrReference: "qr_opaque_123",
          status: "ready" as const,
        },
      };
    });
    await expect(call(actor, {})).resolves.toMatchObject({ qrReference: "qr_opaque_123" });
  });

  it("requests only the authenticated customer's loyalty overview", async () => {
    const call = toCallCustomerExperienceOverview(async (payload) => {
      expect(payload).toEqual({ rawToken: "token", referenceType: "email" });
      return { data: { circles: [], activity: [], availableRewards: [] } };
    });
    await expect(call(actor, {})).resolves.toEqual({
      circles: [],
      activity: [],
      availableRewards: [],
    });
  });
});
