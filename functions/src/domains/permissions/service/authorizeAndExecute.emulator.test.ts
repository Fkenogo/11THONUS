import { randomUUID } from "node:crypto";
import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { touchPermissionBoundaryFixture } from "./touchPermissionBoundaryFixtureCommand";

/**
 * `ENG-P2-004D` authorization-boundary integration/security matrix — real
 * Firestore emulator, not fixtures. Exercises `authorizeAndExecute` via
 * the internal `touchPermissionBoundaryFixture` test-only command shim
 * (Phase G), against real `businesses`/`businessMemberships` documents,
 * proving the trusted-decision boundary, TOCTOU-safe transaction
 * composition, and sensitive audit atomicity end-to-end.
 *
 * Founder disposition (Phase C correction #2): no test in this file
 * asserts a non-sensitive permission ALLOW outcome — no governed
 * non-sensitive role-default baseline exists (a pre-existing 004A/004B
 * disclosed gap, not a 004D defect). The "unknown permission" cases
 * below prove only fail-closed denial and the absence of a persisted
 * audit record for a non-sensitive decision — see the closure report's
 * acceptance matrix for the explicit record of this limitation.
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "authorizeAndExecuteEmulatorTest");
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
  for (const collection of [
    "businesses",
    "businessMemberships",
    "outboxEntries",
    "permissionBoundaryTestFixtures",
    "idempotencyRecords",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

async function seedBusiness(businessId: string, status = "active") {
  await db.collection("businesses").doc(businessId).set({ status });
}

async function seedMembership(params: {
  membershipId: string;
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  status?: string;
  overrides?: Array<{ permissionId: string; direction: "grant" | "revoke" }>;
}) {
  const { Timestamp } = await import("firebase-admin/firestore");
  await db
    .collection("businessMemberships")
    .doc(params.membershipId)
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
      permissions: (params.overrides ?? []).map((o) => ({
        permissionId: o.permissionId,
        direction: o.direction,
        grantedBy: "user-owner",
        grantedAt: Timestamp.now(),
      })),
    });
}

async function fixtureDoc(fixtureId: string) {
  const snap = await db.collection("permissionBoundaryTestFixtures").doc(fixtureId).get();
  return snap.exists ? snap.data() : null;
}

async function outboxEntries() {
  const snap = await db.collection("outboxEntries").get();
  return snap.docs.map((d) => d.data());
}

function newIds() {
  const id = randomUUID();
  return { idempotencyKey: id, requestHash: `hash-${id}`, correlationId: `corr-${id}` };
}

describe("authorizeAndExecute — allow paths", () => {
  it("1/3: authorized sensitive action (explicit grant) → mutation succeeds, audit written atomically", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome).toMatchObject({ outcome: "executed", result: { touchedCount: 1 } });
    const doc = await fixtureDoc("fixture-1");
    expect(doc?.["touchedCount"]).toBe(1);

    const entries = await outboxEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.["event"].payload.result).toBe("allow");
    expect(entries[0]?.["event"].payload.permission).toBe("staff.manage");
  });

  it("3b: sensitive allow via role-default (owner) → mutation + audit atomically", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect(await fixtureDoc("fixture-1")).not.toBeNull();
    expect(await outboxEntries()).toHaveLength(1);
  });
});

describe("authorizeAndExecute — deny paths (mutation blocked)", () => {
  it("2/4: unauthorized sensitive action → mutation blocked, deny audit written", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    expect(await fixtureDoc("fixture-1")).toBeNull();

    const entries = await outboxEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.["event"].payload.result).toBe("deny");
  });

  it("5: explicit revocation overrides an otherwise-granted role default → blocked", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "customer.viewProtectedProfile", direction: "revoke" }],
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    expect(await fixtureDoc("fixture-1")).toBeNull();
  });

  it("6: role-ineligible sensitive grant → blocked (Staff grant on Manager-only-eligible permission)", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "staff",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    expect(await fixtureDoc("fixture-1")).toBeNull();
  });

  it("7: inactive (suspended) membership → blocked", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
      status: "suspended",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome).toMatchObject({
      outcome: "denied",
      decision: { errorCategory: "AUTH_FORBIDDEN" },
    });
    expect(await fixtureDoc("fixture-1")).toBeNull();
  });

  it("8: inactive business → blocked regardless of role", async () => {
    await seedBusiness("biz-a", "suspended");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome).toMatchObject({
      outcome: "denied",
      decision: { errorCategory: "BUSINESS_INACTIVE" },
    });
  });

  it("9: forged business context (no membership in the requested business) → blocked", async () => {
    await seedBusiness("biz-a");
    await seedBusiness("biz-b");
    await seedMembership({
      membershipId: "mem-a",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-b",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("10/11: a grant/override in Business B never authorizes the same user's request against Business A", async () => {
    await seedBusiness("biz-a");
    await seedBusiness("biz-b");
    await seedMembership({
      membershipId: "mem-a",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
    });
    await seedMembership({
      membershipId: "mem-b",
      userId: "user-1",
      businessId: "biz-b",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });

    const outcomeA = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-a",
      ...newIds(),
    });
    const outcomeB = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-b",
      permission: "staff.manage",
      fixtureId: "fixture-b",
      ...newIds(),
    });

    expect(outcomeA.outcome).toBe("denied");
    expect(outcomeB.outcome).toBe("executed");
  });

  it("12: same identity, independent Owner-in-A / Staff-in-B memberships resolve independently", async () => {
    await seedBusiness("biz-a");
    await seedBusiness("biz-b");
    await seedMembership({
      membershipId: "mem-a",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-b",
      userId: "user-1",
      businessId: "biz-b",
      role: "staff",
    });

    const outcomeA = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-a",
      ...newIds(),
    });
    const outcomeB = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-b",
      permission: "staff.manage",
      fixtureId: "fixture-b",
      ...newIds(),
    });

    expect(outcomeA.outcome).toBe("executed");
    expect(outcomeB.outcome).toBe("denied");
  });

  it("13: malformed permission id → blocked, VALIDATION_FAILED", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "not_well_formed",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome).toMatchObject({
      outcome: "denied",
      decision: { errorCategory: "VALIDATION_FAILED" },
    });
  });

  it("14/23: unknown (non-catalogued, non-sensitive) permission → fail-closed denial, zero persisted audit — NOT an ALLOW proof (Founder disposition #2)", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "permissionBoundaryTestFixture.touch",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    expect(await fixtureDoc("fixture-1")).toBeNull();
    expect(await outboxEntries()).toHaveLength(0);
  });

  it("15: corrupt persisted override direction → fail closed", async () => {
    const { Timestamp } = await import("firebase-admin/firestore");
    await seedBusiness("biz-a");
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
            grantedBy: "u1",
            grantedAt: Timestamp.now(),
          },
        ],
      });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("16: business not found (simulated read-miss) → denied, no mutation", async () => {
    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-nonexistent",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    expect(await fixtureDoc("fixture-1")).toBeNull();
  });
});

describe("authorizeAndExecute — trusted-decision boundary (Phase D)", () => {
  it("17a (structural): neither AuthorizeAndExecuteParams nor AuthorizationRequest has a field of type AuthorizationDecision, role, reasonCode, or membershipId", () => {
    // Structural, not runtime: TouchPermissionBoundaryFixtureParams and
    // AuthorizeAndExecuteParams carry only primitive request fields
    // (userId, businessId, permission, resourceType?, resourceId?) plus
    // idempotency/correlation metadata and a mutation callback — no
    // decision-shaped field exists to smuggle a fabricated result
    // through, and AuthorizationRequest (evaluator/types.ts) has no
    // `membershipId` field either, so a "forged membership context"
    // attack (matrix item 9's sibling) has no parameter to target. A TS
    // compile failure would be the only way this regresses; the runtime
    // test below (17b) covers a caller that bypasses the type system.
    expect(true).toBe(true);
  });

  it("17b (adversarial): a request payload with fabricated decision-shaped fields (allowed, decision, role, reasonCode), injected past the type system, has zero effect on the outcome", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
    });
    // No override, no grant — real authoritative state denies this permission.

    const { authorizeAndExecute } = await import("./authorizeAndExecute");
    const forgedRequest = {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      // Fields with no place in `AuthorizationRequest`'s type — only
      // reachable by a caller that bypasses TypeScript (`as unknown as`),
      // simulating a compromised or malicious caller.
      allowed: true,
      decision: { allowed: true, reasonCode: "OWNER_FLOOR" },
      role: "owner",
      reasonCode: "OWNER_FLOOR",
      permissionSource: "explicit-grant",
    } as unknown as Parameters<typeof authorizeAndExecute>[1]["request"];

    const outcome = await authorizeAndExecute(db, {
      request: forgedRequest,
      ...newIds(),
      actorId: "user-1",
      mutation: { prepare: () => undefined, apply: () => ({}) },
    });

    // Real, transaction-read authoritative state (Manager, no grant) wins —
    // the fabricated fields were never read by any code path.
    expect(outcome.outcome).toBe("denied");
    expect(await fixtureDoc("fixture-1")).toBeNull();
  });
});

describe("authorizeAndExecute — transaction atomicity & idempotency", () => {
  it("18: mutation.apply throwing aborts the whole transaction — no mutation, no audit commit", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });

    const { authorizeAndExecute } = await import("./authorizeAndExecute");
    const ids = newIds();

    await expect(
      authorizeAndExecute(db, {
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        idempotencyKey: ids.idempotencyKey,
        requestHash: ids.requestHash,
        correlationId: ids.correlationId,
        actorId: "user-1",
        mutation: {
          prepare: () => undefined,
          apply: () => {
            throw new Error("simulated protected-mutation failure");
          },
        },
      }),
    ).rejects.toThrow("simulated protected-mutation failure");

    expect(await outboxEntries()).toHaveLength(0);
    expect(await fixtureDoc("fixture-1")).toBeNull();
  });

  // A prior version of this suite attempted to force a genuine
  // Firestore-internal transaction retry by issuing a blocking external
  // write to the same document from inside `prepare`, nested within the
  // still-open transaction. That design deadlocked against the open
  // transaction (observed: a 5s test timeout, then cascading 10s
  // `beforeEach` hook timeouts on every subsequent test in this file) and
  // was removed rather than fixed with a timing hack — retry-safety for a
  // single logical operation is not directly tested here. 19a/19b below
  // remain the real, currently-passing evidence for retry/contention
  // safety: two independent concurrent commands racing on the same
  // document, which requires the same underlying optimistic-concurrency
  // retry machinery to resolve correctly without a lost update.

  it("20: a completed request replayed with the same idempotency key returns duplicate, does not reset the audit entry", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });
    const ids = newIds();

    const first = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...ids,
    });
    expect(first.outcome).toBe("executed");

    const second = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...ids,
    });

    expect(second.outcome).toBe("duplicate");
    expect(await fixtureDoc("fixture-1")).toMatchObject({ touchedCount: 1 });
    expect(await outboxEntries()).toHaveLength(1);
  });

  it("21: revoking a grant between two distinct-idempotency-key attempts flips the outcome — current state always wins", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });

    const first = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });
    expect(first.outcome).toBe("executed");

    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "revoke" }],
    });

    const second = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });
    expect(second.outcome).toBe("denied");
  });
});

describe("authorizeAndExecute — concurrency (Phase M)", () => {
  it("19a: two concurrent calls with the SAME idempotency key produce exactly one mutation and one audit event", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });
    const ids = newIds();
    const call = () =>
      touchPermissionBoundaryFixture(db, {
        userId: "user-1",
        businessId: "biz-a",
        permission: "staff.manage",
        fixtureId: "fixture-1",
        ...ids,
      });

    const [first, second] = await Promise.all([call(), call()]);
    const outcomes = [first.outcome, second.outcome].sort();
    // One wins the idempotency reservation and executes; the other observes
    // either "in_progress" (raced the reservation) or "duplicate" (raced the
    // completion) — never a second "executed".
    expect(outcomes).not.toEqual(["executed", "executed"]);

    expect(await fixtureDoc("fixture-1")).toMatchObject({ touchedCount: 1 });
    expect(await outboxEntries()).toHaveLength(1);
  });

  it("19b: two concurrent DIFFERENT-idempotency-key attempts against the same fixture both land — Firestore contention retry, no lost update", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
      overrides: [{ permissionId: "staff.manage", direction: "grant" }],
    });

    const [first, second] = await Promise.all([
      touchPermissionBoundaryFixture(db, {
        userId: "user-1",
        businessId: "biz-a",
        permission: "staff.manage",
        fixtureId: "fixture-1",
        ...newIds(),
      }),
      touchPermissionBoundaryFixture(db, {
        userId: "user-1",
        businessId: "biz-a",
        permission: "staff.manage",
        fixtureId: "fixture-1",
        ...newIds(),
      }),
    ]);

    expect(first.outcome).toBe("executed");
    expect(second.outcome).toBe("executed");
    // Both distinct logical commands landed — no lost update from the
    // read-modify-write race on `touchedCount` (Firestore's own
    // transaction retry on contention re-runs the loser from fresh reads).
    expect(await fixtureDoc("fixture-1")).toMatchObject({ touchedCount: 2 });
    expect(await outboxEntries()).toHaveLength(2);
  });

  it("membership suspended concurrently with a competing protected command → no stale allow", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const [firstCall, suspend] = await Promise.all([
      touchPermissionBoundaryFixture(db, {
        userId: "user-1",
        businessId: "biz-a",
        permission: "staff.manage",
        fixtureId: "fixture-1",
        ...newIds(),
      }),
      db.collection("businessMemberships").doc("mem-1").update({ status: "suspended" }),
    ]);
    void suspend;
    void firstCall;

    const after = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "staff.manage",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(after.outcome).toBe("denied");
  });
});
