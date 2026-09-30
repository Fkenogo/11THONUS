import { describe, expect, it } from "vitest";
import {
  authorizeCommercialAdministrator,
  firestorePlatformAdministratorRecordReader,
  type PlatformAdministratorRecordReader,
} from "./commercialAuthority";

const ts = (iso: string) => ({ toDate: () => new Date(iso) });

function record(overrides: Record<string, unknown> = {}) {
  return {
    roles: ["knowledge_editor"],
    status: "active",
    mfaRequired: true,
    invitedBy: "founder",
    createdAt: ts("2026-01-01T00:00:00Z"),
    updatedAt: ts("2026-01-01T00:00:00Z"),
    schemaVersion: 1,
    ...overrides,
  };
}

const readerOf =
  (data: unknown): PlatformAdministratorRecordReader =>
  async () =>
    data;

describe("Commercial authority seam (WP-COM-01; FD-BUS-ACT-001 precedent)", () => {
  it("authorises an active Platform Administrator with verified MFA (no role scoping, no new role)", async () => {
    const decision = await authorizeCommercialAdministrator(readerOf(record()), {
      adminUserId: "founder-uid",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({
      authorized: true,
      actor: { type: "platform_administrator", id: "founder-uid" },
    });
    // Same outcome for the other existing role: authority is administrator status, not a role.
    const approver = await authorizeCommercialAdministrator(
      readerOf(record({ roles: ["knowledge_approver"] })),
      { adminUserId: "founder-uid", verifiedMfaSatisfied: true },
    );
    expect(approver.authorized).toBe(true);
  });

  it("denies every failure cause with the same single enumeration-resistant reason", async () => {
    const denials = await Promise.all([
      authorizeCommercialAdministrator(readerOf(undefined), {
        adminUserId: "u",
        verifiedMfaSatisfied: true,
      }),
      authorizeCommercialAdministrator(readerOf(record({ status: "suspended" })), {
        adminUserId: "u",
        verifiedMfaSatisfied: true,
      }),
      authorizeCommercialAdministrator(readerOf(record({ status: "invited" })), {
        adminUserId: "u",
        verifiedMfaSatisfied: true,
      }),
      authorizeCommercialAdministrator(readerOf(record()), {
        adminUserId: "u",
        verifiedMfaSatisfied: false,
      }),
      authorizeCommercialAdministrator(readerOf("not-an-object"), {
        adminUserId: "u",
        verifiedMfaSatisfied: true,
      }),
      authorizeCommercialAdministrator(
        readerOf(record({ roles: ["platform_super_administrator"] })),
        { adminUserId: "u", verifiedMfaSatisfied: true },
      ),
      authorizeCommercialAdministrator(readerOf(record({ roles: [] })), {
        adminUserId: "u",
        verifiedMfaSatisfied: true,
      }),
      authorizeCommercialAdministrator(readerOf(record()), {
        adminUserId: "   ",
        verifiedMfaSatisfied: true,
      }),
    ]);
    for (const denial of denials) {
      expect(denial).toEqual({ authorized: false, reason: "NOT_PLATFORM_ADMINISTRATOR" });
    }
  });

  it("does not consult the reader for a blank caller id, and never trusts a non-true MFA value", async () => {
    let calls = 0;
    const counting: PlatformAdministratorRecordReader = async () => {
      calls += 1;
      return record();
    };
    await authorizeCommercialAdministrator(counting, {
      adminUserId: "",
      verifiedMfaSatisfied: true,
    });
    expect(calls).toBe(0);
    const truthy = await authorizeCommercialAdministrator(counting, {
      adminUserId: "u",
      verifiedMfaSatisfied: "yes" as unknown as boolean,
    });
    expect(truthy.authorized).toBe(false);
  });

  it("reads platformAdministrators/{userId} through the Firestore adapter and treats a missing document as absent", async () => {
    const seen: string[] = [];
    const fakeDb = {
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: async () => {
            seen.push(`${name}/${id}`);
            return id === "present"
              ? { exists: true, data: () => record() }
              : { exists: false, data: () => undefined };
          },
        }),
      }),
    } as unknown as Parameters<typeof firestorePlatformAdministratorRecordReader>[0];
    const reader = firestorePlatformAdministratorRecordReader(fakeDb);
    expect(
      (
        await authorizeCommercialAdministrator(reader, {
          adminUserId: "present",
          verifiedMfaSatisfied: true,
        })
      ).authorized,
    ).toBe(true);
    expect(
      (
        await authorizeCommercialAdministrator(reader, {
          adminUserId: "absent",
          verifiedMfaSatisfied: true,
        })
      ).authorized,
    ).toBe(false);
    expect(seen).toEqual(["platformAdministrators/present", "platformAdministrators/absent"]);
  });
});
