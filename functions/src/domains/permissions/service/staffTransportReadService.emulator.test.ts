import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  listStaffInvitationsForBusiness,
  listStaffMembershipsForBusiness,
} from "./staffTransportReadService";
import { createBusinessMembershipInvitation } from "../models/businessMembershipInvitation";
import { toBusinessMembershipInvitationDocumentFields } from "../repositories/businessMembershipInvitationDocument";

/**
 * `ENG-P3-002A` — Staff list-query read transport emulator tests (design
 * §39, task Phase AC "STAFF" items 17-19).
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "staffTransportReadServiceEmulatorTest");
const db = getFirestore(app);

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite.",
    );
  }
});

beforeEach(async () => {
  for (const collection of ["businessMemberships", "businessMembershipInvitations", "users"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

const NOW = new Date("2026-08-21T00:00:00.000Z");
const LATER = new Date("2026-09-21T00:00:00.000Z");

async function seedMembership(params: {
  membershipId: string;
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  status?: "active" | "invited" | "suspended" | "removed";
}) {
  await db
    .collection("businessMemberships")
    .doc(params.membershipId)
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
      permissions: [],
    });
}

async function seedInvitation(params: {
  id: string;
  businessId: string;
  role: "manager" | "staff";
  deliveryTarget?: { type: "email" | "phone"; value: string };
}) {
  const invitation = createBusinessMembershipInvitation({
    id: params.id,
    businessId: params.businessId,
    role: params.role,
    deliveryTarget: params.deliveryTarget ?? { type: "email", value: "invitee@example.com" },
    invitedBy: "cust_owner",
    invitedAt: NOW,
    expiresAt: LATER,
  });
  await db
    .collection("businessMembershipInvitations")
    .doc(params.id)
    .set(toBusinessMembershipInvitationDocumentFields(invitation));
}

async function seedUserDisplayName(userId: string, displayName: string) {
  await db.collection("users").doc(userId).set({ displayName });
}

async function seedMalformedUserDisplayName(userId: string, rawDisplayName: unknown) {
  await db.collection("users").doc(userId).set({ displayName: rawDisplayName });
}

/**
 * A genuine but bare `users/{userId}` document — exists, has no
 * `displayName` field. Every real membership's `userId` always has a
 * backing `users` document (`acceptStaffInvitationService.ts`'s
 * `getCustomerIdentityById` check, or the caller's own already-
 * authenticated identity for Owner bootstrap) — tests that don't care
 * about Display Name still need this seeded so `listStaffMembershipsForBusiness`
 * doesn't fail closed on a referential-integrity violation that isn't the
 * thing under test (independent review correction,
 * `ENG-P3-002-UI-IMP-G-COMPLETION-REVIEW`).
 */
async function seedBareUser(userId: string) {
  await db.collection("users").doc(userId).set({});
}

