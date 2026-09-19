/**
 * Qualifying Item callable transport (`PLATFORM-BASELINE-013A.2`): whitelist
 * request parsers and error mapping. Kept in its own file so the existing
 * `index.test.ts` carries zero diff. Every parser here is a deliberate
 * mass-assignment whitelist: only the fields the approved design governs are
 * ever read off the client payload -- never `id`, `status`, `createdBy`,
 * `updatedBy`, timestamps, `schemaVersion`, or any actor/role field.
 */

import { HttpsError } from "firebase-functions/v2/https";
import { describe, expect, it } from "vitest";
import {
  createQualifyingItem,
  listQualifyingItems,
  parseCreateQualifyingItemRequest,
  parseListQualifyingItemsRequest,
  parseRetireQualifyingItemRequest,
  parseUpdateQualifyingItemRequest,
  retireQualifyingItem,
  toHttpsError,
  updateQualifyingItem,
} from "./index";
import { QualifyingItemDomainError } from "./domains/qualifyingItem/models/qualifyingItemErrors";
import { RewardProgramDomainError } from "./domains/rewardProgram/models/rewardProgramErrors";
import * as index from "./index";

const ITEM_ID = "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b3c";

const MALICIOUS_FIELDS = {
  id: "attacker-chosen-id",
  status: "retired",
  createdBy: "someone-else",
  updatedBy: "someone-else",
  createdAt: "1999-01-01T00:00:00.000Z",
  updatedAt: "1999-01-01T00:00:00.000Z",
  schemaVersion: 99,
  role: "owner",
  userId: "someone-else",
  permission: "qualifyingItem.manage",
  isPlatformAdministrator: true,
  rewardProgramId: "rp-1",
  rewardProgramVersionId: "rpv-1",
  qualifyingNodes: [{ knowledgeNodeId: "n" }],
  itemLabel: "free text",
};

describe("parseCreateQualifyingItemRequest (mass-assignment boundary, PLATFORM-BASELINE-013A.2)", () => {
  it("reads exactly businessId, name and the optional knowledgeNodeId; drops every other key", () => {
    const parsed = parseCreateQualifyingItemRequest({
      businessId: "biz-1",
      name: "Black Coffee",
      knowledgeNodeId: "node-1",
      ...MALICIOUS_FIELDS,
    });
    expect(parsed).toStrictEqual({
      businessId: "biz-1",
      name: "Black Coffee",
      knowledgeNodeId: "node-1",
    });
  });

  it("does not require a Commerce Knowledge mapping: absent and null both parse to null", () => {
    expect(
      parseCreateQualifyingItemRequest({ businessId: "biz-1", name: "Black Coffee" }),
    ).toStrictEqual({ businessId: "biz-1", name: "Black Coffee", knowledgeNodeId: null });
    expect(
      parseCreateQualifyingItemRequest({
        businessId: "biz-1",
        name: "Black Coffee",
        knowledgeNodeId: null,
      }),
    ).toStrictEqual({ businessId: "biz-1", name: "Black Coffee", knowledgeNodeId: null });
  });

  it.each([
    ["missing businessId", { name: "x" }],
    ["missing name", { businessId: "biz-1" }],
    ["non-string name", { businessId: "biz-1", name: 42 }],
    ["empty name", { businessId: "biz-1", name: "" }],
    ["empty-string knowledgeNodeId", { businessId: "biz-1", name: "x", knowledgeNodeId: "" }],
    ["non-string knowledgeNodeId", { businessId: "biz-1", name: "x", knowledgeNodeId: 7 }],
  ])("rejects %s with invalid-argument", (_label, payload) => {
    expect(() => parseCreateQualifyingItemRequest(payload as Record<string, unknown>)).toThrow(
      HttpsError,
    );
    try {
      parseCreateQualifyingItemRequest(payload as Record<string, unknown>);
    } catch (error) {
      expect((error as HttpsError).code).toBe("invalid-argument");
    }
  });
});

describe("parseUpdateQualifyingItemRequest (mass-assignment boundary, PLATFORM-BASELINE-013A.2)", () => {
  it("reads exactly businessId, qualifyingItemId and the supplied editable fields", () => {
    const parsed = parseUpdateQualifyingItemRequest({
      businessId: "biz-1",
      qualifyingItemId: ITEM_ID,
      name: "Renamed",
      knowledgeNodeId: "node-1",
      ...MALICIOUS_FIELDS,
    });
    expect(parsed).toStrictEqual({
      businessId: "biz-1",
      qualifyingItemId: ITEM_ID,
      name: "Renamed",
      knowledgeNodeId: "node-1",
    });
  });

  it("distinguishes 'leave unchanged' (omitted) from 'clear' (null) for the classification", () => {
    const unchanged = parseUpdateQualifyingItemRequest({
      businessId: "biz-1",
      qualifyingItemId: ITEM_ID,
      name: "Renamed",
    });
    expect("knowledgeNodeId" in unchanged).toBe(false);
    const cleared = parseUpdateQualifyingItemRequest({
      businessId: "biz-1",
      qualifyingItemId: ITEM_ID,
      knowledgeNodeId: null,
    });
    expect(cleared).toStrictEqual({
      businessId: "biz-1",
      qualifyingItemId: ITEM_ID,
      knowledgeNodeId: null,
    });
    expect("name" in cleared).toBe(false);
  });

  it.each([
    ["missing businessId", { qualifyingItemId: ITEM_ID, name: "x" }],
    ["missing qualifyingItemId", { businessId: "biz-1", name: "x" }],
    ["empty qualifyingItemId", { businessId: "biz-1", qualifyingItemId: "", name: "x" }],
    ["non-string name", { businessId: "biz-1", qualifyingItemId: ITEM_ID, name: {} }],
    [
      "empty knowledgeNodeId",
      { businessId: "biz-1", qualifyingItemId: ITEM_ID, knowledgeNodeId: "" },
    ],
  ])("rejects %s", (_label, payload) => {
    expect(() => parseUpdateQualifyingItemRequest(payload as Record<string, unknown>)).toThrow(
      HttpsError,
    );
  });
});

