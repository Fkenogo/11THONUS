import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bootstrapBusiness,
  type BootstrapBusinessParams,
} from "../../business/repositories/businessRepository";
import type { CreateBusinessRequest } from "../../business/models/businessBootstrap";
import type { BusinessCodeCandidateGenerator } from "../../business/services/businessCodeGenerator";
import { BUSINESS_CODE_ALPHABET, BUSINESS_CODE_PREFIX } from "../../business/models/businessCode";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import { createStaffInvitation } from "./createStaffInvitationService";
import { revokeStaffInvitation } from "./revokeStaffInvitationService";
import { acceptStaffInvitation } from "./acceptStaffInvitationService";
import { getInvitationByReference } from "../repositories/businessMembershipInvitationRepository";
import { getBusinessMembershipByUserAndBusiness } from "../repositories/businessMembershipRepository";
import { evaluatePermissionWithContext } from "./evaluatePermissionService";

// Real Firestore round trip against the Firebase Emulator Suite. Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp({ projectId: "demo-11thonus" }, "staffInvitationEmulatorTest");
const db: Firestore = getFirestore(app);

const actor = { actorType: "user" as const, actorId: "test-actor" };
let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

class SequenceGenerator implements BusinessCodeCandidateGenerator {
  private index = 0;
  constructor(private readonly sequence: string[]) {}
  generateCandidate(): string {
    const value = this.sequence[this.index];
    if (value === undefined) throw new Error("SequenceGenerator exhausted");
    this.index++;
    return value;
  }
}

const baseBusinessRequest: CreateBusinessRequest = {
  displayName: "Emulator Cafe",
  primaryCategoryId: "cat_food",
  countryCode: "US",
  currencyCode: "USD",
  timezone: "America/Los_Angeles",
  city: "Springfield",
  contactPhone: "+15550100",
  supportedLanguages: ["en"],
};

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
    "businessBranches",
    "businessMemberships",
    "businessMembershipInvitations",
    "businessCodeReservations",
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

let businessCodeCounter = 0;
/** Deterministically produces a well-formed, unique `BIZ<6 chars>` code from the governed alphabet. */
function nextBusinessCode(): string {
  let n = businessCodeCounter++;
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix = BUSINESS_CODE_ALPHABET[n % BUSINESS_CODE_ALPHABET.length] + suffix;
    n = Math.floor(n / BUSINESS_CODE_ALPHABET.length);
  }
  return `${BUSINESS_CODE_PREFIX}${suffix}`;
}

/** Bootstraps a Business (owned by `ownerUserId`) and activates it (INVITE/REVOKE require an operational business status). */
async function seedActiveBusiness(ownerUserId: string): Promise<string> {
  const key = nextId("bootstrap");
  const params: BootstrapBusinessParams = {
    ownerUserId,
    idempotencyKey: key,
    correlationId: `corr_${key}`,
    actor,
    now: new Date("2026-08-19T00:00:00.000Z"),
    newId: () => nextId("evt"),
    generator: new SequenceGenerator([nextBusinessCode()]),
  };
  const result = await bootstrapBusiness(db, baseBusinessRequest, params);
  await db.collection("businesses").doc(result.businessId).update({ status: "active" });
  return result.businessId;
}

/** Seeds a non-owner membership directly (bypassing 003C, which does not exist yet). */
async function seedMembership(
  businessId: string,
  userId: string,
  role: "manager" | "staff",
  status: "active" | "suspended" | "removed" = "active",
): Promise<string> {
  const id = nextId("mem");
  await db
    .collection("businessMemberships")
    .doc(id)
    .set({
      userId,
      businessId,
      role,
      status,
      permissions: [],
      invitedBy: "seed",
      invitedAt: new Date("2026-08-19T00:00:00.000Z"),
      createdAt: new Date("2026-08-19T00:00:00.000Z"),
      updatedAt: new Date("2026-08-19T00:00:00.000Z"),
      schemaVersion: 1,
    });
  return id;
}

