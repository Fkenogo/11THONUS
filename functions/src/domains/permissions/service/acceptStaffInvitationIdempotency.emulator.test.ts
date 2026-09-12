import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import { acceptStaffInvitation } from "./acceptStaffInvitationService";
import { createBusinessMembershipInvitation } from "../models/businessMembershipInvitation";
import { toBusinessMembershipInvitationDocumentFields } from "../repositories/businessMembershipInvitationDocument";

/**
 * `PLATFORM-BASELINE-004A` — atomic idempotency-completion regression proof
 * for `acceptStaffInvitation`.
 *
 * Before this package, a successful acceptance committed its domain writes
 * (membership creation, invitation consumption, outbox evidence) in one
 * transaction and then completed its idempotency record in a second,
 * post-commit write. If that second write failed, the `catch` marked the
 * key `failed` — which the shared idempotency contract treats as retryable
 * — so a same-key retry re-ran the command against an already-`accepted`
 * invitation and threw `INVITATION_ALREADY_ACCEPTED` for an operation that
 * had already succeeded: the shared post-commit ambiguous-committed-success
 * pattern `PLATFORM-BASELINE-003-CORR-001` corrected for Business
 * activation. The command now stages `completeIdempotencyKeyInTransaction`
 * inside the acceptance transaction itself, so the four commit or abort
 * together.
 *
 * Real Firestore round trip against the Firebase Emulator Suite. Not run as
 * part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "staffAcceptIdempotencyEmulatorTest");
const db: Firestore = getFirestore(app);

const actor = { actorType: "user" as const, actorId: "test-actor" };
let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

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
    "businessMemberships",
    "businessMembershipInvitations",
    "idempotencyRecords",
    "outboxEntries",
    "users",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }

  const { users: authUsers } = await getAuth(app).listUsers();
  if (authUsers.length > 0) {
    await getAuth(app).deleteUsers(authUsers.map((u) => u.uid));
  }
});

/** Seeds a pending email invitation document directly (ACCEPT never reads the Business itself). */
async function seedPendingEmailInvitation(params: {
  invitationId: string;
  businessId: string;
  email: string;
}): Promise<void> {
  const invitation = createBusinessMembershipInvitation({
    id: params.invitationId,
    businessId: params.businessId,
    role: "staff",
    deliveryTarget: { type: "email", value: params.email },
    invitedBy: "cust_owner",
    invitedAt: new Date("2026-08-19T00:00:00.000Z"),
    expiresAt: new Date("2026-08-26T00:00:00.000Z"),
  });
  await db
    .collection("businessMembershipInvitations")
    .doc(params.invitationId)
    .set(toBusinessMembershipInvitationDocumentFields(invitation));
}

/**
 * Creates a REAL Firebase Auth user (via the Auth emulator) and links its
 * own Firebase UID as the identity's `email`-type
 * `AuthenticationReference.referenceId` — the same production-faithful
 * seeding `staffInvitation.emulator.test.ts` uses.
 */
async function seedCustomerIdentityWithEmail(userId: string, email: string): Promise<void> {
  const userRecord = await getAuth(app).createUser({ email, emailVerified: true });
  const key = nextId("identity");
  await createCustomerIdentity(db, {
    eventId: `evt_${key}`,
    correlationId: `corr_${key}`,
    actor: { actorType: "system", actorId: "system" },
    occurredAt: "2026-08-19T00:00:00.000Z",
    customerIdentityId: userId,
    initialAuthenticationReference: {
      referenceId: userRecord.uid,
      referenceType: "email",
      createdAt: new Date("2026-08-19T00:00:00.000Z"),
      createdBy: userId,
    },
    createdAt: new Date("2026-08-19T00:00:00.000Z"),
    createdBy: userId,
    idempotencyKey: `idem_${key}`,
    requestHash: `hash_${key}`,
  });
}

function acceptParams(overrides: {
  idempotencyKey: string;
  authenticatedCustomerIdentityId: string;
  invitationReference: string;
  testOnlyBeforeCommitHook?: () => Promise<void>;
}) {
  return {
    request: { invitationReference: overrides.invitationReference },
    authenticatedCustomerIdentityId: overrides.authenticatedCustomerIdentityId,
    idempotencyKey: overrides.idempotencyKey,
    correlationId: `corr_${overrides.idempotencyKey}`,
    actor,
    now: new Date("2026-08-19T01:00:00.000Z"),
    newId: () => nextId("evt"),
    ...(overrides.testOnlyBeforeCommitHook
      ? { testOnlyBeforeCommitHook: overrides.testOnlyBeforeCommitHook }
      : {}),
  };
}

