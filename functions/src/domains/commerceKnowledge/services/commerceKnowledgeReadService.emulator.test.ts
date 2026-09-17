import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  listBusinessCategories,
  listBusinessTypesForCategory,
  listRewardProgramCategories,
  listQualifyingNodesForCategory,
  listQualifyingNodesForBusinessType,
  searchQualifyingNodes,
  resolveKnowledgeNodeLabels,
} from "./commerceKnowledgeReadService";
import {
  createKnowledgeNodePersisted,
  retireKnowledgeNodePersisted,
  transitionKnowledgeNodeStatusPersisted,
} from "../repositories/knowledgeNodeRepository";
import {
  createKnowledgeTranslationPersisted,
  transitionKnowledgeTranslationStatusPersisted,
} from "../repositories/knowledgeTranslationRepository";

/**
 * `ENG-P3-002A` — Commerce Knowledge Category/Business-Type read transport
 * emulator tests (design §13/§14/§17, task Phase AC "COMMERCE KNOWLEDGE"
 * items 6-10).
 */

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "commerceKnowledgeReadServiceEmulatorTest",
);
const db = getFirestore(app);

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite.",
    );
  }
});

beforeEach(async () => {
  for (const collection of ["knowledgeNodes", "knowledgeTranslations"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

const NOW = new Date("2026-08-21T00:00:00.000Z");

async function activateNode(id: string) {
  await transitionKnowledgeNodeStatusPersisted(db, id, "in_review", { updatedAt: NOW });
  await transitionKnowledgeNodeStatusPersisted(db, id, "active", { updatedAt: NOW });
}

async function seedIndustry(id: string) {
  await createKnowledgeNodePersisted(db, {
    id,
    nodeType: "industry",
    parentId: null,
    canonicalName: "Test Industry",
    slug: "test-industry",
    createdAt: NOW,
  });
}

async function seedCategory(id: string, parentId: string, canonicalName = "Food & Beverage") {
  await createKnowledgeNodePersisted(db, {
    id,
    nodeType: "business_category",
    parentId,
    canonicalName,
    slug: id,
    createdAt: NOW,
  });
}

async function seedType(id: string, parentId: string, canonicalName = "Restaurant") {
  await createKnowledgeNodePersisted(db, {
    id,
    nodeType: "business_type",
    parentId,
    canonicalName,
    slug: id,
    createdAt: NOW,
  });
}

/** `PLATFORM-BASELINE-008` fixtures: reward_program_category -> {standard_product, standard_service}. */
async function seedRewardProgramCategory(id: string, parentId: string, canonicalName = "Haircuts") {
  await createKnowledgeNodePersisted(db, {
    id,
    nodeType: "reward_program_category",
    parentId,
    canonicalName,
    slug: id,
    createdAt: NOW,
  });
}

async function seedStandardProduct(id: string, parentId: string, canonicalName = "Shampoo") {
  await createKnowledgeNodePersisted(db, {
    id,
    nodeType: "standard_product",
    parentId,
    canonicalName,
    slug: id,
    createdAt: NOW,
  });
}

async function seedStandardService(id: string, parentId: string, canonicalName = "Haircut") {
  await createKnowledgeNodePersisted(db, {
    id,
    nodeType: "standard_service",
    parentId,
    canonicalName,
    slug: id,
    createdAt: NOW,
  });
}

/** Full ancestor chain a `standard_product`/`standard_service`/`reward_program_category` fixture needs. */
async function seedRewardProgramHierarchy() {
  await seedIndustry("ind_1");
  await seedCategory("cat_beauty", "ind_1", "Beauty & Personal Care");
  await activateNode("cat_beauty");
  await seedType("type_salon", "cat_beauty", "Salon");
  await activateNode("type_salon");
}

describe("listBusinessCategories", () => {
  it("6. lists active Business Categories", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1");
    await activateNode("cat_food");

    const result = await listBusinessCategories(db);
    expect(result.map((c) => c.id)).toContain("cat_food");
  });

  it("7. inactive categories excluded (draft, in_review, retired, archived)", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_draft", "ind_1", "Draft Category");
    // left in "draft" — never activated

    const result = await listBusinessCategories(db);
    expect(result.map((c) => c.id)).not.toContain("cat_draft");
  });

  it("returns the bounded option DTO — no schemaVersion/status/audit metadata", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1");
    await activateNode("cat_food");

    const result = await listBusinessCategories(db);
    const dto = result[0] as unknown as Record<string, unknown>;
    expect(dto["schemaVersion"]).toBeUndefined();
    expect(dto["status"]).toBeUndefined();
    expect(dto["version"]).toBeUndefined();
    expect(dto["replacementNodeId"]).toBeUndefined();
  });

  it("10. missing FR translation uses EN fallback", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1", "Food & Beverage");
    await activateNode("cat_food");
    const translationId = "knowledge_node_cat_food_en";
    await createKnowledgeTranslationPersisted(db, {
      entityType: "knowledge_node",
      entityId: "cat_food",
      languageCode: "en",
      displayName: "Food & Beverage (EN)",
      createdAt: NOW,
    });
    await transitionKnowledgeTranslationStatusPersisted(db, translationId, "reviewed", {
      updatedAt: NOW,
    });
    await transitionKnowledgeTranslationStatusPersisted(db, translationId, "published", {
      updatedAt: NOW,
    });
    // No FR translation seeded at all.

    const result = await listBusinessCategories(db, "fr");
    const dto = result.find((c) => c.id === "cat_food");
    expect(dto?.displayLabel).toBe("Food & Beverage (EN)");
  });

  it("falls back to canonicalName when no published translation exists in any language", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1", "Food & Beverage (canonical)");
    await activateNode("cat_food");

    const result = await listBusinessCategories(db, "en");
    const dto = result.find((c) => c.id === "cat_food");
    expect(dto?.displayLabel).toBe("Food & Beverage (canonical)");
  });

  it("a draft (unpublished) translation does not satisfy the requested language — falls back to EN/canonical", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1", "Canonical Label");
    await activateNode("cat_food");
    await createKnowledgeTranslationPersisted(db, {
      entityType: "knowledge_node",
      entityId: "cat_food",
      languageCode: "en",
      displayName: "Unpublished EN Label",
      createdAt: NOW,
    });
    // status left "draft" — never transitioned to "published"

    const result = await listBusinessCategories(db, "en");
    const dto = result.find((c) => c.id === "cat_food");
    expect(dto?.displayLabel).toBe("Canonical Label");
  });
});