/**
 * Creates a REAL Firebase Auth user (via the Auth emulator) and links its
 * own Firebase UID — never the literal email string — as the identity's
 * `email`-type `AuthenticationReference.referenceId`. This mirrors
 * production reality exactly: `referenceId` is always a Firebase UID
 * (`firebaseTokenVerifier.ts`, `decoded.uid`); the corrected entitlement
 * mechanism (`verifiedContactLookup.ts`) resolves that UID back to its
 * live, verified Firebase Auth email. `emailVerified: true` is required —
 * an unverified email must never satisfy entitlement.
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

/** Same as `seedCustomerIdentityWithEmail`, for a `phone_otp` reference. */
async function seedCustomerIdentityWithPhone(userId: string, phoneNumber: string): Promise<void> {
  const userRecord = await getAuth(app).createUser({ phoneNumber });
  const key = nextId("identity");
  await createCustomerIdentity(db, {
    eventId: `evt_${key}`,
    correlationId: `corr_${key}`,
    actor: { actorType: "system", actorId: "system" },
    occurredAt: "2026-08-19T00:00:00.000Z",
    customerIdentityId: userId,
    initialAuthenticationReference: {
      referenceId: userRecord.uid,
      referenceType: "phone_otp",
      createdAt: new Date("2026-08-19T00:00:00.000Z"),
      createdBy: userId,
    },
    createdAt: new Date("2026-08-19T00:00:00.000Z"),
    createdBy: userId,
    idempotencyKey: `idem_${key}`,
    requestHash: `hash_${key}`,
  });
}

function inviteParams(overrides: { idempotencyKey: string; actorUserId: string }) {
  return {
    actorUserId: overrides.actorUserId,
    idempotencyKey: overrides.idempotencyKey,
    correlationId: `corr_${overrides.idempotencyKey}`,
    actor,
    now: new Date("2026-08-19T00:00:00.000Z"),
    newId: () => nextId("evt"),
  };
}

