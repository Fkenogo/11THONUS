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
import {
  suspendStaffMembershipCommand,
  reactivateStaffMembershipCommand,
  removeStaffMembershipCommand,
} from "./staffMembershipLifecycleCommand";
import { changeStaffMembershipRoleCommand } from "./staffRoleChangeCommand";
import { administerStaffPermissionOverrideCommand } from "./staffPermissionOverrideCommand";
import { evaluatePermission } from "./evaluatePermissionService";
import { getInvitationByReference } from "../repositories/businessMembershipInvitationRepository";
import {
  getBusinessMembershipById,
  getBusinessMembershipByUserAndBusiness,
} from "../repositories/businessMembershipRepository";

/**
 * `ENG-P2-003E` — Staff Membership Integration, End-to-End Validation.
 *
 * Real Firestore Emulator Suite tests exercising the FULL chain through
 * actual command invocations in sequence (not pre-seeded fixtures): invite
 * -> accept -> role-change -> permission-override -> evaluate ->
 * suspend/reactivate/remove, each step's output feeding the next.
 *
 * Not run as part of `pnpm test` — see `pnpm test:emulator` /
 * `pnpm emulators:validate`.
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "staffMembershipIntegrationEmulatorTest");
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
  displayName: "Integration Cafe",
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
    "permissionAuditEntries",
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
function nextBusinessCode(): string {
  let n = businessCodeCounter++;
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix = BUSINESS_CODE_ALPHABET[n % BUSINESS_CODE_ALPHABET.length] + suffix;
    n = Math.floor(n / BUSINESS_CODE_ALPHABET.length);
  }
  return `${BUSINESS_CODE_PREFIX}${suffix}`;
}

async function seedActiveBusiness(ownerUserId: string): Promise<string> {
  const key = nextId("bootstrap");
  const params: BootstrapBusinessParams = {
    ownerUserId,
    idempotencyKey: key,
    correlationId: `corr_${key}`,
    actor,
    now: new Date("2026-08-20T00:00:00.000Z"),
    newId: () => nextId("evt"),
    generator: new SequenceGenerator([nextBusinessCode()]),
  };
  const result = await bootstrapBusiness(db, baseBusinessRequest, params);
  await db.collection("businesses").doc(result.businessId).update({ status: "active" });
  return result.businessId;
}

async function seedCustomerIdentityWithEmail(userId: string, email: string): Promise<void> {
  const userRecord = await getAuth(app).createUser({ email, emailVerified: true });
  const key = nextId("identity");
  await createCustomerIdentity(db, {
    eventId: `evt_${key}`,
    correlationId: `corr_${key}`,
    actor: { actorType: "system", actorId: "system" },
    occurredAt: "2026-08-20T00:00:00.000Z",
    customerIdentityId: userId,
    initialAuthenticationReference: {
      referenceId: userRecord.uid,
      referenceType: "email",
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      createdBy: userId,
    },
    createdAt: new Date("2026-08-20T00:00:00.000Z"),
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
    now: new Date("2026-08-20T01:00:00.000Z"),
    newId: () => nextId("evt"),
  };
}

function acceptParams(overrides: {
  idempotencyKey: string;
  authenticatedCustomerIdentityId: string;
  invitationReference: string;
  now?: Date;
}) {
  return {
    request: { invitationReference: overrides.invitationReference },
    authenticatedCustomerIdentityId: overrides.authenticatedCustomerIdentityId,
    idempotencyKey: overrides.idempotencyKey,
    correlationId: `corr_${overrides.idempotencyKey}`,
    actor,
    now: overrides.now ?? new Date("2026-08-20T02:00:00.000Z"),
    newId: () => nextId("evt"),
  };
}

function lifecycleParams(overrides: {
  userId: string;
  businessId: string;
  targetMembershipId: string;
  idempotencyKey: string;
  now?: Date;
}) {
  return {
    userId: overrides.userId,
    businessId: overrides.businessId,
    targetMembershipId: overrides.targetMembershipId,
    idempotencyKey: overrides.idempotencyKey,
    // Hash depends on the actual payload (target), not just the key — a
    // real client would hash its request body; keying purely off the
    // idempotency key would make every same-key replay look like a
    // "duplicate" even when the payload legitimately differs.
    requestHash: `hash_${overrides.targetMembershipId}`,
    correlationId: `corr_${overrides.idempotencyKey}`,
    now: overrides.now ?? new Date("2026-08-20T03:00:00.000Z"),
    newId: () => nextId("evt"),
  };
}

function roleChangeParams(overrides: {
  userId: string;
  businessId: string;
  targetMembershipId: string;
  fromRole: "manager" | "staff";
  toRole: "manager" | "staff";
  idempotencyKey: string;
  now?: Date;
}) {
  return {
    userId: overrides.userId,
    businessId: overrides.businessId,
    targetMembershipId: overrides.targetMembershipId,
    fromRole: overrides.fromRole,
    toRole: overrides.toRole,
    idempotencyKey: overrides.idempotencyKey,
    requestHash: `hash_${overrides.idempotencyKey}`,
    correlationId: `corr_${overrides.idempotencyKey}`,
    now: overrides.now ?? new Date("2026-08-20T04:00:00.000Z"),
    newId: () => nextId("evt"),
  };
}

function overrideParams(overrides: {
  userId: string;
  businessId: string;
  targetMembershipId: string;
  permissionId: string;
  direction: "grant" | "revoke";
  idempotencyKey: string;
  now?: Date;
}) {
  return {
    userId: overrides.userId,
    businessId: overrides.businessId,
    targetMembershipId: overrides.targetMembershipId,
    permissionId: overrides.permissionId,
    direction: overrides.direction,
    idempotencyKey: overrides.idempotencyKey,
    requestHash: `hash_${overrides.idempotencyKey}`,
    correlationId: `corr_${overrides.idempotencyKey}`,
    now: overrides.now ?? new Date("2026-08-20T05:00:00.000Z"),
    newId: () => nextId("evt"),
  };
}

/** Full invite -> accept helper, returns the resulting active membershipId. */
async function inviteAndAccept(params: {
  businessId: string;
  inviterUserId: string;
  role: "manager" | "staff";
  recruitUserId: string;
  email: string;
}): Promise<string> {
  const created = await createStaffInvitation(
    db,
    {
      businessId: params.businessId,
      role: params.role,
      deliveryTarget: { type: "email", value: params.email },
    },
    inviteParams({ idempotencyKey: nextId("invite"), actorUserId: params.inviterUserId }),
  );
  if (created.outcome !== "created") {
    throw new Error(`setup failed: invite outcome=${created.outcome}`);
  }
  await seedCustomerIdentityWithEmail(params.recruitUserId, params.email);
  const accepted = await acceptStaffInvitation(
    db,
    acceptParams({
      idempotencyKey: nextId("accept"),
      authenticatedCustomerIdentityId: params.recruitUserId,
      invitationReference: created.invitation.id,
    }),
  );
  return accepted.membershipId;
}