describe("listBusinessTypesForCategory", () => {
  it("8. Business Types scoped to the selected Category", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1");
    await activateNode("cat_food");
    await seedCategory("cat_retail", "ind_1", "Retail");
    await activateNode("cat_retail");
    await seedType("type_restaurant", "cat_food", "Restaurant");
    await activateNode("type_restaurant");
    await seedType("type_shop", "cat_retail", "Shop");
    await activateNode("type_shop");

    const result = await listBusinessTypesForCategory(db, "cat_food");
    expect(result.map((t) => t.id)).toEqual(["type_restaurant"]);
    expect(result[0]?.parentId).toBe("cat_food");
  });

  it("9. empty Business-Type list is valid for a Category with none", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_no_types", "ind_1", "Category With No Types");
    await activateNode("cat_no_types");

    const result = await listBusinessTypesForCategory(db, "cat_no_types");
    expect(result).toEqual([]);
  });

  it("rejects an unknown categoryId", async () => {
    await expect(listBusinessTypesForCategory(db, "cat_does_not_exist")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("rejects a categoryId that resolves but is not active (e.g. still draft)", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_draft_only", "ind_1", "Draft Only");
    // never activated

    await expect(listBusinessTypesForCategory(db, "cat_draft_only")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("rejects a categoryId that resolves to a business_type, not a business_category", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1");
    await activateNode("cat_food");
    await seedType("type_restaurant", "cat_food");
    await activateNode("type_restaurant");

    await expect(listBusinessTypesForCategory(db, "type_restaurant")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("excludes an inactive Business Type under an active Category", async () => {
    await seedIndustry("ind_1");
    await seedCategory("cat_food", "ind_1");
    await activateNode("cat_food");
    await seedType("type_draft", "cat_food", "Draft Type");
    // never activated

    const result = await listBusinessTypesForCategory(db, "cat_food");
    expect(result).toEqual([]);
  });
});

/**
 * `PLATFORM-BASELINE-008` — Reward Program create-form category selector
 * read transport. Mirrors `listBusinessCategories`'s own test coverage
 * exactly, one node type over.
 */
describe("listRewardProgramCategories", () => {
  it("lists active Reward Program categories", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");

    const result = await listRewardProgramCategories(db);
    expect(result.map((c) => c.id)).toContain("rpc_haircuts");
    expect(result.find((c) => c.id === "rpc_haircuts")?.nodeType).toBe("reward_program_category");
  });

  it("excludes an inactive Reward Program category (draft, in_review, retired, archived)", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_draft", "type_salon", "Draft Category");
    // left in "draft" — never activated

    const result = await listRewardProgramCategories(db);
    expect(result.map((c) => c.id)).not.toContain("rpc_draft");
  });

  it("an empty result is a normal, supported outcome, never an error", async () => {
    const result = await listRewardProgramCategories(db);
    expect(result).toEqual([]);
  });
});

/**
 * `PLATFORM-BASELINE-008` — Reward Program qualifying-node selector read
 * transport (`listQualifyingNodesForCategory`/`resolveKnowledgeNodeLabels`).
 * Mirrors `listBusinessTypesForCategory`'s own test coverage one level
 * lower in the hierarchy, plus the additional `resolveKnowledgeNodeLabels`
 * hydration read `listBusinessTypesForCategory` has no analogue for.
 */
describe("listQualifyingNodesForCategory", () => {
  it("lists active standard_product/standard_service nodes scoped to the selected Reward Program category", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedRewardProgramCategory("rpc_other", "type_salon", "Other");
    await activateNode("rpc_other");
    await seedStandardService("svc_haircut", "rpc_haircuts", "Haircut");
    await activateNode("svc_haircut");
    await seedStandardProduct("prod_shampoo", "rpc_haircuts", "Shampoo");
    await activateNode("prod_shampoo");
    await seedStandardProduct("prod_other_category", "rpc_other", "Unrelated product");
    await activateNode("prod_other_category");

    const result = await listQualifyingNodesForCategory(db, "rpc_haircuts");
    expect(result.map((n) => n.id).sort()).toEqual(["prod_shampoo", "svc_haircut"]);
    expect(result.every((n) => n.parentId === "rpc_haircuts")).toBe(true);
    expect(result.map((n) => n.nodeType).sort()).toEqual(["standard_product", "standard_service"]);
  });

  it("an empty candidate list for a valid, active category is a normal outcome, never an error", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_empty", "type_salon", "No products yet");
    await activateNode("rpc_empty");

    const result = await listQualifyingNodesForCategory(db, "rpc_empty");
    expect(result).toEqual([]);
  });

  it("excludes a retired standard_product/standard_service from the candidate list", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_retiring", "rpc_haircuts", "Old Haircut Style");
    await activateNode("svc_retiring");
    await seedStandardService("svc_replacement", "rpc_haircuts", "New Haircut Style");
    await activateNode("svc_replacement");
    await retireKnowledgeNodePersisted(db, "svc_retiring", {
      updatedAt: NOW,
      replacementNodeId: "svc_replacement",
    });

    const result = await listQualifyingNodesForCategory(db, "rpc_haircuts");
    expect(result.map((n) => n.id)).toEqual(["svc_replacement"]);
  });

  it("rejects an unknown categoryId", async () => {
    await expect(listQualifyingNodesForCategory(db, "rpc_does_not_exist")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("rejects a categoryId that resolves but is not active (e.g. still draft)", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_draft_only", "type_salon", "Draft Only");
    // never activated

    await expect(listQualifyingNodesForCategory(db, "rpc_draft_only")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("rejects a categoryId that resolves to a business_type, not a reward_program_category", async () => {
    await seedRewardProgramHierarchy();

    await expect(listQualifyingNodesForCategory(db, "type_salon")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });
});

describe("resolveKnowledgeNodeLabels", () => {
  it("resolves display labels for active nodes", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_haircut", "rpc_haircuts", "Haircut");
    await activateNode("svc_haircut");

    const result = await resolveKnowledgeNodeLabels(db, ["svc_haircut"]);
    expect(result).toEqual([{ id: "svc_haircut", displayLabel: "Haircut", status: "active" }]);
  });

  it("still resolves a retired node's label -- retirement never breaks an existing reference's display", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_retiring", "rpc_haircuts", "Old Haircut Style");
    await activateNode("svc_retiring");
    await seedStandardService("svc_replacement", "rpc_haircuts", "New Haircut Style");
    await activateNode("svc_replacement");
    await retireKnowledgeNodePersisted(db, "svc_retiring", {
      updatedAt: NOW,
      replacementNodeId: "svc_replacement",
    });

    const result = await resolveKnowledgeNodeLabels(db, ["svc_retiring"]);
    expect(result).toEqual([
      { id: "svc_retiring", displayLabel: "Old Haircut Style", status: "retired" },
    ]);
  });

  it("resolves a genuinely unknown id to a null label/status rather than omitting it or throwing", async () => {
    const result = await resolveKnowledgeNodeLabels(db, ["does_not_exist_at_all"]);
    expect(result).toEqual([{ id: "does_not_exist_at_all", displayLabel: null, status: null }]);
  });

  it("resolves a bounded set of mixed ids 1:1, deduplicated", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_haircut", "rpc_haircuts", "Haircut");
    await activateNode("svc_haircut");

    const result = await resolveKnowledgeNodeLabels(db, [
      "svc_haircut",
      "unknown_id",
      "svc_haircut",
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.id === "svc_haircut")?.displayLabel).toBe("Haircut");
    expect(result.find((r) => r.id === "unknown_id")).toEqual({
      id: "unknown_id",
      displayLabel: null,
      status: null,
    });
  });

  /**
   * Information-disclosure regression (independent security review
   * finding on `PLATFORM-BASELINE-008`): this endpoint requires only
   * authentication, not Commerce-Knowledge-authoring permission, so a
   * `draft`/`in_review` node -- never eligible to be referenced in the
   * first place (`isResolvableForExistingReference`) -- must not resolve
   * to its real canonical name/status for an arbitrary authenticated
   * caller. It must resolve identically to a genuinely nonexistent id.
   */
  it("never resolves a draft node's real label/status -- treated identically to a nonexistent id", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_unpublished", "rpc_haircuts", "Confidential Upcoming Service");
    // left in "draft" -- never activated, never even in_review

    const result = await resolveKnowledgeNodeLabels(db, ["svc_unpublished"]);
    expect(result).toEqual([{ id: "svc_unpublished", displayLabel: null, status: null }]);
  });

  it("never resolves an in_review node's real label/status -- treated identically to a nonexistent id", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_in_review", "rpc_haircuts", "Under Governance Review Service");
    await transitionKnowledgeNodeStatusPersisted(db, "svc_in_review", "in_review", {
      updatedAt: NOW,
    });

    const result = await resolveKnowledgeNodeLabels(db, ["svc_in_review"]);
    expect(result).toEqual([{ id: "svc_in_review", displayLabel: null, status: null }]);
  });

  it("archived nodes still resolve for display (DAP-010: never deleted, historical/audit lookup remains valid)", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_old", "rpc_haircuts", "Very Old Service");
    await activateNode("svc_old");
    await seedStandardService("svc_new", "rpc_haircuts", "Replacement Service");
    await activateNode("svc_new");
    await retireKnowledgeNodePersisted(db, "svc_old", {
      updatedAt: NOW,
      replacementNodeId: "svc_new",
    });
    await transitionKnowledgeNodeStatusPersisted(db, "svc_old", "archived", { updatedAt: NOW });

    const result = await resolveKnowledgeNodeLabels(db, ["svc_old"]);
    expect(result).toEqual([
      { id: "svc_old", displayLabel: "Very Old Service", status: "archived" },
    ]);
  });
});