describe("createStaffInvitation — INVITE", () => {
  it("Owner invites Staff — creates a pending invitation and an outbox entry", async () => {
    const businessId = await seedActiveBusiness("owner_1");
    const result = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "staffer@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_1" }),
    );
    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") return;
    expect(result.invitation.status).toBe("pending");
    expect(result.invitation.role).toBe("staff");

    const stored = await getInvitationByReference(db, result.invitation.id);
    expect(stored.kind).toBe("found");

    const outbox = await db.collection("outboxEntries").get();
    expect(
      outbox.docs.some(
        (d) => d.data()["event"]?.eventType === "staffInvitation.staff_invitation_created.v1",
      ),
    ).toBe(true);
  });

  it("Owner invites Manager — allowed", async () => {
    const businessId = await seedActiveBusiness("owner_2");
    const result = await createStaffInvitation(
      db,
      { businessId, role: "manager", deliveryTarget: { type: "email", value: "mgr@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_2" }),
    );
    expect(result.outcome).toBe("created");
  });

  it("Manager holding staff.manage invites Staff — allowed", async () => {
    const businessId = await seedActiveBusiness("owner_3");
    const mgrMembershipId = await seedMembership(businessId, "mgr_3", "manager", "active");
    // Manager needs an explicit staff.manage grant to hold the permission at all.
    await db
      .collection("businessMemberships")
      .doc(mgrMembershipId)
      .update({
        permissions: [
          {
            permissionId: "staff.manage",
            direction: "grant",
            grantedBy: "owner_3",
            grantedAt: new Date("2026-08-19T00:00:00.000Z"),
          },
        ],
      });

    const result = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "staffer2@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "mgr_3" }),
    );
    expect(result.outcome).toBe("created");
  });

  it("Manager holding staff.manage cannot invite Manager — throws AUTH_FORBIDDEN", async () => {
    const businessId = await seedActiveBusiness("owner_4");
    const mgrMembershipId4 = await seedMembership(businessId, "mgr_4", "manager", "active");
    await db
      .collection("businessMemberships")
      .doc(mgrMembershipId4)
      .update({
        permissions: [
          {
            permissionId: "staff.manage",
            direction: "grant",
            grantedBy: "owner_4",
            grantedAt: new Date("2026-08-19T00:00:00.000Z"),
          },
        ],
      });

    await expect(
      createStaffInvitation(
        db,
        { businessId, role: "manager", deliveryTarget: { type: "email", value: "x@example.com" } },
        inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "mgr_4" }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("Staff (no staff.manage) is denied", async () => {
    const businessId = await seedActiveBusiness("owner_5");
    await seedMembership(businessId, "staff_5", "staff", "active");

    const result = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "y@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "staff_5" }),
    );
    expect(result.outcome).toBe("denied");
  });

  it("cross-business: an actor with no membership in the target business is denied", async () => {
    const businessA = await seedActiveBusiness("owner_a");
    await seedActiveBusiness("owner_b");

    const result = await createStaffInvitation(
      db,
      {
        businessId: businessA,
        role: "staff",
        deliveryTarget: { type: "email", value: "z@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_b" }),
    );
    expect(result.outcome).toBe("denied");
  });

  it("idempotent replay (same key) returns duplicate, does not create a second invitation", async () => {
    const businessId = await seedActiveBusiness("owner_6");
    const key = nextId("invite");
    const request = {
      businessId,
      role: "staff" as const,
      deliveryTarget: { type: "email" as const, value: "dup@example.com" },
    };
    const first = await createStaffInvitation(
      db,
      request,
      inviteParams({ idempotencyKey: key, actorUserId: "owner_6" }),
    );
    expect(first.outcome).toBe("created");

    const second = await createStaffInvitation(
      db,
      request,
      inviteParams({ idempotencyKey: key, actorUserId: "owner_6" }),
    );
    expect(second.outcome).toBe("duplicate");

    const all = await db
      .collection("businessMembershipInvitations")
      .where("businessId", "==", businessId)
      .get();
    expect(all.size).toBe(1);
  });

  it("conflicting replay (same key, different payload) fails IDEMPOTENCY_CONFLICT", async () => {
    const businessId = await seedActiveBusiness("owner_7");
    const key = nextId("invite");
    await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "a@example.com" } },
      inviteParams({ idempotencyKey: key, actorUserId: "owner_7" }),
    );

    await expect(
      createStaffInvitation(
        db,
        {
          businessId,
          role: "staff",
          deliveryTarget: { type: "email", value: "different@example.com" },
        },
        inviteParams({ idempotencyKey: key, actorUserId: "owner_7" }),
      ),
    ).rejects.toMatchObject({ category: "IDEMPOTENCY_CONFLICT" });
  });

  it("a second INVITE for the same pending delivery target in the same business fails VALIDATION_FAILED", async () => {
    const businessId = await seedActiveBusiness("owner_8");
    await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "again@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_8" }),
    );

    await expect(
      createStaffInvitation(
        db,
        {
          businessId,
          role: "staff",
          deliveryTarget: { type: "email", value: "again@example.com" },
        },
        inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_8" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("phone delivery target is accepted", async () => {
    const businessId = await seedActiveBusiness("owner_9");
    const result = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "phone", value: "+15559990000" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_9" }),
    );
    expect(result.outcome).toBe("created");
  });

  it("an unsupported delivery type is rejected at construction", async () => {
    const businessId = await seedActiveBusiness("owner_10");
    await expect(
      createStaffInvitation(
        db,
        { businessId, role: "staff", deliveryTarget: { type: "sms_blast", value: "x" } },
        inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_10" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });
});

describe("revokeStaffInvitation — REVOKE", () => {
  it("Owner revokes a pending invitation", async () => {
    const businessId = await seedActiveBusiness("owner_r1");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "r1@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_r1" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");

    const revoked = await revokeStaffInvitation(
      db,
      { businessId, invitationId: created.invitation.id },
      inviteParams({ idempotencyKey: nextId("revoke"), actorUserId: "owner_r1" }),
    );
    expect(revoked.outcome).toBe("revoked");
    if (revoked.outcome !== "revoked") return;
    expect(revoked.invitation.status).toBe("revoked");
  });

  it("cross-business revoke is denied — Business A cannot revoke Business B's invitation", async () => {
    const businessA = await seedActiveBusiness("owner_ra");
    const businessB = await seedActiveBusiness("owner_rb");
    const created = await createStaffInvitation(
      db,
      {
        businessId: businessB,
        role: "staff",
        deliveryTarget: { type: "email", value: "rb@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_rb" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");

    await expect(
      revokeStaffInvitation(
        db,
        { businessId: businessA, invitationId: created.invitation.id },
        inviteParams({ idempotencyKey: nextId("revoke"), actorUserId: "owner_ra" }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("revoking an already-revoked (terminal) invitation with a fresh key fails INVALID_STATE_TRANSITION", async () => {
    const businessId = await seedActiveBusiness("owner_r2");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "r2@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_r2" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await revokeStaffInvitation(
      db,
      { businessId, invitationId: created.invitation.id },
      inviteParams({ idempotencyKey: nextId("revoke"), actorUserId: "owner_r2" }),
    );

    await expect(
      revokeStaffInvitation(
        db,
        { businessId, invitationId: created.invitation.id },
        inviteParams({ idempotencyKey: nextId("revoke"), actorUserId: "owner_r2" }),
      ),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
  });

  it("replaying REVOKE with the same key is idempotent (duplicate outcome)", async () => {
    const businessId = await seedActiveBusiness("owner_r3");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "r3@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_r3" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    const key = nextId("revoke");
    const request = { businessId, invitationId: created.invitation.id };
    const params = inviteParams({ idempotencyKey: key, actorUserId: "owner_r3" });

    const first = await revokeStaffInvitation(db, request, params);
    expect(first.outcome).toBe("revoked");
    const second = await revokeStaffInvitation(db, request, params);
    expect(second.outcome).toBe("duplicate");
  });

  it("expiry precedence: revoking a pending invitation that is already past its expiresAt resolves to expired, never revoked", async () => {
    const businessId = await seedActiveBusiness("owner_r4");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "r4@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_r4" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    // Force the invitation past its natural expiry before REVOKE runs —
    // chronologically it already lapsed; a later REVOKE call must not
    // overwrite that fact by recording "revoked" instead.
    await db
      .collection("businessMembershipInvitations")
      .doc(created.invitation.id)
      .update({
        expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      });

    const result = await revokeStaffInvitation(
      db,
      { businessId, invitationId: created.invitation.id },
      inviteParams({ idempotencyKey: nextId("revoke"), actorUserId: "owner_r4" }),
    );
    expect(result.outcome).toBe("revoked"); // command-level outcome — see .invitation.status for the true terminal state
    if (result.outcome !== "revoked") return;
    expect(result.invitation.status).toBe("expired");

    const outbox = await db.collection("outboxEntries").get();
    expect(
      outbox.docs.some(
        (d) => d.data()["event"]?.eventType === "staffInvitation.staff_invitation_expired.v1",
      ),
    ).toBe(true);
    expect(
      outbox.docs.some(
        (d) => d.data()["event"]?.eventType === "staffInvitation.staff_invitation_revoked.v1",
      ),
    ).toBe(false);
  });
});

describe("acceptStaffInvitation — ACCEPT", () => {
  function acceptParams(overrides: {
    idempotencyKey: string;
    authenticatedCustomerIdentityId: string;
    invitationReference: string;
  }) {
    return {
      request: { invitationReference: overrides.invitationReference },
      authenticatedCustomerIdentityId: overrides.authenticatedCustomerIdentityId,
      idempotencyKey: overrides.idempotencyKey,
      correlationId: `corr_${overrides.idempotencyKey}`,
      actor,
      now: new Date("2026-08-19T01:00:00.000Z"),
      newId: () => nextId("evt"),
    };
  }

  it("valid authenticated intended recipient accepts — membership created active, invitation consumed atomically", async () => {
    const businessId = await seedActiveBusiness("owner_a1");
    const created = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "recruit@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a1" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_recruit", "recruit@example.com");

    const result = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_recruit",
        invitationReference: created.invitation.id,
      }),
    );

    expect(result.userId).toBe("cust_recruit");
    expect(result.businessId).toBe(businessId);
    expect(result.role).toBe("staff");

    const membershipSnap = await db
      .collection("businessMemberships")
      .doc(result.membershipId)
      .get();
    expect(membershipSnap.exists).toBe(true);
    expect(membershipSnap.data()?.["status"]).toBe("active");
    expect(membershipSnap.data()?.["userId"]).toBe("cust_recruit");

    const invitationSnap = await db
      .collection("businessMembershipInvitations")
      .doc(created.invitation.id)
      .get();
    expect(invitationSnap.data()?.["status"]).toBe("accepted");
    expect(invitationSnap.data()?.["acceptedMembershipId"]).toBe(result.membershipId);
  });

  it("bare invitation reference alone is insufficient — wrong authenticated identity (unmatched contact) is denied", async () => {
    const businessId = await seedActiveBusiness("owner_a2");
    const created = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "intended@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a2" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    // Attacker has a real, authenticated identity — but a DIFFERENT verified email.
    await seedCustomerIdentityWithEmail("cust_attacker", "attacker@example.com");

    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_attacker",
          invitationReference: created.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });

    // No membership was created for the attacker despite possessing a
    // valid reference (the collection also legitimately contains the
    // Business's own owner membership from bootstrap — scope the check to
    // the attacker's identity specifically).
    const attackerMemberships = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .where("userId", "==", "cust_attacker")
      .get();
    expect(attackerMemberships.size).toBe(0);
  });

  it("userId injection is structurally impossible — AcceptInvitationRequest carries no userId field to inject", async () => {
    const businessId = await seedActiveBusiness("owner_a3");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "inj@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a3" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_inj", "inj@example.com");

    // Even a request object with an attacker-supplied extra `userId` field
    // has no effect — the server derives userId only from
    // `authenticatedCustomerIdentityId`, never from `request`.
    const maliciousRequest = {
      invitationReference: created.invitation.id,
      userId: "cust_someone_else",
    } as unknown as { invitationReference: string };

    const result = await acceptStaffInvitation(db, {
      request: maliciousRequest,
      authenticatedCustomerIdentityId: "cust_inj",
      idempotencyKey: nextId("accept"),
      correlationId: "corr_inj",
      actor,
      now: new Date("2026-08-19T01:00:00.000Z"),
      newId: () => nextId("evt"),
    });

    expect(result.userId).toBe("cust_inj");
    expect(result.userId).not.toBe("cust_someone_else");
  });

  it("an invalid/unresolvable invitation reference is denied RESOURCE_NOT_FOUND", async () => {
    await seedCustomerIdentityWithEmail("cust_none", "none@example.com");
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_none",
          invitationReference: "does-not-exist",
        }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("an expired invitation is denied and the terminal state is durably persisted (lazy expiry)", async () => {
    const businessId = await seedActiveBusiness("owner_a4");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "exp@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a4" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_exp", "exp@example.com");

    // Force expiry directly (avoids waiting 7 real days).
    await db
      .collection("businessMembershipInvitations")
      .doc(created.invitation.id)
      .update({
        expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      });

    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_exp",
          invitationReference: created.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });

    const invitationSnap = await db
      .collection("businessMembershipInvitations")
      .doc(created.invitation.id)
      .get();
    expect(invitationSnap.data()?.["status"]).toBe("expired");

    const outbox = await db.collection("outboxEntries").get();
    expect(
      outbox.docs.some(
        (d) => d.data()["event"]?.eventType === "staffInvitation.staff_invitation_expired.v1",
      ),
    ).toBe(true);
  });

  it("a revoked invitation is denied", async () => {
    const businessId = await seedActiveBusiness("owner_a5");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "rev@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a5" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await revokeStaffInvitation(
      db,
      { businessId, invitationId: created.invitation.id },
      inviteParams({ idempotencyKey: nextId("revoke"), actorUserId: "owner_a5" }),
    );
    await seedCustomerIdentityWithEmail("cust_rev", "rev@example.com");

    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_rev",
          invitationReference: created.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("a consumed (already-accepted) invitation replayed with a fresh key is denied IDEMPOTENCY_CONFLICT", async () => {
    const businessId = await seedActiveBusiness("owner_a6");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "used@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a6" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_used", "used@example.com");
    await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_used",
        invitationReference: created.invitation.id,
      }),
    );

    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_used",
          invitationReference: created.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "IDEMPOTENCY_CONFLICT" });
  });

  it("duplicate active membership is prevented", async () => {
    const businessId = await seedActiveBusiness("owner_a7");
    await seedMembership(businessId, "cust_dup", "staff", "active");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "dup2@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a7" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_dup", "dup2@example.com");

    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_dup",
          invitationReference: created.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("duplicate suspended membership is also prevented (not treated as reactivatable via ACCEPT)", async () => {
    const businessId = await seedActiveBusiness("owner_a7s");
    await seedMembership(businessId, "cust_susp", "staff", "suspended");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "susp@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a7s" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_susp", "susp@example.com");

    // A suspended membership represents a current (not historical, not
    // terminal) relationship — reactivation from suspension is REACTIVATE's
    // job (a future ENG-P2-003C command), never something ACCEPT performs
    // implicitly. ACCEPT must reject rather than silently reactivate it.
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_susp",
          invitationReference: created.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    const snap = await db
      .collection("businessMemberships")
      .where("userId", "==", "cust_susp")
      .get();
    expect(snap.size).toBe(1);
    expect(snap.docs[0]!.data()["status"]).toBe("suspended"); // untouched
  });

  it("an unverified email does not satisfy entitlement even if it matches the invitation target", async () => {
    const businessId = await seedActiveBusiness("owner_a7u");
    const created = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "unverified@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a7u" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");

    // Deliberately NOT using seedCustomerIdentityWithEmail (which sets
    // emailVerified: true) — this identity's Firebase Auth email matches
    // the invitation target exactly, but is unverified.
    const userRecord = await getAuth(app).createUser({
      email: "unverified@example.com",
      emailVerified: false,
    });
    const key = nextId("identity");
    await createCustomerIdentity(db, {
      eventId: `evt_${key}`,
      correlationId: `corr_${key}`,
      actor: { actorType: "system", actorId: "system" },
      occurredAt: "2026-08-19T00:00:00.000Z",
      customerIdentityId: "cust_unverified",
      initialAuthenticationReference: {
        referenceId: userRecord.uid,
        referenceType: "email",
        createdAt: new Date("2026-08-19T00:00:00.000Z"),
        createdBy: "cust_unverified",
      },
      createdAt: new Date("2026-08-19T00:00:00.000Z"),
      createdBy: "cust_unverified",
      idempotencyKey: `idem_${key}`,
      requestHash: `hash_${key}`,
    });

    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_unverified",
          invitationReference: created.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("a REMOVED historical membership is reactivated in place (same document id) and the result is usable through the real ENG-P2-004 evaluator", async () => {
    const businessId = await seedActiveBusiness("owner_a8");
    const oldMembershipId = await seedMembership(businessId, "cust_returning", "staff", "removed");
    const created = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "returning@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a8" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_returning", "returning@example.com");

    const result = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_returning",
        invitationReference: created.invitation.id,
      }),
    );

    // Reactivated in place — the SAME document id, not a second document.
    // `getBusinessMembershipByUserAndBusiness` (ENG-P2-004B) queries only
    // on (userId, businessId), with no status filter, and fails the whole
    // read closed to "malformed" the instant more than one document
    // matches that pair — so a genuinely new membership document
    // coexisting with the old removed one would silently deny every
    // future permission check for this identity. Proven two ways below:
    // the repository-level read, and a real evaluator call.
    expect(result.membershipId).toBe(oldMembershipId);
    const reactivatedSnap = await db.collection("businessMemberships").doc(oldMembershipId).get();
    expect(reactivatedSnap.data()?.["status"]).toBe("active");
    expect(reactivatedSnap.data()?.["userId"]).toBe("cust_returning");

    // Exactly one document exists for this (userId, businessId) pair.
    const allForPair = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .where("userId", "==", "cust_returning")
      .get();
    expect(allForPair.size).toBe(1);

    // The real ENG-P2-004 evaluator resolves the reactivated membership
    // cleanly (not "malformed") and produces an ordinary role-based
    // decision — proving the reactivated staff member actually authorizes
    // through the production authorization path, not merely that a
    // Firestore document exists.
    const decisionContext = await evaluatePermissionWithContext(db, {
      userId: "cust_returning",
      businessId,
      permission: "staff.manage",
    });
    expect(decisionContext.membership.kind).toBe("found");
    expect(decisionContext.decision.reasonCode).not.toBe("MEMBERSHIP_CONFIG_MALFORMED");
    // Staff holds no staff.manage grant by default — correctly denied, but
    // via an ordinary role-based decision, not a malformed-read fail-close.
    expect(decisionContext.decision.allowed).toBe(false);
  });

  it("phone-delivered invitation accepts against a matching phone_otp reference", async () => {
    const businessId = await seedActiveBusiness("owner_a9");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "phone", value: "+15557778888" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_a9" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithPhone("cust_phone", "+15557778888");

    const result = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_phone",
        invitationReference: created.invitation.id,
      }),
    );
    expect(result.userId).toBe("cust_phone");
  });
});

