import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  KNOWLEDGE_TRANSLATIONS_COLLECTION,
  createKnowledgeTranslationPersisted,
  getKnowledgeTranslationById,
  getKnowledgeTranslationByTuple,
} from "./knowledgeTranslationRepository";

// Real Firestore round trip against the Firebase Emulator Suite. Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "knowledgeTranslationRepositoryEmulatorTest",
);
const db = getFirestore(app);
const now = new Date("2026-08-21T00:00:00.000Z");

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

beforeEach(async () => {
  const snapshot = await db.collection(KNOWLEDGE_TRANSLATIONS_COLLECTION).get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("knowledgeTranslationRepository — create/read (scenario 3)", () => {
  it("creates and reads back a translation via deterministic tuple id", async () => {
    const translation = await createKnowledgeTranslationPersisted(db, {
      entityType: "knowledge_node",
      entityId: "ind_food",
      languageCode: "en",
      displayName: "Food & Beverage",
      createdAt: now,
    });

    expect(translation.id).toBe("knowledge_node_ind_food_en");

    const read = await getKnowledgeTranslationById(db, translation.id);
    expect(read?.displayName).toBe("Food & Beverage");

    const byTuple = await getKnowledgeTranslationByTuple(db, "knowledge_node", "ind_food", "en");
    expect(byTuple?.id).toBe(translation.id);
  });

  it("enforces at most one authoritative translation per (entityType, entityId, languageCode) tuple (scenario 13)", async () => {
    await createKnowledgeTranslationPersisted(db, {
      entityType: "knowledge_node",
      entityId: "ind_food",
      languageCode: "en",
      displayName: "Food & Beverage",
      createdAt: now,
    });

    await expect(
      createKnowledgeTranslationPersisted(db, {
        entityType: "knowledge_node",
        entityId: "ind_food",
        languageCode: "en",
        displayName: "Food & Beverage (duplicate attempt)",
        createdAt: now,
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("allows two different languages for the same entity (not a tuple collision)", async () => {
    await createKnowledgeTranslationPersisted(db, {
      entityType: "knowledge_node",
      entityId: "ind_food",
      languageCode: "en",
      displayName: "Food & Beverage",
      createdAt: now,
    });
    const fr = await createKnowledgeTranslationPersisted(db, {
      entityType: "knowledge_node",
      entityId: "ind_food",
      languageCode: "fr",
      displayName: "Alimentation & Boissons",
      createdAt: now,
    });
    expect(fr.id).toBe("knowledge_node_ind_food_fr");
  });

  it("malformed persisted translation document fails closed on read", async () => {
    await db.collection(KNOWLEDGE_TRANSLATIONS_COLLECTION).doc("bad_translation").set({
      entityType: "knowledge_node",
    });
    const read = await getKnowledgeTranslationById(db, "bad_translation");
    expect(read).toBeNull();
  });
});

describe("knowledgeTranslationRepository — concurrency (Review Phase M)", () => {
  it("two concurrent creates for the same (entityType, entityId, languageCode) tuple: exactly one succeeds, the other fails closed", async () => {
    const attempt = (displayName: string) =>
      createKnowledgeTranslationPersisted(db, {
        entityType: "knowledge_node",
        entityId: "ind_race",
        languageCode: "en",
        displayName,
        createdAt: now,
      });

    const results = await Promise.allSettled([attempt("Race A"), attempt("Race B")]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const stored = await getKnowledgeTranslationByTuple(db, "knowledge_node", "ind_race", "en");
    expect(stored).not.toBeNull();
    // Whichever attempt won, its content is the only content persisted —
    // never a merge/torn write of both.
    expect(["Race A", "Race B"]).toContain(stored?.displayName);
  });

  it("an unrelated tuple never collides with a concurrently-created one", async () => {
    const results = await Promise.allSettled([
      createKnowledgeTranslationPersisted(db, {
        entityType: "knowledge_node",
        entityId: "ind_race_a",
        languageCode: "en",
        displayName: "Race A",
        createdAt: now,
      }),
      createKnowledgeTranslationPersisted(db, {
        entityType: "knowledge_node",
        entityId: "ind_race_b",
        languageCode: "en",
        displayName: "Race B",
        createdAt: now,
      }),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const a = await getKnowledgeTranslationByTuple(db, "knowledge_node", "ind_race_a", "en");
    const b = await getKnowledgeTranslationByTuple(db, "knowledge_node", "ind_race_b", "en");
    expect(a?.displayName).toBe("Race A");
    expect(b?.displayName).toBe("Race B");
  });
});
