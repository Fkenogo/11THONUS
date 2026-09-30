/**
 * WP-COM-01 — Commercial authority seam against the real Firestore Emulator.
 *
 * Proves the seam reads a genuine `platformAdministrators/{userId}` document
 * written in the repository's own persisted shape (no stub reader) and applies
 * the `FD-BUS-ACT-001` gate: active record + verified MFA, one denial reason.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../../platformAdministration/repositories/platformAdministratorRepository";
import {
  authorizeCommercialAdministrator,
  firestorePlatformAdministratorRecordReader,
} from "./commercialAuthority";

const app = initializeApp({ projectId: "demo-11thonus" }, "commercialAuthorityEmulatorTest");
const db = getFirestore(app);
const reader = firestorePlatformAdministratorRecordReader(db);

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

async function seedAdministrator(userId: string, overrides: Record<string, unknown> = {}) {
  const now = new Date();
  await db
    .collection(PLATFORM_ADMINISTRATORS_COLLECTION)
    .doc(userId)
    .set({
      roles: ["knowledge_editor"],
      status: "active",
      mfaRequired: true,
      invitedBy: "operator",
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      ...overrides,
    });
}

describe("authorizeCommercialAdministrator (Firestore Emulator)", () => {
  it("authorises the active administrator with verified MFA", async () => {
    await seedAdministrator("founder-uid");
    await expect(
      authorizeCommercialAdministrator(reader, {
        adminUserId: "founder-uid",
        verifiedMfaSatisfied: true,
      }),
    ).resolves.toEqual({
      authorized: true,
      actor: { type: "platform_administrator", id: "founder-uid" },
    });
  });

  it("denies without verified MFA, for a suspended record, for an unknown user, and for a Business-side identity", async () => {
    await seedAdministrator("founder-uid");
    await seedAdministrator("suspended-uid", { status: "suspended" });
    // A Business owner/manager is not a Platform Administrator: no platformAdministrators record.
    const denied = { authorized: false, reason: "NOT_PLATFORM_ADMINISTRATOR" };
    await expect(
      authorizeCommercialAdministrator(reader, {
        adminUserId: "founder-uid",
        verifiedMfaSatisfied: false,
      }),
    ).resolves.toEqual(denied);
    await expect(
      authorizeCommercialAdministrator(reader, {
        adminUserId: "suspended-uid",
        verifiedMfaSatisfied: true,
      }),
    ).resolves.toEqual(denied);
    await expect(
      authorizeCommercialAdministrator(reader, {
        adminUserId: "unknown-uid",
        verifiedMfaSatisfied: true,
      }),
    ).resolves.toEqual(denied);
    await expect(
      authorizeCommercialAdministrator(reader, {
        adminUserId: "business-owner-uid",
        verifiedMfaSatisfied: true,
      }),
    ).resolves.toEqual(denied);
  });

  it("denies a record carrying an unrecognised role (fail closed; no role invented)", async () => {
    await seedAdministrator("odd-uid", { roles: ["platform_super_administrator"] });
    await expect(
      authorizeCommercialAdministrator(reader, {
        adminUserId: "odd-uid",
        verifiedMfaSatisfied: true,
      }),
    ).resolves.toEqual({ authorized: false, reason: "NOT_PLATFORM_ADMINISTRATOR" });
  });
});
