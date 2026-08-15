import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  recordSensitiveDecision,
  recordSensitiveDecisionStandalone,
} from "./permissionAuditService";
import type { AuthorizationDecision, AuthorizationRequest } from "../evaluator/types";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "permissionAuditServiceEmulatorTest");
const db = getFirestore(app);

const FIXED_NOW = new Date("2026-08-15T00:00:00.000Z");

function decision(overrides: Partial<AuthorizationDecision> = {}): AuthorizationDecision {
  return {
    allowed: true,
    reasonCode: "OWNER_FLOOR",
    role: "owner",
    permissionSource: "owner-floor",
    evaluatedAt: FIXED_NOW,
    ...overrides,
  };
}

function request(overrides: Partial<AuthorizationRequest> = {}): AuthorizationRequest {
  return {
    userId: "user-1",
    businessId: "biz-a",
    permission: "staff.manage",
    ...overrides,
  };
}

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
  for (const collection of ["outboxEntries", "membershipStateProbe"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("recordSensitiveDecision — real persistence, composed within a caller-owned transaction (L: 004D handoff)", () => {
  it("writes exactly one outbox entry, atomically alongside another write in the SAME caller-supplied transaction", async () => {
    // Stands in for a future 004D protected command: its own state-change
    // write (here, a synthetic probe doc) and the audit write happen in
    // one transaction this function does not open itself.
    const probeRef = db.collection("membershipStateProbe").doc("probe-1");

    await db.runTransaction(async (transaction) => {
      transaction.set(probeRef, { touchedBy: "protected-command-stand-in" });
      const outcome = recordSensitiveDecision(
        transaction,
        db,
        { decision: decision(), request: request(), idempotencyKey: "emu-key-1" },
        FIXED_NOW,
      );
      expect(outcome.recorded).toBe(true);
    });

    const probeSnapshot = await probeRef.get();
    expect(probeSnapshot.exists).toBe(true);

    const outboxSnapshot = await db.collection("outboxEntries").get();
    expect(outboxSnapshot.size).toBe(1);
    const entry = outboxSnapshot.docs[0]!.data();
    expect(entry["event"].eventType).toBe("permissions.permission_decision_recorded.v1");
    expect(entry["event"].payload.result).toBe("allow");
  });
});

describe("recordSensitiveDecisionStandalone — real persistence, idempotent enqueue (G/H: retry & duplicate delivery)", () => {
  it("the same logical decision recorded twice (same idempotencyKey) produces exactly one outbox document", async () => {
    const first = await recordSensitiveDecisionStandalone(db, {
      decision: decision(),
      request: request(),
      idempotencyKey: "emu-key-retry",
    });
    const second = await recordSensitiveDecisionStandalone(db, {
      decision: decision(),
      request: request(),
      idempotencyKey: "emu-key-retry",
    });

    expect(first.written).toBe(true);
    expect(second.recorded).toBe(true);
    if (second.recorded) {
      expect(second.written).toBe(false);
    }

    const snapshot = await db.collection("outboxEntries").get();
    expect(snapshot.size).toBe(1);
  });

  it("does not reset/reopen an already-completed outbox entry on a duplicate retry", async () => {
    await recordSensitiveDecisionStandalone(db, {
      decision: decision(),
      request: request(),
      idempotencyKey: "emu-key-completed",
    });
    const snapshot = await db.collection("outboxEntries").get();
    const ref = snapshot.docs[0]!.ref;
    await ref.update({ status: "completed" });

    await recordSensitiveDecisionStandalone(db, {
      decision: decision(),
      request: request(),
      idempotencyKey: "emu-key-completed",
    });

    const after = await ref.get();
    expect(after.data()?.["status"]).toBe("completed");
    const finalSnapshot = await db.collection("outboxEntries").get();
    expect(finalSnapshot.size).toBe(1);
  });

  it("two different logical decisions (different idempotencyKey) produce two distinct outbox documents", async () => {
    await recordSensitiveDecisionStandalone(db, {
      decision: decision({ allowed: true }),
      request: request(),
      idempotencyKey: "emu-key-distinct-1",
    });
    await recordSensitiveDecisionStandalone(db, {
      decision: decision({ allowed: false, reasonCode: "EXPLICIT_REVOCATION" }),
      request: request(),
      idempotencyKey: "emu-key-distinct-2",
    });

    const snapshot = await db.collection("outboxEntries").get();
    expect(snapshot.size).toBe(2);
  });
});

describe("recordSensitiveDecisionStandalone — non-sensitive decisions produce no audit event (F)", () => {
  it("writes zero outbox entries for a non-sensitive permission, allow or deny", async () => {
    await recordSensitiveDecisionStandalone(db, {
      decision: decision({ allowed: true, reasonCode: "ROLE_DEFAULT_ALLOW" }),
      request: request({ permission: "customer.lookupByLoyaltyNumber" }),
      idempotencyKey: "emu-key-nonsensitive-allow",
    });
    await recordSensitiveDecisionStandalone(db, {
      decision: decision({ allowed: false, reasonCode: "NO_APPLICABLE_GRANT" }),
      request: request({ permission: "purchase.record" }),
      idempotencyKey: "emu-key-nonsensitive-deny",
    });

    const snapshot = await db.collection("outboxEntries").get();
    expect(snapshot.empty).toBe(true);
  });
});

describe("recordSensitiveDecisionStandalone — privacy-safe persisted payload (J)", () => {
  it("the persisted document contains only governed fields, no credential/token/session material", async () => {
    await recordSensitiveDecisionStandalone(db, {
      decision: decision(),
      request: request(),
      idempotencyKey: "emu-key-privacy",
    });

    const snapshot = await db.collection("outboxEntries").get();
    const raw = JSON.stringify(snapshot.docs[0]!.data());
    for (const forbidden of ["token", "password", "otp", "secret", "credential", "sessionId"]) {
      expect(raw.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
    expect(snapshot.docs[0]!.data()["event"].payload.privacyClassification).toBe(
      "class_2_internal_operational",
    );
  });
});
