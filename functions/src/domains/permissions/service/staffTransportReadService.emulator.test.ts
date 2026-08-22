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
  for (const collection of ["businessMemberships", "businessMembershipInvitations"]) {
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
}) {
  const invitation = createBusinessMembershipInvitation({
    id: params.id,
    businessId: params.businessId,
    role: params.role,
    deliveryTarget: { type: "email", value: "invitee@example.com" },
    invitedBy: "cust_owner",
    invitedAt: NOW,
    expiresAt: LATER,
  });
  await db
    .collection("businessMembershipInvitations")
    .doc(params.id)
    .set(toBusinessMembershipInvitationDocumentFields(invitation));
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

  it("38. bounded DTO privacy — never exposes the raw delivery-target value (email/phone)", async () => {
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedInvitation({ id: "inv-1", businessId: "biz-a", role: "staff" });

    const result = await listStaffInvitationsForBusiness(db, "cust_owner", "biz-a");
    const dto = result[0] as unknown as Record<string, unknown>;
    expect(JSON.stringify(dto)).not.toContain("invitee@example.com");
    expect(dto["deliveryType"]).toBe("email");
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
});