/**
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`) — the qualifying-node selector's DEFAULT
 * discovery scope: a two-hop traversal from a `business_type` id, through
 * its `reward_program_category` children, down to their
 * `standard_product`/`standard_service` children. Item O of the test
 * plan: default Business-Type-scoped discovery returns the expected
 * nodes for a given business type.
 */
describe("listQualifyingNodesForBusinessType (PLATFORM-BASELINE-010B)", () => {
  it("O: lists active standard_product/standard_service nodes reachable from the given business type, across all of its reward_program_category children", async () => {
    await seedRewardProgramHierarchy(); // ind_1 -> cat_beauty -> type_salon
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedRewardProgramCategory("rpc_nails", "type_salon", "Nails");
    await activateNode("rpc_nails");
    await seedStandardService("svc_haircut", "rpc_haircuts", "Haircut");
    await activateNode("svc_haircut");
    await seedStandardProduct("prod_shampoo", "rpc_haircuts", "Shampoo");
    await activateNode("prod_shampoo");
    await seedStandardService("svc_manicure", "rpc_nails", "Manicure");
    await activateNode("svc_manicure");

    const result = await listQualifyingNodesForBusinessType(db, "type_salon");
    expect(result.map((n) => n.id).sort()).toEqual(["prod_shampoo", "svc_haircut", "svc_manicure"]);
  });

  it("does not include nodes from a sibling business type's own reward_program_category", async () => {
    await seedRewardProgramHierarchy();
    await seedType("type_barbershop", "cat_beauty", "Barbershop");
    await activateNode("type_barbershop");
    await seedRewardProgramCategory("rpc_salon_haircuts", "type_salon", "Salon Haircuts");
    await activateNode("rpc_salon_haircuts");
    await seedRewardProgramCategory("rpc_barber_shaves", "type_barbershop", "Shaves");
    await activateNode("rpc_barber_shaves");
    await seedStandardService("svc_salon_haircut", "rpc_salon_haircuts", "Salon Haircut");
    await activateNode("svc_salon_haircut");
    await seedStandardService("svc_barber_shave", "rpc_barber_shaves", "Barber Shave");
    await activateNode("svc_barber_shave");

    const result = await listQualifyingNodesForBusinessType(db, "type_salon");
    expect(result.map((n) => n.id)).toEqual(["svc_salon_haircut"]);
  });

  it("an empty result for a valid, active business type with no governed content underneath it is a normal outcome, never an error", async () => {
    await seedRewardProgramHierarchy();

    const result = await listQualifyingNodesForBusinessType(db, "type_salon");
    expect(result).toEqual([]);
  });

  it("rejects an unknown businessTypeId", async () => {
    await expect(
      listQualifyingNodesForBusinessType(db, "type_does_not_exist"),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("rejects a businessTypeId that resolves but is not active (e.g. still draft)", async () => {
    await seedRewardProgramHierarchy();
    await seedType("type_draft_only", "cat_beauty", "Draft Only Type");
    // never activated

    await expect(listQualifyingNodesForBusinessType(db, "type_draft_only")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("rejects a businessTypeId that resolves to a business_category, not a business_type", async () => {
    await seedRewardProgramHierarchy();

    await expect(listQualifyingNodesForBusinessType(db, "cat_beauty")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });
});

/**
 * `PLATFORM-BASELINE-010B` — the qualifying-node selector's broader,
 * platform-wide "escape hatch": no `parentId`/Business-Type restriction
 * at all, a case-insensitive substring match on the resolved display
 * label. Item P of the test plan: the broader search/discovery function
 * can find an eligible canonical node outside the default Business-Type
 * scope.
 */
describe("searchQualifyingNodes (PLATFORM-BASELINE-010B)", () => {
  it("P: finds an eligible node OUTSIDE a given business type's default discovery scope, by a case-insensitive substring of its label", async () => {
    await seedRewardProgramHierarchy(); // type_salon
    await seedType("type_car_wash", "cat_beauty", "Car Wash"); // an unrelated business type
    await activateNode("type_car_wash");
    await seedRewardProgramCategory("rpc_car_services", "type_car_wash", "Car Services");
    await activateNode("rpc_car_services");
    await seedStandardService("svc_sedan_wash", "rpc_car_services", "Sedan Car Wash");
    await activateNode("svc_sedan_wash");

    // Not reachable via type_salon's default discovery scope at all.
    const defaultScope = await listQualifyingNodesForBusinessType(db, "type_salon");
    expect(defaultScope.map((n) => n.id)).not.toContain("svc_sedan_wash");

    // But findable platform-wide by typed name, case-insensitively.
    const found = await searchQualifyingNodes(db, "sedan");
    expect(found.map((n) => n.id)).toEqual(["svc_sedan_wash"]);

    const foundMixedCase = await searchQualifyingNodes(db, "SEDAN car");
    expect(foundMixedCase.map((n) => n.id)).toEqual(["svc_sedan_wash"]);
  });

  it("excludes a retired/draft/in_review node from search results", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_retired", "rpc_haircuts", "Retired Haircut Style");
    await activateNode("svc_retired");
    await seedStandardService("svc_replacement", "rpc_haircuts", "Replacement Haircut Style");
    await activateNode("svc_replacement");
    await retireKnowledgeNodePersisted(db, "svc_retired", {
      updatedAt: NOW,
      replacementNodeId: "svc_replacement",
    });
    await seedStandardService("svc_draft", "rpc_haircuts", "Draft Haircut Style");
    // never activated

    const result = await searchQualifyingNodes(db, "haircut style");
    expect(result.map((n) => n.id)).toEqual(["svc_replacement"]);
  });

  it("an empty searchText returns every active qualifying node platform-wide -- no filter, not an error", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_haircut", "rpc_haircuts", "Haircut");
    await activateNode("svc_haircut");
    await seedStandardProduct("prod_shampoo", "rpc_haircuts", "Shampoo");
    await activateNode("prod_shampoo");

    const result = await searchQualifyingNodes(db, "");
    expect(result.map((n) => n.id).sort()).toEqual(["prod_shampoo", "svc_haircut"]);
  });

  it("a search with no matches returns an empty array, never an error", async () => {
    await seedRewardProgramHierarchy();
    await seedRewardProgramCategory("rpc_haircuts", "type_salon", "Haircuts");
    await activateNode("rpc_haircuts");
    await seedStandardService("svc_haircut", "rpc_haircuts", "Haircut");
    await activateNode("svc_haircut");

    const result = await searchQualifyingNodes(db, "nonexistent-search-term-xyz");
    expect(result).toEqual([]);
  });
});