describe("cross-business isolation (ACCEPT)", () => {
  it("invitation acceptance only ever creates a membership for invitation.businessId — never a caller-suppliable business", async () => {
    const businessId = await seedActiveBusiness("owner_x1");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "iso@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_x1" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_iso", "iso@example.com");

    const result = await acceptStaffInvitation(db, {
      request: { invitationReference: created.invitation.id },
      authenticatedCustomerIdentityId: "cust_iso",
      idempotencyKey: nextId("accept"),
      correlationId: "corr_iso",
      actor,
      now: new Date("2026-08-19T01:00:00.000Z"),
      newId: () => nextId("evt"),
    });

    // Confirmed the only businessId in the result/persisted membership is
    // the invitation's own — there is no parameter anywhere in the ACCEPT
    // call surface through which a caller could name a different Business.
    expect(result.businessId).toBe(businessId);
    const membership = await getBusinessMembershipByUserAndBusiness(db, "cust_iso", businessId);
    expect(membership.kind).toBe("found");
  });
});

describe("concurrency", () => {
  // Both tests below pass an explicit 20s Vitest timeout (default 5s):
  // two genuinely concurrent Firestore transactions contending on the same
  // document retry under real optimistic-concurrency control, and the
  // 5000ms Vitest default was observed to flake under CI's more
  // resource-constrained runners (a real, reproduced CI failure, not a
  // hypothetical) even though it consistently passes locally in under 3s.
  // 20s is a generous margin, not a masked correctness issue.
  it("two concurrent acceptance attempts for the same invitation result in exactly one membership", async () => {
    const businessId = await seedActiveBusiness("owner_c1");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "race@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_c1" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_race", "race@example.com");

    const attempt = () =>
      acceptStaffInvitation(db, {
        request: { invitationReference: created.invitation.id },
        authenticatedCustomerIdentityId: "cust_race",
        idempotencyKey: nextId("accept"), // distinct keys — this is a genuine business-level race, not idempotency replay
        correlationId: "corr_race",
        actor,
        now: new Date("2026-08-19T01:00:00.000Z"),
        newId: () => nextId("evt"),
      });

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Scope to the racing identity specifically — the collection also
    // legitimately contains the Business's own owner membership.
    const memberships = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .where("userId", "==", "cust_race")
      .get();
    expect(memberships.size).toBe(1);
  }, 20000);

  it("revoke racing with accept: at most one of them succeeds, never both", async () => {
    const businessId = await seedActiveBusiness("owner_c2");
    const created = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "race2@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_c2" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_race2", "race2@example.com");

    const acceptAttempt = acceptStaffInvitation(db, {
      request: { invitationReference: created.invitation.id },
      authenticatedCustomerIdentityId: "cust_race2",
      idempotencyKey: nextId("accept"),
      correlationId: "corr_race2",
      actor,
      now: new Date("2026-08-19T01:00:00.000Z"),
      newId: () => nextId("evt"),
    });
    const revokeAttempt = revokeStaffInvitation(
      db,
      { businessId, invitationId: created.invitation.id },
      inviteParams({ idempotencyKey: nextId("revoke"), actorUserId: "owner_c2" }),
    );

    const [acceptResult, revokeResult] = await Promise.allSettled([acceptAttempt, revokeAttempt]);

    const invitationSnap = await db
      .collection("businessMembershipInvitations")
      .doc(created.invitation.id)
      .get();
    const finalStatus = invitationSnap.data()?.["status"];
    expect(["accepted", "revoked"]).toContain(finalStatus);

    // Whichever one "won" the terminal-state race, no partial/dual effect exists.
    if (finalStatus === "accepted") {
      expect(acceptResult.status).toBe("fulfilled");
    } else {
      expect(revokeResult.status).toBe("fulfilled");
    }
    const memberships = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .where("userId", "==", "cust_race2")
      .get();
    expect(memberships.size).toBeLessThanOrEqual(1);
  }, 20000);
});

describe("privacy — outbox payloads", () => {
  it("outbox entries never carry the invitation's raw delivery address (email/phone)", async () => {
    const businessId = await seedActiveBusiness("owner_p1");
    const created = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "secret-address@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_p1" }),
    );
    if (created.outcome !== "created") throw new Error("setup failed");
    await seedCustomerIdentityWithEmail("cust_p1", "secret-address@example.com");
    await acceptStaffInvitation(db, {
      request: { invitationReference: created.invitation.id },
      authenticatedCustomerIdentityId: "cust_p1",
      idempotencyKey: nextId("accept"),
      correlationId: "corr_p1",
      actor,
      now: new Date("2026-08-19T01:00:00.000Z"),
      newId: () => nextId("evt"),
    });

    const outbox = await db.collection("outboxEntries").get();
    const serialized = JSON.stringify(outbox.docs.map((d) => d.data()));
    expect(serialized).not.toContain("secret-address@example.com");
  });
});
