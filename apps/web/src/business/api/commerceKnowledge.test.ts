import { describe, expect, it } from "vitest";
import {
  toCallListBusinessCategories,
  toCallListBusinessTypesForCategory,
  toCallListRewardProgramCategories,
  toCallListQualifyingNodesForCategory,
  toCallListQualifyingNodesForBusinessType,
  toCallSearchQualifyingNodes,
  toCallResolveKnowledgeNodeLabels,
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

/** `PLATFORM-BASELINE-008`: the Reward Program category/qualifying-node selector adapters. */
describe("toCallListRewardProgramCategories", () => {
  it("returns the Reward Program category options", async () => {
    const rewardProgramCategories = [
      { id: "rpc-1", displayLabel: "Hair Services", nodeType: "reward_program_category" as const },
    ];
    const call = toCallListRewardProgramCategories(async () => ({
      data: rewardProgramCategories,
    }));

    const result = await call({ getIdToken: async () => "t", referenceType: "email" }, {});

    expect(result).toEqual(rewardProgramCategories);
  });
});

describe("toCallListQualifyingNodesForCategory", () => {
  it("passes categoryId through and returns the qualifying-node options (possibly empty)", async () => {
    const call = toCallListQualifyingNodesForCategory(async (payload) => {
      expect(payload).toMatchObject({ categoryId: "rpc-1" });
      return { data: [] };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { categoryId: "rpc-1" },
    );

    expect(result).toEqual([]);
  });
});

/**
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`): the qualifying-node selector's DEFAULT
 * discovery scope adapter.
 */
describe("toCallListQualifyingNodesForBusinessType", () => {
  it("passes businessTypeId through and returns the qualifying-node options (possibly empty)", async () => {
    const call = toCallListQualifyingNodesForBusinessType(async (payload) => {
      expect(payload).toMatchObject({ businessTypeId: "bt-1" });
      return { data: [] };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessTypeId: "bt-1" },
    );

    expect(result).toEqual([]);
  });
});

/**
 * `PLATFORM-BASELINE-010B`: the qualifying-node selector's broader,
 * platform-wide "escape hatch" search adapter — no Business-Type
 * restriction.
 */
describe("toCallSearchQualifyingNodes", () => {
  it("passes searchText through and returns matching qualifying-node options", async () => {
    const matches = [
      {
        id: "node-sedan-wash",
        displayLabel: "Sedan Car Wash",
        nodeType: "standard_service" as const,
      },
    ];
    const call = toCallSearchQualifyingNodes(async (payload) => {
      expect(payload).toMatchObject({ searchText: "sedan" });
      return { data: matches };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { searchText: "sedan" },
    );

    expect(result).toEqual(matches);
  });
});

describe("toCallResolveKnowledgeNodeLabels", () => {
  it("passes nodeIds through and returns display-only label resolutions, including unresolvable ids", async () => {
    const labels = [
      { id: "node-1", displayLabel: "Haircut", status: "active" as const },
      { id: "node-2", displayLabel: null, status: null },
    ];
    const call = toCallResolveKnowledgeNodeLabels(async (payload) => {
      expect(payload).toMatchObject({ nodeIds: ["node-1", "node-2"] });
      return { data: labels };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { nodeIds: ["node-1", "node-2"] },
    );

    expect(result).toEqual(labels);
  });
});