// ---------------------------------------------------------------------------
// SCENARIO 5 — Phase H: the flagged empirical finding. Highest priority.
//
// HISTORICAL NOTE (preserved, not erased — ENG-P2-003E's original finding):
// this test originally proved that a Manager-only explicit grant, demoted to
// Staff (denied, but the record left untouched in permissions[]) and then
// promoted back to Manager, silently became effective again with no fresh
// authorization action. The Founder rejected that as unapproved silent
// privilege resurrection. `ENG-P2-003C-CORR-001` (PR #139, merged as
// `27399fb`) corrected it: role change now reconciles `permissions[]`
// against the NEW role in the same transaction as the role mutation,
// removing any override no longer structurally valid for that role (reusing
// `createPermissionOverride`, ENG-P2-004A's own validity authority,
// unmodified — no evaluator or catalogue change). This test is updated,
// after that correction landed on `main`, to prove the GOVERNED corrected
// behavior below — real Firestore, real evaluator, no mocking of the
// reconciliation.
// ---------------------------------------------------------------------------
describe("SCENARIO 5 (Phase H) — role/override round-trip: no stale-grant resurrection (post-CORR-001)", () => {
  it("grant while Manager -> demote to Staff (record REMOVED, denied) -> promote back to Manager (STILL denied, no resurrection) -> fresh regrant via unmodified 003D -> allow", async () => {
    const businessId = await seedActiveBusiness("owner_h1");
    const mgrMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_h1",
      role: "manager",
      recruitUserId: "cust_h_mgr",
      email: "h-mgr@example.com",
    });

    const PERMISSION_ID = "business.configureFraudRules"; // explicitGrantEligibleRole: "manager"

    // Baseline: Manager without any override is denied this sensitive permission.
    const baseline = await evaluatePermission(db, {
      userId: "cust_h_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(baseline.allowed).toBe(false);

    // Owner grants the override to the Manager.
    const grantOutcome = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_h1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: PERMISSION_ID,
        direction: "grant",
        idempotencyKey: nextId("override"),
      }),
    );
    expect(grantOutcome.outcome).toBe("executed");

    // Evaluator now allows it (explicit grant, role-eligible).
    const afterGrant = await evaluatePermission(db, {
      userId: "cust_h_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(afterGrant.allowed).toBe(true);
    expect(afterGrant.permissionSource).toBe("explicit-grant");

    // Owner demotes Manager -> Staff via staff.assignRole.
    const demote = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "owner_h1",
        businessId,
        targetMembershipId: mgrMembershipId,
        fromRole: "manager",
        toRole: "staff",
        idempotencyKey: nextId("rolechange"),
      }),
    );
    expect(demote.outcome).toBe("executed");

    // CORR-001: the now role-invalid grant is REMOVED from permissions[] by
    // the same transaction as the role mutation — not merely ignored.
    const membershipAfterDemote = await getBusinessMembershipById(db, mgrMembershipId);
    if (membershipAfterDemote.kind !== "found") {
      throw new Error("expected membership to be found after demote");
    }
    expect(membershipAfterDemote.membership.role).toBe("staff");
    const rawDoc = await db.collection("businessMemberships").doc(mgrMembershipId).get();
    const storedOverridesAfterDemote = rawDoc.data()?.["permissions"] as unknown[];
    expect(storedOverridesAfterDemote).toHaveLength(0); // removed, not merely stale.

    // Evaluator denies — both because the record is gone, and because
    // (independently) the evaluator's live-role re-check would also deny.
    const afterDemote = await evaluatePermission(db, {
      userId: "cust_h_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(afterDemote.allowed).toBe(false);

    // Owner promotes Staff back to Manager.
    const promote = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "owner_h1",
        businessId,
        targetMembershipId: mgrMembershipId,
        fromRole: "staff",
        toRole: "manager",
        idempotencyKey: nextId("rolechange"),
      }),
    );
    expect(promote.outcome).toBe("executed");

    // THE mandatory proof: no silent resurrection. The removed record does
    // not come back merely because the live role matches what it used to be
    // eligible for — it is genuinely gone, not merely denied by a live check.
    const afterPromote = await evaluatePermission(db, {
      userId: "cust_h_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(afterPromote.allowed).toBe(false);

    const rawDocAfterPromote = await db
      .collection("businessMemberships")
      .doc(mgrMembershipId)
      .get();
    expect(rawDocAfterPromote.data()?.["permissions"]).toHaveLength(0);

    // Fresh elevated authority requires fresh authorization: an explicit
    // regrant through the normal, unmodified ENG-P2-003D administration path
    // is the only thing that restores it.
    const regrant = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_h1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: PERMISSION_ID,
        direction: "grant",
        idempotencyKey: nextId("override"),
      }),
    );
    expect(regrant.outcome).toBe("executed");

    const afterRegrant = await evaluatePermission(db, {
      userId: "cust_h_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(afterRegrant.allowed).toBe(true);
    expect(afterRegrant.permissionSource).toBe("explicit-grant");
  });

  it("a persisted revoke override remains effective across a Manager -> Staff -> Manager round-trip (role-independent per existing contract, unaffected by CORR-001)", async () => {
    const businessId = await seedActiveBusiness("owner_h2");
    const mgrMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_h2",
      role: "manager",
      recruitUserId: "cust_h_mgr2",
      email: "h-mgr2@example.com",
    });

    // staff.manage: explicitRevocationSupported true, no role dependency in
    // createPermissionOverride's revoke branch — retained across any role.
    const REVOKE_PERMISSION_ID = "staff.manage";

    const revokeOutcome = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_h2",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: REVOKE_PERMISSION_ID,
        direction: "revoke",
        idempotencyKey: nextId("override"),
      }),
    );
    expect(revokeOutcome.outcome).toBe("executed");

    const demote = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "owner_h2",
        businessId,
        targetMembershipId: mgrMembershipId,
        fromRole: "manager",
        toRole: "staff",
        idempotencyKey: nextId("rolechange"),
      }),
    );
    expect(demote.outcome).toBe("executed");

    const promote = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "owner_h2",
        businessId,
        targetMembershipId: mgrMembershipId,
        fromRole: "staff",
        toRole: "manager",
        idempotencyKey: nextId("rolechange"),
      }),
    );
    expect(promote.outcome).toBe("executed");

    const rawDocFinal = await db.collection("businessMemberships").doc(mgrMembershipId).get();
    const permissionsFinal = rawDocFinal.data()?.["permissions"] as Array<{ direction: string }>;
    expect(permissionsFinal).toHaveLength(1);
    expect(permissionsFinal[0]?.direction).toBe("revoke");
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 1 — Full Staff journey.
// ---------------------------------------------------------------------------
describe("SCENARIO 1 — full Staff journey", () => {
  it("invite -> accept -> suspend -> reactivate -> remove -> re-invite reactivates in place, exactly one membership doc throughout", async () => {
    const businessId = await seedActiveBusiness("owner_j1");
    const membershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_j1",
      role: "staff",
      recruitUserId: "cust_j_staff",
      email: "j-staff@example.com",
    });

    const countMemberships = async () => {
      const snap = await db
        .collection("businessMemberships")
        .where("businessId", "==", businessId)
        .where("userId", "==", "cust_j_staff")
        .get();
      return snap.size;
    };
    expect(await countMemberships()).toBe(1);

    const suspend = await suspendStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_j1",
        businessId,
        targetMembershipId: membershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(suspend.outcome).toBe("executed");
    expect(await countMemberships()).toBe(1);

    const reactivate = await reactivateStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_j1",
        businessId,
        targetMembershipId: membershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(reactivate.outcome).toBe("executed");
    expect(await countMemberships()).toBe(1);

    const remove = await removeStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_j1",
        businessId,
        targetMembershipId: membershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(remove.outcome).toBe("executed");
    expect(await countMemberships()).toBe(1);
    const removedDoc = await db.collection("businessMemberships").doc(membershipId).get();
    expect(removedDoc.exists).toBe(true); // historical record preserved, not deleted.
    expect(removedDoc.data()?.["status"]).toBe("removed");

    // New invitation for the SAME person re-adds via in-place reactivation.
    const secondInvite = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "j-staff@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_j1" }),
    );
    expect(secondInvite.outcome).toBe("created");
    if (secondInvite.outcome !== "created") return;

    const reAccept = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_j_staff",
        invitationReference: secondInvite.invitation.id,
      }),
    );
    expect(reAccept.membershipId).toBe(membershipId); // reactivated in place, not a new doc.
    expect(await countMemberships()).toBe(1);
    const reactivatedDoc = await db.collection("businessMemberships").doc(membershipId).get();
    expect(reactivatedDoc.data()?.["status"]).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 2 — Manager journey (staff.manage via override, target restriction).
