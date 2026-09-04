import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  PLATFORM_ADMINISTRATORS_COLLECTION,
  createPlatformAdministratorPersisted,
  getPlatformAdministratorById,
  transitionPlatformAdministratorStatusPersisted,
} from "./platformAdministratorRepository";
import { PlatformAdministrationDomainError } from "../models/platformAdministrationErrors";

// Real Firestore round trip against the Firebase Emulator Suite. Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "platformAdministratorRepositoryEmulatorTest",
);
const db = getFirestore(app);
const now = new Date("2026-09-03T00:00:00.000Z");

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

describe("platformAdministratorRepository — create/read", () => {
  it("creates and reads back an administrator", async () => {
    await createPlatformAdministratorPersisted(db, {
      userId: "user_editor_1",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      now,
    });
    const found = await getPlatformAdministratorById(db, "user_editor_1");
    expect(found?.status).toBe("active");
    expect(found?.roles).toEqual(["knowledge_editor"]);
  });

  it("returns null for an unknown administrator", async () => {
    const found = await getPlatformAdministratorById(db, "user_unknown");
    expect(found).toBeNull();
  });

  it("is idempotent on retry with the same identity (same roles, still active)", async () => {
    const first = await createPlatformAdministratorPersisted(db, {
      userId: "user_editor_2",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      now,
    });
    const second = await createPlatformAdministratorPersisted(db, {
      userId: "user_editor_2",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      now,
    });
    expect(second).toEqual(first);

    const snapshot = await db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).get();
    expect(snapshot.docs).toHaveLength(1);
  });

  it("fails closed on retry with a different role set for the same userId", async () => {
    await createPlatformAdministratorPersisted(db, {
      userId: "user_3",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      now,
    });
    await expect(
      createPlatformAdministratorPersisted(db, {
        userId: "user_3",
        roles: ["knowledge_approver"],
        invitedBy: "operator:founder",
        now,
      }),
    ).rejects.toThrow(PlatformAdministrationDomainError);
  });

  it("fails closed on retry after the administrator was suspended", async () => {
    await createPlatformAdministratorPersisted(db, {
      userId: "user_4",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      now,
    });
    await transitionPlatformAdministratorStatusPersisted(db, "user_4", "suspend", {
      updatedAt: now,
    });
    await expect(
      createPlatformAdministratorPersisted(db, {
        userId: "user_4",
        roles: ["knowledge_editor"],
        invitedBy: "operator:founder",
        now,
      }),
    ).rejects.toThrow(PlatformAdministrationDomainError);
  });

  it("concurrency: two concurrent creates for the same userId with different role sets — exactly one succeeds, the other fails closed", async () => {
    const attempt = (roles: readonly string[]) =>
      createPlatformAdministratorPersisted(db, {
        userId: "user_concurrent",
        roles,
        invitedBy: "operator:founder",
        now,
      });

    const results = await Promise.allSettled([
      attempt(["knowledge_editor"]),
      attempt(["knowledge_approver"]),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const snapshot = await db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).get();
    expect(snapshot.docs).toHaveLength(1);
  });
});

describe("platformAdministratorRepository — lifecycle transitions", () => {
  it("suspends an active administrator, then reactivates", async () => {
    await createPlatformAdministratorPersisted(db, {
      userId: "user_5",
      roles: ["knowledge_approver"],
      invitedBy: "operator:founder",
      now,
    });
    const suspended = await transitionPlatformAdministratorStatusPersisted(
      db,
      "user_5",
      "suspend",
      {
        updatedAt: now,
      },
    );
    expect(suspended.status).toBe("suspended");
    expect(suspended.suspendedAt).toEqual(now);

    const reactivated = await transitionPlatformAdministratorStatusPersisted(
      db,
      "user_5",
      "reactivate",
      { updatedAt: now },
    );
    expect(reactivated.status).toBe("active");
  });

  it("removes an administrator and refuses any further transition", async () => {
    await createPlatformAdministratorPersisted(db, {
      userId: "user_6",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      now,
    });
    const removed = await transitionPlatformAdministratorStatusPersisted(db, "user_6", "remove", {
      updatedAt: now,
    });
    expect(removed.status).toBe("removed");

    await expect(
      transitionPlatformAdministratorStatusPersisted(db, "user_6", "reactivate", {
        updatedAt: now,
      }),
    ).rejects.toThrow(PlatformAdministrationDomainError);
  });

  it("throws RESOURCE_NOT_FOUND-shaped error for a transition on a nonexistent administrator", async () => {
    await expect(
      transitionPlatformAdministratorStatusPersisted(db, "user_ghost", "suspend", {
        updatedAt: now,
      }),
    ).rejects.toThrow(PlatformAdministrationDomainError);
  });
});
