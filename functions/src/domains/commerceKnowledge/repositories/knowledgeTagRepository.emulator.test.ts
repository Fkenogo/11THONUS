import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  KNOWLEDGE_TAGS_COLLECTION,
  createKnowledgeTagPersisted,
  getKnowledgeTagById,
} from "./knowledgeTagRepository";
import { CommerceKnowledgeDomainError } from "../models/commerceKnowledgeErrors";

// Real Firestore round trip against the Firebase Emulator Suite. Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp({ projectId: "demo-11thonus" }, "knowledgeTagRepositoryEmulatorTest");
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
  const snapshot = await db.collection(KNOWLEDGE_TAGS_COLLECTION).get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("knowledgeTagRepository — create/read (scenario 2)", () => {
  it("creates and reads back a tag", async () => {
    const tag = await createKnowledgeTagPersisted(db, {
      id: "tag_wifi",
      tagGroup: "business_attribute",
      canonicalName: "Wi-Fi",
      slug: "wifi",
      createdAt: now,
    });

    const read = await getKnowledgeTagById(db, tag.id);
    expect(read?.canonicalName).toBe("Wi-Fi");
    expect(read?.status).toBe("draft");
  });

  it("never persists the obsolete inline translations field", async () => {
    const tag = await createKnowledgeTagPersisted(db, {
      id: "tag_parking",
      tagGroup: "business_attribute",
      canonicalName: "Parking",
      slug: "parking",
      createdAt: now,
    });
    const raw = await db.collection(KNOWLEDGE_TAGS_COLLECTION).doc(tag.id).get();
    expect(Object.keys(raw.data() ?? {})).not.toContain("translations");
  });

  it("obsolete KnowledgeTag translations shape fails closed on read (scenario 14)", async () => {
    await db
      .collection(KNOWLEDGE_TAGS_COLLECTION)
      .doc("legacy_tag")
      .set({
        tagGroup: "business_attribute",
        canonicalName: "Legacy",
        slug: "legacy",
        status: "draft",
        searchTerms: [],
        translations: { en: "Legacy" },
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      });
    const read = await getKnowledgeTagById(db, "legacy_tag");
    expect(read).toBeNull();
  });
});

describe("knowledgeTagRepository — concurrency (Review Phase L)", () => {
  it("two concurrent creations under the same fresh id race safely — exactly one succeeds, the other fails closed", async () => {
    const attempt = (canonicalName: string) =>
      createKnowledgeTagPersisted(db, {
        id: "tag_race",
        tagGroup: "business_attribute",
        canonicalName,
        slug: "race-tag",
        createdAt: now,
      });

    const results = await Promise.allSettled([attempt("Race A"), attempt("Race B")]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });

  it("a create attempt against an id that already has a persisted tag fails closed rather than overwriting it", async () => {
    await createKnowledgeTagPersisted(db, {
      id: "tag_wifi",
      tagGroup: "business_attribute",
      canonicalName: "Wi-Fi",
      slug: "wifi",
      createdAt: now,
    });

    await expect(
      createKnowledgeTagPersisted(db, {
        id: "tag_wifi",
        tagGroup: "business_attribute",
        canonicalName: "Wi-Fi (overwrite attempt)",
        slug: "wifi-overwrite",
        createdAt: now,
      }),
    ).rejects.toBeInstanceOf(CommerceKnowledgeDomainError);

    const stored = await getKnowledgeTagById(db, "tag_wifi");
    expect(stored?.canonicalName).toBe("Wi-Fi");
  });
});
