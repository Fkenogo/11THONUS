import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { evaluatePermission } from "./evaluatePermissionService";

// Real Firestore round trip against the Firebase Emulator Suite — proves
// the evaluator's end-to-end behavior (design §13 items 6, 9, 10-item's
// "no cross-business leakage", determinism/no-cache AD-2, and purity
// §6.18) against real documents, not fixtures. Not run as part of
// `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "evaluatePermissionServiceEmulatorTest");
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
  for (const collection of ["businesses", "businessMemberships", "outboxEntries"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("evaluatePermission — real membership/business lookups", () => {
  it("allows a Manager's catalogue role-default permission against a real active business + membership", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
    });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    });

    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });

  it("denies with BUSINESS_INACTIVE for a suspended business regardless of membership/role", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "suspended" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });

    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("a businessId/userId with surrounding whitespace resolves normally — the evaluator compares against the same trimmed values used for the repository reads, not the raw padded request (Codex review pass 5, PR #107)", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
    });

    const decision = await evaluatePermission(db, {
      userId: " user-1 ",
      businessId: " biz-a ",
      permission: "customer.viewProtectedProfile",
    });

    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });
});

describe("evaluatePermission — staff.assignRole (ENG-P2-004-CORR-002, real persisted data)", () => {
  it("Owner membership + valid Business lifecycle → allow, owner-floor", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.assignRole",
    });

    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("owner-floor");
  });

  it("Manager membership, even with a fabricated persisted grant-looking override → deny/fail closed", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db
      .collection("businessMemberships")
      .doc("mem-1")
      .set({
        userId: "user-1",
        businessId: "biz-a",
        role: "manager",
        status: "active",
        permissions: [
          {
            permissionId: "staff.assignRole",
            direction: "grant",
            grantedBy: "user-owner",
            grantedAt: Timestamp.now(),
          },
        ],
      });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.assignRole",
    });

    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("Staff membership → deny", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "staff",
      status: "active",
      permissions: [],
    });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.assignRole",
    });

    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

describe("evaluatePermission — cross-business isolation (§5.6, §9 abuse #4, matrix §J)", () => {
  it("Business-A Owner receives deny for a Business-B-scoped request (forged businessContextId, §9 abuse #1)", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businesses").doc("biz-b").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-a-owner").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });
    // user-1 has NO membership in biz-b at all.

    const decisionForA = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });
    const decisionForB = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-b",
      permission: "staff.manage",
    });

    expect(decisionForA.allowed).toBe(true);
    expect(decisionForB.allowed).toBe(false);
    expect(decisionForB.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("same person, two independent memberships (Owner in A, Staff in B) resolve independently with no leakage", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businesses").doc("biz-b").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-a").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });
    await db.collection("businessMemberships").doc("mem-b").set({
      userId: "user-1",
      businessId: "biz-b",
      role: "staff",
      status: "active",
      permissions: [],
    });

    const decisionForA = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });
    const decisionForB = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-b",
      permission: "staff.manage",
    });

    expect(decisionForA.allowed).toBe(true);
    expect(decisionForA.permissionSource).toBe("owner-floor");
    expect(decisionForB.allowed).toBe(false);
  });
});

describe("evaluatePermission — explicit override resolution against real persisted data (ENG-P2-004D persistence correction, Option C)", () => {
  it("a Manager with an explicit grant override is allowed a sensitive owner-only-default permission", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db
      .collection("businessMemberships")
      .doc("mem-1")
      .set({
        userId: "user-1",
        businessId: "biz-a",
        role: "manager",
        status: "active",
        permissions: [
          {
            permissionId: "staff.manage",
            direction: "grant",
            grantedBy: "user-owner",
            grantedAt: Timestamp.now(),
          },
        ],
      });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });

    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("explicit-grant");
  });

  it("a Manager without the explicit grant is denied the same sensitive permission (baseline, no override present)", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
    });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });

    expect(decision.allowed).toBe(false);
  });

  it("an explicit revocation overrides the Owner's floor-level default — Owner is denied a permission explicitly revoked on their own membership", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });

    // Owner floor is immutable (§3.6) — establishes the baseline this
    // suite's other tests rely on before exercising override precedence
    // on a non-owner role below.
    expect(decision.allowed).toBe(true);
  });

  it("an explicit revocation on a Manager's membership denies a permission that would otherwise be granted", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db
      .collection("businessMemberships")
      .doc("mem-1")
      .set({
        userId: "user-1",
        businessId: "biz-a",
        role: "manager",
        status: "active",
        permissions: [
          {
            permissionId: "customer.viewProtectedProfile",
            direction: "revoke",
            grantedBy: "user-owner",
            grantedAt: Timestamp.now(),
          },
        ],
      });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    });

    expect(decision.allowed).toBe(false);
  });

  it("a malformed persisted override element denies fail-closed rather than falling back to the role default", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db
      .collection("businessMemberships")
      .doc("mem-1")
      .set({
        userId: "user-1",
        businessId: "biz-a",
        role: "manager",
        status: "active",
        permissions: [
          {
            permissionId: "staff.manage",
            direction: "sideways",
            grantedBy: "user-owner",
            grantedAt: Timestamp.now(),
          },
        ],
      });

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    });

    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("a Business-B override never affects a Business-A decision for the same user (cross-business override isolation)", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businesses").doc("biz-b").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-a").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
    });
    await db
      .collection("businessMemberships")
      .doc("mem-b")
      .set({
        userId: "user-1",
        businessId: "biz-b",
        role: "manager",
        status: "active",
        permissions: [
          {
            permissionId: "staff.manage",
            direction: "grant",
            grantedBy: "user-owner",
            grantedAt: Timestamp.now(),
          },
        ],
      });

    const decisionForA = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });
    const decisionForB = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-b",
      permission: "staff.manage",
    });

    expect(decisionForA.allowed).toBe(false);
    expect(decisionForB.allowed).toBe(true);
  });
});

describe("evaluatePermission — no cross-request cache, always authoritative (§6.12, AD-2)", () => {
  it("a suspension applied between two calls is reflected immediately on the second call", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      status: "active",
      permissions: [],
    });

    const before = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    });
    expect(before.allowed).toBe(true);

    await db.collection("businessMemberships").doc("mem-1").update({ status: "suspended" });

    const after = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    });
    expect(after.allowed).toBe(false);
    expect(after.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

describe("evaluatePermission — read-only / purity (§6.18)", () => {
  it("issues zero writes to businesses, businessMemberships, or outboxEntries", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });

    const before = await Promise.all(
      ["businesses", "businessMemberships", "outboxEntries"].map(
        async (c) => (await db.collection(c).get()).size,
      ),
    );

    await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });
    await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "unknown.permission",
    });

    const after = await Promise.all(
      ["businesses", "businessMemberships", "outboxEntries"].map(
        async (c) => (await db.collection(c).get()).size,
      ),
    );

    expect(after).toEqual(before);
  });

  it("never emits an outbox entry (audit emission is the caller's responsibility, §6.18/§7.4 — deferred to 004C)", async () => {
    await db.collection("businesses").doc("biz-a").set({ status: "active" });
    await db.collection("businessMemberships").doc("mem-1").set({
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "active",
      permissions: [],
    });

    await evaluatePermission(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
    });

    const outbox = await db.collection("outboxEntries").get();
    expect(outbox.empty).toBe(true);
  });
});
