import { describe, expect, it } from "vitest";
import { validateSeedManifest } from "./seedManifest";
import { BURUNDI_PILOT_SEED_MANIFEST } from "./burundiPilotSeedManifest";

describe("BURUNDI_PILOT_SEED_MANIFEST", () => {
  it("passes referential-integrity validation", () => {
    expect(() => validateSeedManifest(BURUNDI_PILOT_SEED_MANIFEST)).not.toThrow();
  });

  it("contains exactly the governed 6 industries, 14 business categories, 7 business types", () => {
    const byType = new Map<string, number>();
    for (const node of BURUNDI_PILOT_SEED_MANIFEST.nodes) {
      byType.set(node.nodeType, (byType.get(node.nodeType) ?? 0) + 1);
    }
    expect(byType.get("industry")).toBe(6);
    expect(byType.get("business_category")).toBe(14);
    expect(byType.get("business_type")).toBe(7);
    expect(byType.get("reward_program_category")).toBeUndefined();
    expect(byType.get("standard_product")).toBeUndefined();
    expect(byType.get("standard_service")).toBeUndefined();
  });

  it("does not seed 'Other' as a business category", () => {
    const other = BURUNDI_PILOT_SEED_MANIFEST.nodes.find((n) => n.canonicalName === "Other");
    expect(other).toBeUndefined();
  });

  it("every entry has an EN translation and a sourceRef, no fr key populated", () => {
    for (const node of BURUNDI_PILOT_SEED_MANIFEST.nodes) {
      expect(node.translations.en.length).toBeGreaterThan(0);
      expect(node.sourceRef.length).toBeGreaterThan(0);
      expect(node.translations.fr).toBeUndefined();
    }
  });

  it("every business_type entry is parented under cat_salon (the only governed chain)", () => {
    const businessTypes = BURUNDI_PILOT_SEED_MANIFEST.nodes.filter(
      (n) => n.nodeType === "business_type",
    );
    for (const type of businessTypes) {
      expect(type.parentId).toBe("cat_salon");
    }
  });

  it("has no duplicate ids", () => {
    const ids = BURUNDI_PILOT_SEED_MANIFEST.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
