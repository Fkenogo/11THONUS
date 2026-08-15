import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getBusinessMembershipByUserAndBusiness } from "./businessMembershipRepository";

// Real Firestore round trip against the Firebase Emulator Suite.
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "businessMembershipRepositoryEmulatorTest",
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
  const snapshot = await db.collection("businessMemberships").get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("getBusinessMembershipByUserAndBusiness", () => {
  it("resolves the membership matching (userId, businessId), including overrides:[] (persistence-mapping deferred to 004D)", async () => {
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
    });

    const result = await getBusinessMembershipByUserAndBusiness(db, "user-1", "biz-a");

    expect(result).toEqual({
      kind: "found",
      membership: {
        id: "mem-1",
        userId: "user-1",
        businessId: "biz-a",
        role: "manager",
        status: "active",
        overrides: [],
      },
    });
  });

  it("returns not_found when no membership exists for the pair", async () => {
    const result = await getBusinessMembershipByUserAndBusiness(db, "user-x", "biz-x");
    expect(result).toEqual({ kind: "not_found" });
  });

  it("does not return a membership belonging to a different business for the same user (cross-business isolation, §5.6)", async () => {
    await db.collection("businessMemberships").doc("mem-a").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });

    const result = await getBusinessMembershipByUserAndBusiness(db, "user-1", "biz-b");

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns malformed for an unrecognized role value", async () => {
    await db.collection("businessMemberships").doc("mem-bad-role").set({
      userId: "user-2",
      businessId: "biz-a",
      role: "superadmin",
      status: "active",
      permissions: [],
    });

    const result = await getBusinessMembershipByUserAndBusiness(db, "user-2", "biz-a");

    expect(result).toEqual({ kind: "malformed" });
  });

  it("returns malformed for a document with a non-empty persisted permissions array (unserialized override state, Codex review PR #107)", async () => {
    await db
      .collection("businessMemberships")
      .doc("mem-with-permissions")
      .set({
        userId: "user-2b",
        businessId: "biz-a",
        role: "manager",
        status: "active",
        permissions: ["transaction.reverse"],
      });

    const result = await getBusinessMembershipByUserAndBusiness(db, "user-2b", "biz-a");

    expect(result).toEqual({ kind: "malformed" });
  });

  it("returns malformed for a document with a non-blank permissionSetId (unresolved reference, Codex review pass 4, PR #107)", async () => {
    await db.collection("businessMemberships").doc("mem-with-permission-set").set({
      userId: "user-2c",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
      permissionSetId: "set-123",
    });

    const result = await getBusinessMembershipByUserAndBusiness(db, "user-2c", "biz-a");

    expect(result).toEqual({ kind: "malformed" });
  });

  it("returns malformed for an unrecognized status value", async () => {
    await db.collection("businessMemberships").doc("mem-bad-status").set({
      userId: "user-3",
      businessId: "biz-a",
      role: "staff",
      status: "pending-review",
      permissions: [],
    });

    const result = await getBusinessMembershipByUserAndBusiness(db, "user-3", "biz-a");

    expect(result).toEqual({ kind: "malformed" });
  });

  it("returns malformed when more than one membership document matches the same (userId, businessId) pair (contradictory stored data)", async () => {
    await db.collection("businessMemberships").doc("dup-1").set({
      userId: "user-4",
      businessId: "biz-a",
      role: "staff",
      status: "active",
      permissions: [],
    });
    await db.collection("businessMemberships").doc("dup-2").set({
      userId: "user-4",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
    });

    const result = await getBusinessMembershipByUserAndBusiness(db, "user-4", "biz-a");

    expect(result).toEqual({ kind: "malformed" });
  });

  it("performs no write to the businessMemberships collection", async () => {
    await db.collection("businessMemberships").doc("mem-5").set({
      userId: "user-5",
      businessId: "biz-a",
      role: "staff",
      status: "active",
      permissions: [],
    });
    const before = (await db.collection("businessMemberships").get()).size;

    await getBusinessMembershipByUserAndBusiness(db, "user-5", "biz-a");

    const after = (await db.collection("businessMemberships").get()).size;
    expect(after).toBe(before);
  });
});
