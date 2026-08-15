import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getBusinessById } from "./businessRepository";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "businessRepositoryEmulatorTest");
const db = getFirestore(app);

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
  const snapshot = await db.collection("businesses").get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("getBusinessById", () => {
  it("returns found for an active business", async () => {
    await db.collection("businesses").doc("biz-1").set({ status: "active" });

    const result = await getBusinessById(db, "biz-1");

    expect(result).toEqual({ kind: "found", business: { id: "biz-1", status: "active" } });
  });

  it.each([
    "draft",
    "pending_verification",
    "trial",
    "suspended",
    "expired",
    "closed",
    "archived",
  ] as const)(
    "returns found (still resolved, gate applied by the evaluator) for status=%s",
    async (status) => {
      await db.collection("businesses").doc("biz-2").set({ status });

      const result = await getBusinessById(db, "biz-2");

      expect(result).toEqual({ kind: "found", business: { id: "biz-2", status } });
    },
  );

  it("returns not_found for a missing business document", async () => {
    const result = await getBusinessById(db, "does-not-exist");
    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns malformed for a document with an unrecognized status", async () => {
    await db.collection("businesses").doc("biz-bad").set({ status: "not-a-real-status" });

    const result = await getBusinessById(db, "biz-bad");

    expect(result).toEqual({ kind: "malformed" });
  });

  it("returns malformed for a document missing the status field entirely", async () => {
    await db.collection("businesses").doc("biz-empty").set({ displayName: "No status field" });

    const result = await getBusinessById(db, "biz-empty");

    expect(result).toEqual({ kind: "malformed" });
  });

  it("performs no write to the businesses collection", async () => {
    await db.collection("businesses").doc("biz-3").set({ status: "active" });
    const before = (await db.collection("businesses").get()).size;

    await getBusinessById(db, "biz-3");

    const after = (await db.collection("businesses").get()).size;
    expect(after).toBe(before);
  });
});
