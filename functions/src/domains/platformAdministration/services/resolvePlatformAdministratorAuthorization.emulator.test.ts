import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resolvePlatformAdministratorAuthorization } from "./resolvePlatformAdministratorAuthorization";
import { bootstrapPlatformAdministrator } from "./bootstrapPlatformAdministrator";
import {
  PLATFORM_ADMINISTRATORS_COLLECTION,
  transitionPlatformAdministratorStatusPersisted,
} from "../repositories/platformAdministratorRepository";
import { PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION } from "../repositories/platformAdministrationAuditRepository";

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "resolvePlatformAdministratorAuthorizationEmulatorTest",
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

describe("resolvePlatformAdministratorAuthorization", () => {
  it("allows an active knowledge_editor with verified MFA to create a draft, and audits the allow", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_editor",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });

    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: "user_editor",
      permission: "knowledge.create_draft",
      verifiedMfaSatisfied: true,
      correlationId: "corr-req-1",
      now,
    });

    expect(decision).toEqual({ allowed: true });

    const auditSnapshot = await db
      .collection(PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION)
      .where("correlationId", "==", "corr-req-1")
      .get();
    expect(auditSnapshot.docs).toHaveLength(1);
    expect(auditSnapshot.docs[0]?.data()["outcome"]).toBe("allow");
  });

  it("denies and audits an unknown/arbitrary user (e.g. an ordinary Business/customer identity) — no privilege escalation", async () => {
    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: "user_ordinary_customer",
      permission: "knowledge.view",
      verifiedMfaSatisfied: true,
      correlationId: "corr-req-2",
      now,
    });

    expect(decision).toEqual({ allowed: false, reason: "NO_ADMINISTRATOR_RECORD" });

    const auditSnapshot = await db
      .collection(PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION)
      .where("correlationId", "==", "corr-req-2")
      .get();
    expect(auditSnapshot.docs[0]?.data()["outcome"]).toBe("deny");
    expect(auditSnapshot.docs[0]?.data()["reasonCode"]).toBe("NO_ADMINISTRATOR_RECORD");
  });

  it("denies a suspended administrator", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_suspended",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });
    await transitionPlatformAdministratorStatusPersisted(db, "user_suspended", "suspend", {
      updatedAt: now,
    });

    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: "user_suspended",
      permission: "knowledge.publish",
      verifiedMfaSatisfied: true,
      correlationId: "corr-req-3",
      now,
    });

    expect(decision).toEqual({ allowed: false, reason: "ADMINISTRATOR_NOT_ACTIVE" });
  });

  it("denies without verified MFA even for an otherwise-eligible active administrator, and never simulates compliance from mfaRequired alone", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_no_mfa_yet",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });

    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: "user_no_mfa_yet",
      permission: "knowledge.publish",
      verifiedMfaSatisfied: false,
      correlationId: "corr-req-4",
      now,
    });

    expect(decision).toEqual({ allowed: false, reason: "MFA_NOT_ESTABLISHED" });
  });

  it("denies a permission outside the caller's granted scope", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "user_editor_scope",
      roles: ["knowledge_editor"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });

    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: "user_editor_scope",
      permission: "knowledge.publish",
      verifiedMfaSatisfied: true,
      correlationId: "corr-req-5",
      now,
    });

    expect(decision).toEqual({ allowed: false, reason: "PERMISSION_NOT_GRANTED" });
  });
});
