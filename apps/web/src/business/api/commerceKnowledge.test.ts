import { describe, expect, it } from "vitest";
import {
  toCallListBusinessCategories,
  toCallListBusinessTypesForCategory,
} from "./commerceKnowledge";

const options = [{ id: "cat-1", displayLabel: "Salon", nodeType: "business_category" as const }];

describe("toCallListBusinessCategories", () => {
  it("returns the category options", async () => {
    const call = toCallListBusinessCategories(async () => ({ data: options }));

    const result = await call({ getIdToken: async () => "t", referenceType: "email" }, {});

    expect(result).toEqual(options);
  });
});

describe("toCallListBusinessTypesForCategory", () => {
  it("passes categoryId through and returns the type options (possibly empty)", async () => {
    const call = toCallListBusinessTypesForCategory(async (payload) => {
      expect(payload).toMatchObject({ categoryId: "cat-1" });
      return { data: [] };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { categoryId: "cat-1" },
    );

    expect(result).toEqual([]);
  });
});