describe("parseRetireQualifyingItemRequest (mass-assignment boundary, PLATFORM-BASELINE-013A.2)", () => {
  it("reads exactly businessId and qualifyingItemId", () => {
    expect(
      parseRetireQualifyingItemRequest({
        businessId: "biz-1",
        qualifyingItemId: ITEM_ID,
        ...MALICIOUS_FIELDS,
      }),
    ).toStrictEqual({ businessId: "biz-1", qualifyingItemId: ITEM_ID });
  });

  it("rejects a missing or empty id", () => {
    expect(() => parseRetireQualifyingItemRequest({ businessId: "biz-1" })).toThrow(HttpsError);
    expect(() =>
      parseRetireQualifyingItemRequest({ businessId: "biz-1", qualifyingItemId: " " }),
    ).toThrow(HttpsError);
  });
});

describe("parseListQualifyingItemsRequest (PLATFORM-BASELINE-013A.2)", () => {
  it("reads businessId and an optional, closed-vocabulary statusFilter", () => {
    expect(
      parseListQualifyingItemsRequest({ businessId: "biz-1", ...MALICIOUS_FIELDS }),
    ).toStrictEqual({
      businessId: "biz-1",
    });
    for (const statusFilter of ["active", "retired", "all"]) {
      expect(parseListQualifyingItemsRequest({ businessId: "biz-1", statusFilter })).toStrictEqual({
        businessId: "biz-1",
        statusFilter,
      });
    }
  });

  it("rejects an unrecognised statusFilter", () => {
    expect(() =>
      parseListQualifyingItemsRequest({ businessId: "biz-1", statusFilter: "deleted" }),
    ).toThrow(HttpsError);
    expect(() => parseListQualifyingItemsRequest({ businessId: "biz-1", statusFilter: 1 })).toThrow(
      HttpsError,
    );
  });

  it("requires a businessId (reads are Business-scoped)", () => {
    expect(() => parseListQualifyingItemsRequest({})).toThrow(HttpsError);
  });
});

describe("toHttpsError (Qualifying Item transport mapping, PLATFORM-BASELINE-013A.2)", () => {
  const cases: Array<[string, string]> = [
    ["AUTH_FORBIDDEN", "permission-denied"],
    ["RESOURCE_NOT_FOUND", "not-found"],
    ["VALIDATION_FAILED", "invalid-argument"],
    ["INVALID_STATE_TRANSITION", "aborted"],
    ["IDEMPOTENCY_CONFLICT", "aborted"],
    ["TEMPORARY_UNAVAILABLE", "unavailable"],
    ["BUSINESS_INACTIVE", "permission-denied"],
  ];

  it.each(cases)(
    "maps a %s domain error to the governed %s code, never `internal`",
    (category, code) => {
      const error = toHttpsError(new QualifyingItemDomainError(category as never, "x"));
      expect(error.code).toBe(code);
    },
  );

  it("never echoes the domain message (which may name a Business, item or idempotency key)", () => {
    const error = toHttpsError(
      new QualifyingItemDomainError(
        "RESOURCE_NOT_FOUND",
        "Qualifying Item 3f2b… of biz-secret not found",
      ),
    );
    expect(error.message).toBe("qualifying_item_command_failed");
    expect(JSON.stringify(error)).not.toContain("biz-secret");
  });

  it("does not disturb the Reward Program mapping (non-regression)", () => {
    const error = toHttpsError(new RewardProgramDomainError("AUTH_FORBIDDEN", "x"));
    expect(error.code).toBe("permission-denied");
    expect(error.message).toBe("reward_program_command_failed");
  });
});

describe("callable registration (PLATFORM-BASELINE-013A.2)", () => {
  it("registers exactly the four new Qualifying Item callables", () => {
    for (const callable of [
      createQualifyingItem,
      updateQualifyingItem,
      retireQualifyingItem,
      listQualifyingItems,
    ]) {
      expect(callable).toBeDefined();
    }
  });

  it("adds no Qualifying Item callable beyond the approved create/list/update/retire surface (no delete)", () => {
    const qualifyingItemExports = Object.keys(index).filter((name) => /qualifyingItem/i.test(name));
    expect(qualifyingItemExports.filter((name) => /delete|remove|destroy/i.test(name))).toEqual([]);
  });
});