describe("listStaffInvitationsForBusiness", () => {
  it("17. lists invitations scoped to the caller's own Business", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedInvitation({ id: "inv-1", businessId: "biz-a", role: "staff" });
    await seedInvitation({ id: "inv-2", businessId: "biz-b", role: "staff" });

    const result = await listStaffInvitationsForBusiness(db, "cust_owner", "biz-a");
    expect(result.map((i) => i.invitationId)).toEqual(["inv-1"]);
  });

  it("37. cross-Business enumeration resistance — a caller with no membership in the requested Business is denied", async () => {
    await seedInvitation({ id: "inv-1", businessId: "biz-a", role: "staff" });

    await expect(
      listStaffInvitationsForBusiness(db, "cust_stranger", "biz-a"),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("38. bounded DTO privacy — email delivery exposes the invitation email (FD-P3-002-G-001 §2), phone delivery exposes no identity value", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedInvitation({ id: "inv-1", businessId: "biz-a", role: "staff" });
    await seedInvitation({
      id: "inv-2",
      businessId: "biz-a",
      role: "staff",
      deliveryTarget: { type: "phone", value: "+15555550100" },
    });

    const result = await listStaffInvitationsForBusiness(db, "cust_owner", "biz-a");
    const byId = Object.fromEntries(
      result.map((i) => [i.invitationId, i as Record<string, unknown>]),
    );

    expect(byId["inv-1"]?.["deliveryType"]).toBe("email");
    expect(byId["inv-1"]?.["email"]).toBe("invitee@example.com");

    expect(byId["inv-2"]?.["deliveryType"]).toBe("phone");
    expect(byId["inv-2"]?.["email"]).toBeUndefined();
    expect(JSON.stringify(byId["inv-2"])).not.toContain("+15555550100");
  });

  it("39. two email invitations are distinguishable by their exposed email", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedInvitation({
      id: "inv-1",
      businessId: "biz-a",
      role: "staff",
      deliveryTarget: { type: "email", value: "alice@example.com" },
    });
    await seedInvitation({
      id: "inv-2",
      businessId: "biz-a",
      role: "staff",
      deliveryTarget: { type: "email", value: "bob@example.com" },
    });

    const result = await listStaffInvitationsForBusiness(db, "cust_owner", "biz-a");
    const emails = result.map((i) => i.email).sort();
    expect(emails).toEqual(["alice@example.com", "bob@example.com"]);
  });

  it("40. cross-Business invitation identity never leaks — only the requested Business's invitation emails are returned", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedInvitation({
      id: "inv-1",
      businessId: "biz-a",
      role: "staff",
      deliveryTarget: { type: "email", value: "own-business@example.com" },
    });
    await seedInvitation({
      id: "inv-2",
      businessId: "biz-b",
      role: "staff",
      deliveryTarget: { type: "email", value: "other-business@example.com" },
    });

    const result = await listStaffInvitationsForBusiness(db, "cust_owner", "biz-a");
    expect(result).toHaveLength(1);
    expect(result[0]?.email).toBe("own-business@example.com");
    expect(JSON.stringify(result)).not.toContain("other-business@example.com");
  });

  it("filters by status when supplied", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedInvitation({ id: "inv-1", businessId: "biz-a", role: "staff" });

    const result = await listStaffInvitationsForBusiness(db, "cust_owner", "biz-a", "pending");
    expect(result.map((i) => i.invitationId)).toEqual(["inv-1"]);
    const noneAccepted = await listStaffInvitationsForBusiness(
      db,
      "cust_owner",
      "biz-a",
      "accepted",
    );
    expect(noneAccepted).toEqual([]);
  });

  it("a Manager (not just the Owner) may also list invitations — any active membership grants read authority", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-2",
      userId: "cust_manager",
      businessId: "biz-a",
      role: "manager",
    });
    await seedInvitation({ id: "inv-1", businessId: "biz-a", role: "staff" });

    const result = await listStaffInvitationsForBusiness(db, "cust_manager", "biz-a");
    expect(result).toHaveLength(1);
  });
});

