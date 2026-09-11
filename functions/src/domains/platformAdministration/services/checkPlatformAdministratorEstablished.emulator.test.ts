import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { checkPlatformAdministratorEstablished } from "./checkPlatformAdministratorEstablished";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../repositories/platformAdministratorRepository";

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "checkPlatformAdministratorEstablishedEmulatorTest",
);
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
  const snapshot = await db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("checkPlatformAdministratorEstablished", () => {
  it("returns false when no administrator record exists", async () => {
    await expect(checkPlatformAdministratorEstablished(db)).resolves.toBe(false);
  });

  it("returns false when the only administrator record is not active", async () => {
    await db
      .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
      .doc("user-1")
      .set({
        userId: "user-1",
        roles: ["knowledge_editor"],
        status: "invited",
        invitedBy: "operator",
        approvedBy: "operator",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    await expect(checkPlatformAdministratorEstablished(db)).resolves.toBe(false);
  });

  it("returns true when at least one administrator record is active", async () => {
    await db
      .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
      .doc("user-1")
      .set({
        userId: "user-1",
        roles: ["knowledge_editor"],
        status: "active",
        invitedBy: "operator",
        approvedBy: "operator",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    await expect(checkPlatformAdministratorEstablished(db)).resolves.toBe(true);
  });

  it("never writes anything (read-only)", async () => {
    await checkPlatformAdministratorEstablished(db);
    const snapshot = await db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).get();
    expect(snapshot.empty).toBe(true);
  });
});
