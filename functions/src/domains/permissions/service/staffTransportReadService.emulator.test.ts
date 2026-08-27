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