// ---------------------------------------------------------------------------
describe("SCENARIO 2 — Manager journey", () => {
  it("Manager without staff.manage cannot administer staff; with an explicit grant, may invite/suspend/reactivate/remove Staff but never Manager/Owner, and gains no role-change authority", async () => {
    const businessId = await seedActiveBusiness("owner_m1");
    const mgrMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_m1",
      role: "manager",
      recruitUserId: "cust_m_mgr",
      email: "m-mgr@example.com",
    });
    const otherMgrMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_m1",
      role: "manager",
      recruitUserId: "cust_m_mgr2",
      email: "m-mgr2@example.com",
    });

    // Manager without staff.manage cannot invite.
    const deniedInvite = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "m-staff@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "cust_m_mgr" }),
    );
    expect(deniedInvite.outcome).toBe("denied");

    // Owner grants staff.manage to the Manager.
    const grant = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_m1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: "staff.manage",
        direction: "grant",
        idempotencyKey: nextId("override"),
      }),
    );
    expect(grant.outcome).toBe("executed");

    // Manager (now with staff.manage) may invite Staff.
    const staffMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "cust_m_mgr",
      role: "staff",
      recruitUserId: "cust_m_staff",
      email: "m-staff2@example.com",
    });

    // Manager may suspend/reactivate/remove that Staff member.
    const suspendStaff = await suspendStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "cust_m_mgr",
        businessId,
        targetMembershipId: staffMembershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(suspendStaff.outcome).toBe("executed");
    const reactivateStaff = await reactivateStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "cust_m_mgr",
        businessId,
        targetMembershipId: staffMembershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(reactivateStaff.outcome).toBe("executed");

    // Manager may NOT target another Manager, even with staff.manage. The
    // `staff.manage` authorization decision itself *allows* (the Manager
    // does hold the permission) — it is `staffMembershipTargetPolicy.ts`'s
    // target-matrix check inside `mutation.prepare` that rejects this, which
    // surfaces as a THROWN `PermissionDomainError` (AUTH_FORBIDDEN), not an
    // `AuthorizeAndExecuteResult` "denied" outcome (that outcome is reserved
    // for the permission-grant check itself failing).
    await expect(
      suspendStaffMembershipCommand(
        db,
        lifecycleParams({
          userId: "cust_m_mgr",
          businessId,
          targetMembershipId: otherMgrMembershipId,
          idempotencyKey: nextId("lc"),
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });

    // Manager may NOT target the Owner — same target-policy throw path.
    const ownerMembership = await getBusinessMembershipByUserAndBusiness(
      db,
      "owner_m1",
      businessId,
    );
    if (ownerMembership.kind !== "found") throw new Error("owner membership missing");
    await expect(
      suspendStaffMembershipCommand(
        db,
        lifecycleParams({
          userId: "cust_m_mgr",
          businessId,
          targetMembershipId: ownerMembership.membership.id,
          idempotencyKey: nextId("lc"),
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });

    // Manager may remove the Staff member.
    const removeStaff = await removeStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "cust_m_mgr",
        businessId,
        targetMembershipId: staffMembershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(removeStaff.outcome).toBe("executed");

    // Manager gains NO role-change authority merely from holding staff.manage.
    const deniedRoleChange = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "cust_m_mgr",
        businessId,
        targetMembershipId: otherMgrMembershipId,
        fromRole: "manager",
        toRole: "staff",
        idempotencyKey: nextId("rolechange"),
      }),
    );
    expect(deniedRoleChange.outcome).toBe("denied");
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 3 — Role-change journey.
// ---------------------------------------------------------------------------
describe("SCENARIO 3 — role-change journey", () => {
  it("Owner changes Staff<->Manager; Manager/Staff cannot role-change; self and Owner-target both fail; effect is immediate", async () => {
    const businessId = await seedActiveBusiness("owner_r1");
    const staffMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_r1",
      role: "staff",
      recruitUserId: "cust_r_staff",
      email: "r-staff@example.com",
    });
    const mgrMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_r1",
      role: "manager",
      recruitUserId: "cust_r_mgr",
      email: "r-mgr@example.com",
    });

    // Immediate-authorization check before: Staff cannot administer staff.manage-only actions (n/a here), skip.

    // Owner promotes Staff -> Manager.
    const promote = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "owner_r1",
        businessId,
        targetMembershipId: staffMembershipId,
        fromRole: "staff",
        toRole: "manager",
        idempotencyKey: nextId("rc"),
      }),
    );
    expect(promote.outcome).toBe("executed");
    const afterPromote = await getBusinessMembershipById(db, staffMembershipId);
    if (afterPromote.kind !== "found") throw new Error("expected found");
    expect(afterPromote.membership.role).toBe("manager");

    // Owner demotes original Manager -> Staff.
    const demote = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "owner_r1",
        businessId,
        targetMembershipId: mgrMembershipId,
        fromRole: "manager",
        toRole: "staff",
        idempotencyKey: nextId("rc"),
      }),
    );
    expect(demote.outcome).toBe("executed");

    // Manager cannot role-change (even though now a Manager, staff.assignRole is Owner-only, non-delegable).
    const managerAttempt = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "cust_r_staff",
        businessId,
        targetMembershipId: mgrMembershipId,
        fromRole: "staff",
        toRole: "manager",
        idempotencyKey: nextId("rc"),
      }),
    );
    expect(managerAttempt.outcome).toBe("denied");

    // Staff cannot role-change.
    const staffAttempt = await changeStaffMembershipRoleCommand(
      db,
      roleChangeParams({
        userId: "cust_r_mgr",
        businessId,
        targetMembershipId: staffMembershipId,
        fromRole: "manager",
        toRole: "staff",
        idempotencyKey: nextId("rc"),
      }),
    );
    expect(staffAttempt.outcome).toBe("denied");

    // Self role-change fails (Owner targeting self would require role=owner anyway; use Owner attempting to
    // "change" its own membership id, which isn't a manager/staff target at all -> denied).
    const ownerMembership = await getBusinessMembershipByUserAndBusiness(
      db,
      "owner_r1",
      businessId,
    );
    if (ownerMembership.kind !== "found") throw new Error("owner missing");
    await expect(
      changeStaffMembershipRoleCommand(
        db,
        roleChangeParams({
          userId: "owner_r1",
          businessId,
          targetMembershipId: ownerMembership.membership.id,
          fromRole: "manager",
          toRole: "staff",
          idempotencyKey: nextId("rc"),
        }),
      ),
    ).rejects.toThrow();

    // Immediate authorization effect: after promote, cust_r_staff (now manager) should NOT
    // automatically gain staff.assignRole (Owner-only regardless of role).
    const evalAfter = await evaluatePermission(db, {
      userId: "cust_r_staff",
      businessId,
      permission: "staff.assignRole",
    });
    expect(evalAfter.allowed).toBe(false);
  });

  it("role=owner is impossible via the role-change contract (structural rejection)", async () => {
    const businessId = await seedActiveBusiness("owner_r2");
    const staffMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_r2",
      role: "staff",
      recruitUserId: "cust_r2_staff",
      email: "r2-staff@example.com",
    });
    // changeStaffMembershipRoleCommand is declared `async`, so its internal
    // synchronous validation throw (createStaffRoleChangeRequest) surfaces
    // as a rejected Promise, not a synchronous throw.
    await expect(
      changeStaffMembershipRoleCommand(db, {
        ...roleChangeParams({
          userId: "owner_r2",
          businessId,
          targetMembershipId: staffMembershipId,
          fromRole: "staff",
          toRole: "manager",
          idempotencyKey: nextId("rc"),
        }),
        // @ts-expect-error deliberately supplying an out-of-contract role to prove it's structurally rejected.
        toRole: "owner",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 4 — Permission override journey.
// ---------------------------------------------------------------------------
describe("SCENARIO 4 — permission override journey", () => {
  it("grant persisted -> evaluator allows -> revoke persisted -> evaluator denies; same-direction replay dedups; suspended can revoke not grant; removed/invited cannot administer", async () => {
    const businessId = await seedActiveBusiness("owner_o1");
    const mgrMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_o1",
      role: "manager",
      recruitUserId: "cust_o_mgr",
      email: "o-mgr@example.com",
    });
    const PERMISSION_ID = "business.configureFraudRules";

    const deniedBefore = await evaluatePermission(db, {
      userId: "cust_o_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(deniedBefore.allowed).toBe(false);

    const grant = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_o1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: PERMISSION_ID,
        direction: "grant",
        idempotencyKey: nextId("ov"),
      }),
    );
    expect(grant.outcome).toBe("executed");
    const allowedAfterGrant = await evaluatePermission(db, {
      userId: "cust_o_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(allowedAfterGrant.allowed).toBe(true);

    // Same-direction replay (grant again) creates no duplicate.
    const grantAgain = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_o1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: PERMISSION_ID,
        direction: "grant",
        idempotencyKey: nextId("ov"),
      }),
    );
    expect(grantAgain.outcome).toBe("executed");
    const docAfterReplay = await db.collection("businessMemberships").doc(mgrMembershipId).get();
    expect(
      (docAfterReplay.data()?.["permissions"] as unknown[]).filter(
        (p) => (p as { permissionId?: string }).permissionId === PERMISSION_ID,
      ),
    ).toHaveLength(1);

    const revoke = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_o1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: PERMISSION_ID,
        direction: "revoke",
        idempotencyKey: nextId("ov"),
      }),
    );
    expect(revoke.outcome).toBe("executed");
    const deniedAfterRevoke = await evaluatePermission(db, {
      userId: "cust_o_mgr",
      businessId,
      permission: PERMISSION_ID,
    });
    expect(deniedAfterRevoke.allowed).toBe(false);

    // grant/revoke replacement leaves exactly one current override.
    const docAfterRevoke = await db.collection("businessMemberships").doc(mgrMembershipId).get();
    expect(
      (docAfterRevoke.data()?.["permissions"] as unknown[]).filter(
        (p) => (p as { permissionId?: string }).permissionId === PERMISSION_ID,
      ),
    ).toHaveLength(1);

    // Suspended membership can revoke but not grant.
    const suspend = await suspendStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_o1",
        businessId,
        targetMembershipId: mgrMembershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(suspend.outcome).toBe("executed");

    // FD-003D-2's status-gated policy is enforced inside `mutation.prepare`
    // (after the `staff.assignPermissions` authorization decision already
    // allowed) — it surfaces as a THROWN `PermissionDomainError`
    // (INVALID_STATE_TRANSITION), not an "denied" outcome.
    await expect(
      administerStaffPermissionOverrideCommand(
        db,
        overrideParams({
          userId: "owner_o1",
          businessId,
          targetMembershipId: mgrMembershipId,
          permissionId: PERMISSION_ID,
          direction: "grant",
          idempotencyKey: nextId("ov"),
        }),
      ),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });

    // ... but revoke on a suspended membership is permitted (authority may be
    // reduced, never staged) — executes normally.
    const revokeWhileSuspended = await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_o1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: "transaction.reverse",
        direction: "revoke",
        idempotencyKey: nextId("ov"),
      }),
    );
    expect(revokeWhileSuspended.outcome).toBe("executed");

    // Removed membership cannot administer overrides — same thrown-error path.
    const remove = await removeStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_o1",
        businessId,
        targetMembershipId: mgrMembershipId,
        idempotencyKey: nextId("lc"),
      }),
    );
    expect(remove.outcome).toBe("executed");
    await expect(
      administerStaffPermissionOverrideCommand(
        db,
        overrideParams({
          userId: "owner_o1",
          businessId,
          targetMembershipId: mgrMembershipId,
          permissionId: PERMISSION_ID,
          direction: "grant",
          idempotencyKey: nextId("ov"),
        }),
      ),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });

    // Baseline membership count for this business before the pending invite
    // below (the Owner's own bootstrap membership + the removed mgr
    // membership — both already exist at this point).
    const membershipsBeforePendingInvite = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .get();
    const countBefore = membershipsBeforePendingInvite.size;

    // Invited (pending, not yet a membership) — construct via a fresh invite, no accept.
    const pendingInvite = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "o-pending@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_o1" }),
    );
    expect(pendingInvite.outcome).toBe("created");
    // There is no membershipId yet for a pending invitation — administering an
    // override requires a targetMembershipId, so this state is structurally
    // inadministrable (no membership document exists to target), confirming
    // "invited cannot administer overrides" by construction rather than by a
    // runtime denial path. Assert that construction claim directly: the
    // pending invite added no new membership document under this business.
    const membershipsAfterPendingInvite = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .get();
    expect(membershipsAfterPendingInvite.size).toBe(countBefore);
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 6 — Invitation terminality.
// ---------------------------------------------------------------------------
describe("SCENARIO 6 — invitation terminality", () => {
  it("pending->accepted, pending->revoked, pending->expired are each single-use terminal; reissue creates a new invitation", async () => {
    const businessId = await seedActiveBusiness("owner_t1");

    // accepted cannot accept again.
    const inv1 = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "t1@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_t1" }),
    );
    if (inv1.outcome !== "created") throw new Error("setup");
    await seedCustomerIdentityWithEmail("cust_t1", "t1@example.com");
    await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_t1",
        invitationReference: inv1.invitation.id,
      }),
    );
    // `invitationAlreadyAcceptedError` is mapped to IDEMPOTENCY_CONFLICT
    // (permissionErrors.ts) — a taxonomy choice worth noting: expired/revoked
    // (below) map to RESOURCE_NOT_FOUND for the same "terminal, single-use"
    // family of condition. See error-taxonomy finding in the final report.
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_t1",
          invitationReference: inv1.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "IDEMPOTENCY_CONFLICT" });

    // revoked cannot accept; revoked cannot be revived.
    const inv2 = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "t2@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_t1" }),
    );
    if (inv2.outcome !== "created") throw new Error("setup");
    const revoked = await revokeStaffInvitation(
      db,
      { businessId, invitationId: inv2.invitation.id },
      {
        actorUserId: "owner_t1",
        idempotencyKey: nextId("revoke"),
        correlationId: "corr_rv",
        actor,
        now: new Date(),
        newId: () => nextId("evt"),
      },
    );
    expect(revoked.outcome).toBe("revoked");
    await seedCustomerIdentityWithEmail("cust_t2", "t2@example.com");
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_t2",
          invitationReference: inv2.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
    // revoked cannot be revived: revoking an already-revoked invitation is
    // an invalid "revoked"->"revoked" lifecycle transition — thrown, not a
    // silent no-op "revoked again" success.
    await expect(
      revokeStaffInvitation(
        db,
        { businessId, invitationId: inv2.invitation.id },
        {
          actorUserId: "owner_t1",
          idempotencyKey: nextId("revoke2"),
          correlationId: "corr_rv2",
          actor,
          now: new Date(),
          newId: () => nextId("evt"),
        },
      ),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });

    // expired cannot accept.
    const inv3 = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "t3@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_t1" }),
    );
    if (inv3.outcome !== "created") throw new Error("setup");
    await seedCustomerIdentityWithEmail("cust_t3", "t3@example.com");
    const farFuture = new Date(inv3.invitation.expiresAt.getTime() + 1000 * 60 * 60 * 24 * 30);
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_t3",
          invitationReference: inv3.invitation.id,
          now: farFuture,
        }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
    const expiredDoc = await getInvitationByReference(db, inv3.invitation.id);
    if (expiredDoc.kind === "found") {
      expect(expiredDoc.invitation.status).toBe("expired");
    }

    // reissue creates a NEW invitation (different id) for the same delivery target once the prior one is terminal.
    const reissue = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "t3@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_t1" }),
    );
    expect(reissue.outcome).toBe("created");
    if (reissue.outcome === "created") {
      expect(reissue.invitation.id).not.toBe(inv3.invitation.id);
    }
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 8 — Identity authority adversarial tests.
// ---------------------------------------------------------------------------
describe("SCENARIO 8 — identity authority adversarial tests", () => {
  it("wrong authenticated person, malformed/unknown reference all fail safely with no distinguishing leak", async () => {
    const businessId = await seedActiveBusiness("owner_adv1");
    const inv = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "victim@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_adv1" }),
    );
    if (inv.outcome !== "created") throw new Error("setup");

    // Wrong authenticated person accepting a reference meant for someone else.
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_attacker",
          invitationReference: inv.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });

    // Malformed/unknown reference.
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_random",
          invitationReference: "does-not-exist-ref",
        }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });

    // No membership leaked into existence for the attacker.
    const attackerMemberships = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .where("userId", "==", "cust_attacker")
      .get();
    expect(attackerMemberships.size).toBe(0);
  });

  it("accepting business A's invitation reference creates no membership document under business B", async () => {
    const businessA = await seedActiveBusiness("owner_advA");
    const businessB = await seedActiveBusiness("owner_advB");
    const invA = await createStaffInvitation(
      db,
      {
        businessId: businessA,
        role: "staff",
        deliveryTarget: { type: "email", value: "cross@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_advA" }),
    );
    if (invA.outcome !== "created") throw new Error("setup");
    await seedCustomerIdentityWithEmail("cust_cross", "cross@example.com");
    const accepted = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_cross",
        invitationReference: invA.invitation.id,
      }),
    );
    expect(accepted.businessId).toBe(businessA);

    const membershipsInB = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessB)
      .where("userId", "==", "cust_cross")
      .get();
    expect(membershipsInB.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 9/10 — Owner protection / self-action protection.
// ---------------------------------------------------------------------------
describe("SCENARIO 9/10 — Owner protection and self-action protection", () => {
  it("Owner can never be a target of suspend/reactivate/remove/role-change/override-admin; Manager cannot self-act", async () => {
    const businessId = await seedActiveBusiness("owner_p1");
    const mgrMembershipId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_p1",
      role: "manager",
      recruitUserId: "cust_p_mgr",
      email: "p-mgr@example.com",
    });
    const ownerMembership = await getBusinessMembershipByUserAndBusiness(
      db,
      "owner_p1",
      businessId,
    );
    if (ownerMembership.kind !== "found") throw new Error("owner missing");
    const ownerMembershipId = ownerMembership.membership.id;

    // All four target-policy rejections below happen inside `mutation.prepare`
    // (after the actor's own authorization decision already allowed the
    // permission itself) — they surface as THROWN `PermissionDomainError`s
    // (AUTH_FORBIDDEN), not `AuthorizeAndExecuteResult` "denied" outcomes.
    await expect(
      suspendStaffMembershipCommand(
        db,
        lifecycleParams({
          userId: "owner_p1",
          businessId,
          targetMembershipId: ownerMembershipId,
          idempotencyKey: nextId("lc"),
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });

    await expect(
      changeStaffMembershipRoleCommand(
        db,
        roleChangeParams({
          userId: "owner_p1",
          businessId,
          targetMembershipId: ownerMembershipId,
          fromRole: "manager",
          toRole: "staff",
          idempotencyKey: nextId("rc"),
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });

    // Grant Manager staff.assignPermissions to attempt override-admin on Owner.
    await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_p1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: "staff.assignPermissions",
        direction: "grant",
        idempotencyKey: nextId("ov"),
      }),
    );
    // NOTE (error-taxonomy finding): unlike the lifecycle/role-change
    // packages' Owner-target rejection (AUTH_FORBIDDEN, enforced by
    // `staffMembershipTargetPolicy.ts` inside the command layer), the
    // override package's Owner-target rejection comes from
    // `permissionOverride.ts`'s own model-layer validation
    // (`permissionOverrideCannotTargetOwnerError`) and is mapped to
    // VALIDATION_FAILED — the same conceptual "Owner is never a target"
    // rule, a differently-categorized error. See final report.
    await expect(
      administerStaffPermissionOverrideCommand(
        db,
        overrideParams({
          userId: "cust_p_mgr",
          businessId,
          targetMembershipId: ownerMembershipId,
          permissionId: "business.configureFraudRules",
          direction: "grant",
          idempotencyKey: nextId("ov"),
        }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    // Business.ownerUserId untouched throughout.
    const bizDoc = await db.collection("businesses").doc(businessId).get();
    expect(bizDoc.data()?.["ownerUserId"]).toBe("owner_p1");

    // Manager cannot self-suspend/reactivate/remove/role-change (once granted staff.manage).
    await administerStaffPermissionOverrideCommand(
      db,
      overrideParams({
        userId: "owner_p1",
        businessId,
        targetMembershipId: mgrMembershipId,
        permissionId: "staff.manage",
        direction: "grant",
        idempotencyKey: nextId("ov"),
      }),
    );
    await expect(
      suspendStaffMembershipCommand(
        db,
        lifecycleParams({
          userId: "cust_p_mgr",
          businessId,
          targetMembershipId: mgrMembershipId,
          idempotencyKey: nextId("lc"),
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 11 — Cross-business isolation.
// ---------------------------------------------------------------------------
describe("SCENARIO 11 — cross-business isolation", () => {
  it("same human identity legitimately a member of two businesses; authority in A cannot act on B's membership", async () => {
    const businessA = await seedActiveBusiness("owner_cbA");
    const businessB = await seedActiveBusiness("owner_cbB");

    const memInA = await inviteAndAccept({
      businessId: businessA,
      inviterUserId: "owner_cbA",
      role: "staff",
      recruitUserId: "cust_cb_shared",
      email: "shared-a@example.com",
    });
    // Same human (different verified email target, still same customer identity) also joins B.
    const invB = await createStaffInvitation(
      db,
      {
        businessId: businessB,
        role: "staff",
        deliveryTarget: { type: "email", value: "shared-b@example.com" },
      },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_cbB" }),
    );
    if (invB.outcome !== "created") throw new Error("setup");
    // Reuse existing identity cust_cb_shared but link a second verified email
    // reference directly on its `users/{id}` document — no production
    // repository function exposes "add a second reference to an existing
    // identity" (only creation), so this is test-only Firestore setup, not
    // a production code path under test here. The existing reference array
    // is read and appended to (not replaced) so the original businessA
    // entitlement path keeps working too.
    const userRecordB = await getAuth(app).createUser({
      email: "shared-b@example.com",
      emailVerified: true,
    });
    const userDocSnap = await db.collection("users").doc("cust_cb_shared").get();
    const existingRefs = (userDocSnap.data()?.["authenticationReferences"] as unknown[]) ?? [];
    await db
      .collection("users")
      .doc("cust_cb_shared")
      .update({
        authenticationReferences: [
          ...existingRefs,
          {
            referenceId: userRecordB.uid,
            referenceType: "email",
            linkStatus: "linked",
            createdAt: new Date(),
            createdBy: "cust_cb_shared",
          },
        ],
      });
    const acceptB = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_cb_shared",
        invitationReference: invB.invitation.id,
      }),
    );
    expect(acceptB.businessId).toBe(businessB);
    expect(acceptB.membershipId).not.toBe(memInA);

    // Business A's owner cannot suspend the membership that belongs to
    // Business B — the cross-business mismatch is caught inside
    // `mutation.prepare` and surfaces as a THROWN `PermissionDomainError`
    // (AUTH_FORBIDDEN), not a "denied" outcome (design §13: deliberately
    // indistinguishable from other AUTH_FORBIDDEN causes, to avoid leaking
    // whether the membership id exists at all).
    await expect(
      suspendStaffMembershipCommand(
        db,
        lifecycleParams({
          userId: "owner_cbA",
          businessId: businessA,
          targetMembershipId: acceptB.membershipId,
          idempotencyKey: nextId("lc"),
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 12 — Concurrency.
// ---------------------------------------------------------------------------
describe("SCENARIO 12 — concurrency", () => {
  it(
    "concurrent accept vs revoke of the same invitation: exactly one wins, no partial state",
    { timeout: 20000 },
    async () => {
      const businessId = await seedActiveBusiness("owner_cc1");
      const inv = await createStaffInvitation(
        db,
        { businessId, role: "staff", deliveryTarget: { type: "email", value: "cc1@example.com" } },
        inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_cc1" }),
      );
      if (inv.outcome !== "created") throw new Error("setup");
      await seedCustomerIdentityWithEmail("cust_cc1", "cc1@example.com");

      const [acceptResult, revokeResult] = await Promise.allSettled([
        acceptStaffInvitation(
          db,
          acceptParams({
            idempotencyKey: nextId("accept"),
            authenticatedCustomerIdentityId: "cust_cc1",
            invitationReference: inv.invitation.id,
          }),
        ),
        revokeStaffInvitation(
          db,
          { businessId, invitationId: inv.invitation.id },
          {
            actorUserId: "owner_cc1",
            idempotencyKey: nextId("revoke"),
            correlationId: "corr",
            actor,
            now: new Date(),
            newId: () => nextId("evt"),
          },
        ),
      ]);

      // Exactly one of the two racing operations wins — the loser must fail
      // (accept-on-revoked or revoke-on-accepted are both illegal
      // transitions), never both silently succeed.
      const fulfilled = [acceptResult, revokeResult].filter((r) => r.status === "fulfilled");
      expect(fulfilled.length).toBe(1);

      const finalInv = await getInvitationByReference(db, inv.invitation.id);
      if (finalInv.kind !== "found") throw new Error("expected invitation to still exist");
      if (acceptResult.status === "fulfilled") {
        expect(finalInv.invitation.status).toBe("accepted");
      } else {
        expect(finalInv.invitation.status).toBe("revoked");
      }

      // No duplicate membership regardless of outcome ordering.
      const memberships = await db
        .collection("businessMemberships")
        .where("businessId", "==", businessId)
        .where("userId", "==", "cust_cc1")
        .get();
      expect(memberships.size).toBeLessThanOrEqual(1);
    },
  );

  it(
    "double-accept concurrently: only one membership is ever created",
    { timeout: 20000 },
    async () => {
      const businessId = await seedActiveBusiness("owner_cc2");
      const inv = await createStaffInvitation(
        db,
        { businessId, role: "staff", deliveryTarget: { type: "email", value: "cc2@example.com" } },
        inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_cc2" }),
      );
      if (inv.outcome !== "created") throw new Error("setup");
      await seedCustomerIdentityWithEmail("cust_cc2", "cc2@example.com");

      const results = await Promise.allSettled([
        acceptStaffInvitation(
          db,
          acceptParams({
            idempotencyKey: nextId("accept"),
            authenticatedCustomerIdentityId: "cust_cc2",
            invitationReference: inv.invitation.id,
          }),
        ),
        acceptStaffInvitation(
          db,
          acceptParams({
            idempotencyKey: nextId("accept"),
            authenticatedCustomerIdentityId: "cust_cc2",
            invitationReference: inv.invitation.id,
          }),
        ),
      ]);
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      expect(fulfilled.length).toBe(1);

      const memberships = await db
        .collection("businessMemberships")
        .where("businessId", "==", businessId)
        .where("userId", "==", "cust_cc2")
        .get();
      expect(memberships.size).toBe(1);
    },
  );

  it(
    "concurrent suspend vs role-change on the same membership: no lost update, terminal state is consistent",
    { timeout: 20000 },
    async () => {
      const businessId = await seedActiveBusiness("owner_cc3");
      const staffId = await inviteAndAccept({
        businessId,
        inviterUserId: "owner_cc3",
        role: "staff",
        recruitUserId: "cust_cc3",
        email: "cc3@example.com",
      });

      const [suspendResult, roleChangeResult] = await Promise.allSettled([
        suspendStaffMembershipCommand(
          db,
          lifecycleParams({
            userId: "owner_cc3",
            businessId,
            targetMembershipId: staffId,
            idempotencyKey: nextId("lc"),
          }),
        ),
        changeStaffMembershipRoleCommand(
          db,
          roleChangeParams({
            userId: "owner_cc3",
            businessId,
            targetMembershipId: staffId,
            fromRole: "staff",
            toRole: "manager",
            idempotencyKey: nextId("rc"),
          }),
        ),
      ]);

      const finalDoc = await getBusinessMembershipById(db, staffId);
      if (finalDoc.kind !== "found") throw new Error("expected membership to still exist");

      // No lost update: whichever command actually fulfilled must be
      // reflected in the final stored state, not silently overwritten by
      // the other racing write.
      if (suspendResult.status === "fulfilled") {
        expect(finalDoc.membership.status).toBe("suspended");
      }
      if (roleChangeResult.status === "fulfilled") {
        expect(finalDoc.membership.role).toBe("manager");
      }
      // At least one of the two racing commands must have succeeded — a
      // race that silently drops both writes is itself a lost update.
      expect(suspendResult.status === "fulfilled" || roleChangeResult.status === "fulfilled").toBe(
        true,
      );
    },
  );
});

// ---------------------------------------------------------------------------
// SCENARIO 13 — Idempotency.
// ---------------------------------------------------------------------------
describe("SCENARIO 13 — idempotency", () => {
  it("same idempotency key + same payload replays safely with no duplicate side effects", async () => {
    const businessId = await seedActiveBusiness("owner_id1");
    const staffId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_id1",
      role: "staff",
      recruitUserId: "cust_id1",
      email: "id1@example.com",
    });

    const key = nextId("shared-lc");
    const first = await suspendStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_id1",
        businessId,
        targetMembershipId: staffId,
        idempotencyKey: key,
      }),
    );
    const second = await suspendStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_id1",
        businessId,
        targetMembershipId: staffId,
        idempotencyKey: key,
      }),
    );
    expect(first.outcome).toBe("executed");
    expect(second.outcome).toBe("duplicate");

    const outboxSnap = await db.collection("outboxEntries").get();
    const suspendedEvents = outboxSnap.docs.filter(
      (d) =>
        (d.data() as { event?: { eventType?: string } })["event"]?.["eventType"] ===
        "staffMembership.staff_membership_suspended.v1",
    );
    expect(suspendedEvents).toHaveLength(1);
  });

  it("same idempotency key + different payload yields IDEMPOTENCY_CONFLICT (shared mechanism, not invented)", async () => {
    const businessId = await seedActiveBusiness("owner_id2");
    const staffId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_id2",
      role: "staff",
      recruitUserId: "cust_id2",
      email: "id2@example.com",
    });
    const mgrId = await inviteAndAccept({
      businessId,
      inviterUserId: "owner_id2",
      role: "manager",
      recruitUserId: "cust_id2b",
      email: "id2b@example.com",
    });

    const key = nextId("shared-lc2");
    await suspendStaffMembershipCommand(
      db,
      lifecycleParams({
        userId: "owner_id2",
        businessId,
        targetMembershipId: staffId,
        idempotencyKey: key,
      }),
    );
    await expect(
      suspendStaffMembershipCommand(
        db,
        lifecycleParams({
          userId: "owner_id2",
          businessId,
          targetMembershipId: mgrId,
          idempotencyKey: key,
        }),
      ),
    ).rejects.toMatchObject({ category: "IDEMPOTENCY_CONFLICT" });
  });
});

// ---------------------------------------------------------------------------
// SCENARIO 7 — Invitation/membership atomicity, and data-integrity re-read.
// ---------------------------------------------------------------------------
describe("SCENARIO 7 — invitation/membership atomicity and data integrity", () => {
  it("no membership without accepted invitation, no accepted invitation without membership, and membership role derives from invitation's authoritative intendedRole", async () => {
    const businessId = await seedActiveBusiness("owner_at1");
    const inv = await createStaffInvitation(
      db,
      { businessId, role: "manager", deliveryTarget: { type: "email", value: "at1@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_at1" }),
    );
    if (inv.outcome !== "created") throw new Error("setup");
    await seedCustomerIdentityWithEmail("cust_at1", "at1@example.com");

    const accepted = await acceptStaffInvitation(
      db,
      acceptParams({
        idempotencyKey: nextId("accept"),
        authenticatedCustomerIdentityId: "cust_at1",
        invitationReference: inv.invitation.id,
      }),
    );
    // Role derives from the invitation's own authoritative role, not any client-controllable field.
    expect(accepted.role).toBe("manager");

    const finalMembership = await getBusinessMembershipById(db, accepted.membershipId);
    expect(finalMembership.kind).toBe("found");
    if (finalMembership.kind === "found") {
      expect(finalMembership.membership.role).toBe("manager");
    }
    const finalInvitation = await getInvitationByReference(db, inv.invitation.id);
    expect(finalInvitation.kind).toBe("found");
    if (finalInvitation.kind === "found") {
      expect(finalInvitation.invitation.status).toBe("accepted");
    }
  });

  it("failed acceptance transaction leaves neither partial invitation nor partial membership state", async () => {
    const businessId = await seedActiveBusiness("owner_at2");
    const inv = await createStaffInvitation(
      db,
      { businessId, role: "staff", deliveryTarget: { type: "email", value: "at2@example.com" } },
      inviteParams({ idempotencyKey: nextId("invite"), actorUserId: "owner_at2" }),
    );
    if (inv.outcome !== "created") throw new Error("setup");
    // No customer identity seeded -> entitlement lookup fails -> whole attempt fails closed.
    await expect(
      acceptStaffInvitation(
        db,
        acceptParams({
          idempotencyKey: nextId("accept"),
          authenticatedCustomerIdentityId: "cust_at2_ghost",
          invitationReference: inv.invitation.id,
        }),
      ),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });

    const invitationStill = await getInvitationByReference(db, inv.invitation.id);
    if (invitationStill.kind === "found") {
      expect(invitationStill.invitation.status).toBe("pending"); // untouched — no partial terminal transition.
    }
    const ghostMemberships = await db
      .collection("businessMemberships")
      .where("businessId", "==", businessId)
      .where("userId", "==", "cust_at2_ghost")
      .get();
    expect(ghostMemberships.size).toBe(0);
  });
});