describe("acceptStaffInvitation atomic idempotency completion (PLATFORM-BASELINE-004A)", () => {
  it("successful acceptance commits membership, invitation consumption, outbox AND idempotency completion together", async () => {
    await seedPendingEmailInvitation({
      invitationId: "inv_atomic_1",
      businessId: "biz_atomic_1",
      email: "atomic1@example.com",
    });
    await seedCustomerIdentityWithEmail("cust_atomic_1", "atomic1@example.com");

    const result = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: "accept_key_atomic_1",
        authenticatedCustomerIdentityId: "cust_atomic_1",
        invitationReference: "inv_atomic_1",
      }),
    );

    expect(result.membershipId).toBeTruthy();
    expect(result.businessId).toBe("biz_atomic_1");

    const membershipSnap = await db
      .collection("businessMemberships")
      .doc(result.membershipId)
      .get();
    expect(membershipSnap.exists).toBe(true);
    expect(membershipSnap.data()?.["status"]).toBe("active");

    const invitationSnap = await db
      .collection("businessMembershipInvitations")
      .doc("inv_atomic_1")
      .get();
    expect(invitationSnap.data()?.["status"]).toBe("accepted");

    // The idempotency record completed in the SAME commit as the domain
    // writes — not in a follow-up write that could fail independently.
    const idempotencySnap = await db
      .collection("idempotencyRecords")
      .doc("accept_key_atomic_1")
      .get();
    expect(idempotencySnap.data()?.["status"]).toBe("completed");
    expect(idempotencySnap.data()?.["resultReference"]).toBe(
      `businessMemberships/${result.membershipId}`,
    );
  });

  it("same-key retry after a committed acceptance replays the stored success instead of failing against the consumed invitation", async () => {
    await seedPendingEmailInvitation({
      invitationId: "inv_atomic_2",
      businessId: "biz_atomic_2",
      email: "atomic2@example.com",
    });
    await seedCustomerIdentityWithEmail("cust_atomic_2", "atomic2@example.com");

    const first = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: "accept_key_atomic_2",
        authenticatedCustomerIdentityId: "cust_atomic_2",
        invitationReference: "inv_atomic_2",
      }),
    );

    // A retry with the same key and same request observes "duplicate" and
    // replays the stored snapshot — it must NOT throw
    // INVITATION_ALREADY_ACCEPTED against the now-consumed invitation, and
    // must NOT create a second membership.
    const replay = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: "accept_key_atomic_2",
        authenticatedCustomerIdentityId: "cust_atomic_2",
        invitationReference: "inv_atomic_2",
      }),
    );
    expect(replay.membershipId).toBe(first.membershipId);
    expect(replay.businessId).toBe(first.businessId);
    expect(replay.userId).toBe(first.userId);

    // `PLATFORM-BASELINE-004A-CORR-001` (Codex review, P1): Firestore
    // round-trips the stored snapshot's `acceptedAt` as a `Timestamp`, not
    // the `Date` the type declares. The callable transport unconditionally
    // calls `.toISOString()` on this field, which a `Timestamp` does not
    // implement — a real replay must come back as a genuine `Date` so that
    // call cannot throw.
    expect(replay.acceptedAt).toBeInstanceOf(Date);
    expect(() => replay.acceptedAt.toISOString()).not.toThrow();
    expect(replay.acceptedAt.toISOString()).toBe(first.acceptedAt.toISOString());

    const memberships = await db
      .collection("businessMemberships")
      .where("businessId", "==", "biz_atomic_2")
      .where("userId", "==", "cust_atomic_2")
      .get();
    expect(memberships.size).toBe(1);
  });

  it("a forced abort after all writes are staged leaves neither the domain mutation nor the idempotency completion durable, and a corrected retry succeeds", async () => {
    await seedPendingEmailInvitation({
      invitationId: "inv_atomic_3",
      businessId: "biz_atomic_3",
      email: "atomic3@example.com",
    });
    await seedCustomerIdentityWithEmail("cust_atomic_3", "atomic3@example.com");

    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: "accept_key_atomic_3",
          authenticatedCustomerIdentityId: "cust_atomic_3",
          invitationReference: "inv_atomic_3",
          testOnlyBeforeCommitHook: async () => {
            throw new Error("forced pre-commit abort");
          },
        }),
      ),
    ).rejects.toThrow("forced pre-commit abort");

    // The aborted transaction left nothing durable: no membership, the
    // invitation still pending, and the idempotency record NOT completed
    // (the `catch` marked the key failed, keeping it retryable).
    const memberships = await db
      .collection("businessMemberships")
      .where("businessId", "==", "biz_atomic_3")
      .where("userId", "==", "cust_atomic_3")
      .get();
    expect(memberships.size).toBe(0);

    const invitationSnap = await db
      .collection("businessMembershipInvitations")
      .doc("inv_atomic_3")
      .get();
    expect(invitationSnap.data()?.["status"]).toBe("pending");

    const idempotencySnap = await db
      .collection("idempotencyRecords")
      .doc("accept_key_atomic_3")
      .get();
    expect(idempotencySnap.data()?.["status"]).toBe("failed");

    // A corrected retry with the same key succeeds (failed keys are
    // retryable per the shared idempotency contract).
    const result = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: "accept_key_atomic_3",
        authenticatedCustomerIdentityId: "cust_atomic_3",
        invitationReference: "inv_atomic_3",
      }),
    );
    expect(result.businessId).toBe("biz_atomic_3");
    expect(result.userId).toBe("cust_atomic_3");
  });
});