describe("listStaffMembershipsForBusiness", () => {
  it("18. lists memberships scoped to the caller's own Business", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-2",
      userId: "cust_other_owner",
      businessId: "biz-b",
      role: "owner",
    });
    await seedBareUser("cust_owner");

    const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
    expect(result.map((m) => m.membershipId)).toEqual(["mem-1"]);
  });

  it("37. cross-Business enumeration resistance", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      listStaffMembershipsForBusiness(db, "cust_stranger", "biz-a"),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("38. bounded DTO privacy — never exposes the raw Customer Identity (userId)", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedBareUser("cust_owner");

    const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
    const dto = result[0] as unknown as Record<string, unknown>;
    expect(dto["userId"]).toBeUndefined();
    expect(dto["membershipId"]).toBe("mem-1");
  });

  it("a suspended caller membership no longer grants read authority", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
      status: "suspended",
    });

    await expect(listStaffMembershipsForBusiness(db, "cust_owner", "biz-a")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  describe("displayName projection (FD-P3-002-G-001 §5, ENG-P3-002-UI-IMP-G-COMPLETION)", () => {
    it("1. Owner membership resolves Display Name uniformly via membership.userId -> users.displayName (no invitation-linkage needed)", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      await seedUserDisplayName("cust_owner", "Grace Hopper");

      const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
      expect(result.find((m) => m.membershipId === "mem-owner")?.displayName).toBe("Grace Hopper");
    });

    it("2. Staff membership resolves Display Name", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      await seedMembership({
        membershipId: "mem-staff",
        userId: "cust_staff",
        businessId: "biz-a",
        role: "staff",
      });
      await seedBareUser("cust_owner");
      await seedUserDisplayName("cust_staff", "Ada Lovelace");

      const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
      expect(result.find((m) => m.membershipId === "mem-staff")?.displayName).toBe("Ada Lovelace");
    });

    it("3. two Staff with the same role remain distinguishable by their own Display Name", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      await seedMembership({
        membershipId: "mem-staff-1",
        userId: "cust_staff_1",
        businessId: "biz-a",
        role: "staff",
      });
      await seedMembership({
        membershipId: "mem-staff-2",
        userId: "cust_staff_2",
        businessId: "biz-a",
        role: "staff",
      });
      await seedBareUser("cust_owner");
      await seedUserDisplayName("cust_staff_1", "Alan Turing");
      await seedUserDisplayName("cust_staff_2", "Barbara Liskov");

      const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
      expect(result.find((m) => m.membershipId === "mem-staff-1")?.displayName).toBe("Alan Turing");
      expect(result.find((m) => m.membershipId === "mem-staff-2")?.displayName).toBe(
        "Barbara Liskov",
      );
    });

    it("4. duplicate Display Names across distinct Staff are permitted (no uniqueness check introduced)", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      await seedMembership({
        membershipId: "mem-staff-1",
        userId: "cust_staff_1",
        businessId: "biz-a",
        role: "staff",
      });
      await seedMembership({
        membershipId: "mem-staff-2",
        userId: "cust_staff_2",
        businessId: "biz-a",
        role: "staff",
      });
      await seedBareUser("cust_owner");
      await seedUserDisplayName("cust_staff_1", "Jordan Smith");
      await seedUserDisplayName("cust_staff_2", "Jordan Smith");

      const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
      expect(result.find((m) => m.membershipId === "mem-staff-1")?.displayName).toBe(
        "Jordan Smith",
      );
      expect(result.find((m) => m.membershipId === "mem-staff-2")?.displayName).toBe(
        "Jordan Smith",
      );
    });

    it("5. a missing Display Name (State 1: valid users document, no displayName field) is represented safely — absent field, not a fabricated value, and does not fail the listing", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      // A genuine users/cust_owner document exists — it simply has never
      // had a Display Name set. Distinct from State 4 below (no document
      // at all), which must NOT be treated the same way.
      await seedBareUser("cust_owner");

      const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
      const dto = result[0] as unknown as Record<string, unknown>;
      expect(result).toHaveLength(1);
      expect(dto["displayName"]).toBeUndefined();
      expect(Object.keys(dto)).not.toContain("displayName");
    });

    it("State 4: a membership referencing a users document that does not exist at all fails the read closed — NOT treated as equivalent to 'Display Name absent' (independent review correction)", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      // No users/cust_owner document at all — a referential-integrity
      // violation (every real membership.userId is guaranteed to have a
      // backing users document), not a benign "hasn't set a name" case.

      await expect(
        listStaffMembershipsForBusiness(db, "cust_owner", "biz-a"),
      ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
    });

    it("6. a malformed stored Display Name fails the read closed, per the identity domain's own integrity policy (isolated: the owner's own record is genuine and unset, so the failure is provably the staff member's malformed record, not a missing-document false positive)", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      await seedMembership({
        membershipId: "mem-staff",
        userId: "cust_staff",
        businessId: "biz-a",
        role: "staff",
      });
      await seedBareUser("cust_owner");
      await seedMalformedUserDisplayName("cust_staff", 12345);

      await expect(
        listStaffMembershipsForBusiness(db, "cust_owner", "biz-a"),
      ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
    });

    it("7/8/9. protected fields (email, phone, userId, provider/auth metadata) are never present on the membership DTO", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      await seedUserDisplayName("cust_owner", "Katherine Johnson");

      const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
      const dto = result[0] as unknown as Record<string, unknown>;
      expect(Object.keys(dto).sort()).toEqual(
        ["displayName", "membershipId", "role", "status"].sort(),
      );
      expect(dto["userId"]).toBeUndefined();
      expect(dto["email"]).toBeUndefined();
    });

    it("10. cross-Business identity does not leak — a caller only sees Display Names for their own Business's memberships", async () => {
      await seedMembership({
        membershipId: "mem-owner-a",
        userId: "cust_owner_a",
        businessId: "biz-a",
        role: "owner",
      });
      await seedMembership({
        membershipId: "mem-owner-b",
        userId: "cust_owner_b",
        businessId: "biz-b",
        role: "owner",
      });
      await seedUserDisplayName("cust_owner_a", "Business A Owner");
      await seedUserDisplayName("cust_owner_b", "Business B Owner");

      const result = await listStaffMembershipsForBusiness(db, "cust_owner_a", "biz-a");
      expect(result).toHaveLength(1);
      expect(result[0]?.displayName).toBe("Business A Owner");
      expect(JSON.stringify(result)).not.toContain("Business B Owner");
    });

    it("12. no invitation-delivery-identity fallback exists for active-member Display Name resolution", async () => {
      await seedMembership({
        membershipId: "mem-owner",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });
      await seedBareUser("cust_owner");
      // The member has no Display Name set, but an unrelated invitation to
      // this same Business carries an email — that must never be borrowed.
      await seedInvitation({ id: "inv-1", businessId: "biz-a", role: "staff" });

      const result = await listStaffMembershipsForBusiness(db, "cust_owner", "biz-a");
      expect(result[0]?.displayName).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain("invitee@example.com");
    });
  });
});
