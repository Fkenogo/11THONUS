import { describe, expect, it } from "vitest";
import { validateSeedManifest, type SeedNodeManifestEntry } from "./seedManifest";

function entry(overrides: Partial<SeedNodeManifestEntry>): SeedNodeManifestEntry {
  return {
    id: "n1",
    nodeType: "industry",
    parentId: null,
    canonicalName: "Food & Beverage",
    slug: "food-beverage",
    translations: { en: "Food & Beverage" },
    sourceRef: "CKS Part IV",
    ...overrides,
  };
}

describe("validateSeedManifest", () => {
  it("accepts a well-formed two-level manifest", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [
          entry({ id: "ind_food" }),
          entry({
            id: "cat_coffee",
            nodeType: "business_category",
            parentId: "ind_food",
            canonicalName: "Coffee Shop",
            slug: "coffee-shop",
            translations: { en: "Coffee Shop" },
            sourceRef: "CKS Part V",
          }),
        ],
      }),
    ).not.toThrow();
  });

  it("rejects a duplicate id", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [entry({ id: "dup" }), entry({ id: "dup" })],
      }),
    ).toThrow(/duplicate manifest id/);
  });

  it("rejects a dangling parentId", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [
          entry({
            id: "cat_orphan",
            nodeType: "business_category",
            parentId: "does_not_exist",
          }),
        ],
      }),
    ).toThrow(/dangling parentId/);
  });

  it("rejects a duplicate slug within the same nodeType", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [entry({ id: "n1", slug: "same" }), entry({ id: "n2", slug: "same" })],
      }),
    ).toThrow(/duplicate slug/);
  });

  it("allows the same slug across two different nodeTypes", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [
          entry({ id: "ind_retail", slug: "retail" }),
          entry({
            id: "cat_retail",
            nodeType: "business_category",
            parentId: "ind_retail",
            slug: "retail",
          }),
        ],
      }),
    ).not.toThrow();
  });

  it("rejects a mismatched parent nodeType", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [
          entry({ id: "ind_food" }),
          entry({
            id: "type_wrong",
            nodeType: "business_type",
            parentId: "ind_food",
          }),
        ],
      }),
    ).toThrow();
  });

  it("rejects a manifest-internal cycle", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [
          entry({ id: "a", nodeType: "business_category", parentId: "b" }),
          entry({ id: "b", nodeType: "business_type", parentId: "a" }),
        ],
      }),
    ).toThrow();
  });

  it("rejects a missing sourceRef", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [entry({ id: "n1", sourceRef: "" })],
      }),
    ).toThrow(/sourceRef/);
  });

  it("rejects a missing EN translation", () => {
    expect(() =>
      validateSeedManifest({
        manifestVersion: "test-v1",
        nodes: [entry({ id: "n1", translations: { en: "" } })],
      }),
    ).toThrow(/EN translation/);
  });
});
