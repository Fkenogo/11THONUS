import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { discoverPlatformAdministrator } from "./discoverPlatformAdministrator";
import { bootstrapPlatformAdministrator } from "./bootstrapPlatformAdministrator";
import {
  PLATFORM_ADMINISTRATORS_COLLECTION,
  transitionPlatformAdministratorStatusPersisted,
} from "../repositories/platformAdministratorRepository";
import { PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION } from "../repositories/platformAdministrationAuditRepository";
import { PlatformAdministrationDomainError } from "../models/platformAdministrationErrors";

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "discoverPlatformAdministratorEmulatorTest",
);
const db = getFirestore(app);
const now = new Date("2026-09-04T00:00:00.000Z");

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
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("discoverPlatformAdministrator (AUTH-MFA-003A1, emulator)", () => {
  it("reports `true` for a bootstrapped, currently-active administrator", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_editor",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });

    const result = await discoverPlatformAdministrator(db, "user_editor");

    expect(result).toEqual({ isPlatformAdministrator: true });
    expect(Object.keys(result)).toEqual(["isPlatformAdministrator"]);
  });

  it("reports `false` for an authenticated identity with no administrator record (an ordinary customer identity)", async () => {
    const result = await discoverPlatformAdministrator(db, "user_ordinary_customer");

    expect(result).toEqual({ isPlatformAdministrator: false });
  });

  it("reports `false` for a suspended administrator", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_suspended",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });
    await transitionPlatformAdministratorStatusPersisted(db, "user_suspended", "suspend", {
      updatedAt: now,
    });

    expect(await discoverPlatformAdministrator(db, "user_suspended")).toEqual({
      isPlatformAdministrator: false,
    });
  });

  it("reports `false` for a removed (terminal) administrator", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_removed",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });
    await transitionPlatformAdministratorStatusPersisted(db, "user_removed", "remove", {
      updatedAt: now,
    });

    expect(await discoverPlatformAdministrator(db, "user_removed")).toEqual({
      isPlatformAdministrator: false,
    });
  });

  it("fails closed — a structurally malformed record throws instead of reporting `false`", async () => {
    await db
      .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
      .doc("user_malformed")
      .set({
        roles: ["platform_super_administrator"],
        status: "active",
        mfaRequired: true,
        invitedBy: "operator:founder",
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        schemaVersion: 1,
      });

    await expect(discoverPlatformAdministrator(db, "user_malformed")).rejects.toThrow(
      PlatformAdministrationDomainError,
    );
  });

  it("is a read-only routing read — repeated discovery writes no audit record and no identity outbox event", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_editor",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_approver",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap-2",
      now,
    });

    const auditCountBefore = (
      await db.collection(PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION).get()
    ).docs.length;
    // The shared identity outbox: the discoverable record is read via the
    // non-auditing resolution twin at the callable boundary (see
    // `authenticatedIdentityActor.emulator.test.ts`), so this domain-level
    // assertion stays green by construction and guards against any future
    // service-level side effect.
    const outboxCountBefore = (await db.collection("outboxEntries").get()).docs.length;

    await discoverPlatformAdministrator(db, "user_editor");
    await discoverPlatformAdministrator(db, "user_approver");
    await discoverPlatformAdministrator(db, "user_never_existed");

    const auditCountAfter = (
      await db.collection(PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION).get()
    ).docs.length;
    const outboxCountAfter = (await db.collection("outboxEntries").get()).docs.length;

    expect(auditCountAfter).toBe(auditCountBefore);
    expect(outboxCountAfter).toBe(outboxCountBefore);
  });
});
