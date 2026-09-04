import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { bootstrapPlatformAdministrator } from "./bootstrapPlatformAdministrator";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../repositories/platformAdministratorRepository";
import { PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION } from "../repositories/platformAdministrationAuditRepository";
import { PlatformAdministrationDomainError } from "../models/platformAdministrationErrors";

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "bootstrapPlatformAdministratorEmulatorTest",
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
  for (const collection of [
    PLATFORM_ADMINISTRATORS_COLLECTION,
    PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION,
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("bootstrapPlatformAdministrator", () => {
  it("creates the first administrator, active, with an audit record", async () => {
    const result = await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_founder_editor",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder-console-2026-09-03",
      correlationId: "corr-bootstrap-1",
      now,
    });

    expect(result.status).toBe("active");
    expect(result.roles).toEqual(["knowledge_editor"]);
    expect(result.invitedBy).toBe("operator:founder-console-2026-09-03");

    const adminDoc = await db
      .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
      .doc("user_founder_editor")
      .get();
    expect(adminDoc.exists).toBe(true);

    const auditSnapshot = await db
      .collection(PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION)
      .where("targetId", "==", "user_founder_editor")
      .get();
    expect(auditSnapshot.docs).toHaveLength(1);
    expect(auditSnapshot.docs[0]?.data()["actionType"]).toBe("platform_administrator_bootstrapped");
    expect(auditSnapshot.docs[0]?.data()["outcome"]).toBe("created");
  });

  it("is idempotent/retry-safe: calling again with the same target and roles does not create a second administrator document", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_retry",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-1",
      now,
    });
    const second = await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_retry",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-2",
      now,
    });

    expect(second.status).toBe("active");
    const adminSnapshot = await db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).get();
    expect(adminSnapshot.docs).toHaveLength(1);

    // Each invocation is still its own auditable event, even when idempotent.
    const auditSnapshot = await db
      .collection(PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION)
      .where("targetId", "==", "user_retry")
      .get();
    expect(auditSnapshot.docs).toHaveLength(2);
  });

  it("fails closed rather than silently re-elevating a since-suspended administrator", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_was_suspended",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-1",
      now,
    });
    await db
      .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
      .doc("user_was_suspended")
      .set({ status: "suspended", suspendedAt: now }, { merge: true });

    await expect(
      bootstrapPlatformAdministrator(db, {
        targetUserId: "user_was_suspended",
        roles: ["knowledge_editor"],
        operatorReference: "operator:founder",
        correlationId: "corr-2",
        now,
      }),
    ).rejects.toThrow(PlatformAdministrationDomainError);
  });

  it("never elevates an arbitrary user implicitly — bootstrap only ever affects the explicitly named targetUserId", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_target",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-1",
      now,
    });

    const otherDoc = await db
      .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
      .doc("user_bystander")
      .get();
    expect(otherDoc.exists).toBe(false);
  });

  it("rejects an unapproved TRD18 role (e.g. platform_super_administrator) even from the bootstrap path", async () => {
    await expect(
      bootstrapPlatformAdministrator(db, {
        targetUserId: "user_would_be_super",
        roles: ["platform_super_administrator"],
        operatorReference: "operator:founder",
        correlationId: "corr-1",
        now,
      }),
    ).rejects.toThrow(PlatformAdministrationDomainError);

    const doc = await db
      .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
      .doc("user_would_be_super")
      .get();
    expect(doc.exists).toBe(false);
  });
});
