import { describe, expect, it } from "vitest";
import { BusinessApiError } from "./businessCallableClient";
import { toCallAcceptBusinessTerms } from "./acceptBusinessTerms";

describe("toCallAcceptBusinessTerms", () => {
  it("sends only businessId and idempotencyKey — never a termsVersion, identity, or timestamp field", async () => {
    const call = toCallAcceptBusinessTerms(async (payload) => {
      expect(payload).toEqual({
        businessId: "b-1",
        idempotencyKey: "key-1",
        rawToken: "t",
        referenceType: "email",
      });
      return {
        data: {
          businessId: "b-1",
          termsVersion: "2026-08-21",
          acceptedAt: "2026-08-22T00:00:00.000Z",
          alreadyAccepted: false,
        },
      };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1", idempotencyKey: "key-1" },
    );

    expect(result.termsVersion).toBe("2026-08-21");
  });

  it("maps the Terms-configuration-unavailable failure to the unavailable client code", async () => {
    const call = toCallAcceptBusinessTerms(async () => {
      throw Object.assign(new Error("terms not configured"), { code: "functions/unavailable" });
    });

    await expect(
      call(
        { getIdToken: async () => "t", referenceType: "email" },
        { businessId: "b-1", idempotencyKey: "k" },
      ),
    ).rejects.toBeInstanceOf(BusinessApiError);
    await expect(
      call(
        { getIdToken: async () => "t", referenceType: "email" },
        { businessId: "b-1", idempotencyKey: "k" },
      ),
    ).rejects.toMatchObject({ code: "unavailable" });
  });
});
