import { describe, expect, it } from "vitest";
import { toCallGetOwnedBusinesses, type OwnedBusinessSummary } from "./ownedBusinesses";

describe("toCallGetOwnedBusinesses", () => {
  it("returns the owned-business summaries the callable resolves", async () => {
    const summaries: OwnedBusinessSummary[] = [
      {
        businessId: "b-1",
        businessCode: "BC-1",
        displayName: "Acme",
        status: "draft",
        primaryCategoryId: "cat-1",
      },
    ];
    const call = toCallGetOwnedBusinesses(async () => ({ data: summaries }));

    const result = await call({ getIdToken: async () => "t", referenceType: "email" });

    expect(result).toEqual(summaries);
  });
});
