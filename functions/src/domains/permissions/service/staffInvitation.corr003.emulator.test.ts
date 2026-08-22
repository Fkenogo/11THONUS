/**
 * ENG-P2-004-CORR-003 — Phase P integration proof.
 *
 * Real Firestore Emulator round trip (not a mock): bootstraps a `draft`
 * Business, then as Owner calls the real `createStaffInvitation` command —
 * this is the exact deadlock `ENG-P3-002` integration exposed (Staff
 * invitation offered during onboarding while the Business is still
 * `draft`/`pending_verification`, which the pre-correction global Sensitive
 * gate denied). Proves:
 *   - the command now succeeds against an unmodified, real `draft` Business;
 *   - the invitation actually persists;
 *   - the Business record itself is untouched (still `draft` — no
 *     unauthorized lifecycle side effect);
 *   - the mandatory Sensitive-permission audit event is still recorded
 *     (ENG-P2-004C behavior unchanged by this correction).
 *
 * Not run as part of `pnpm test` — see `pnpm test:emulator` /
 * `pnpm emulators:validate`.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bootstrapBusiness,
  type BootstrapBusinessParams,
} from "../../business/repositories/businessRepository";
import type { CreateBusinessRequest } from "../../business/models/businessBootstrap";
import type { BusinessCodeCandidateGenerator } from "../../business/services/businessCodeGenerator";
import { BUSINESS_CODE_ALPHABET, BUSINESS_CODE_PREFIX } from "../../business/models/businessCode";
import { createStaffInvitation } from "./createStaffInvitationService";
import { getInvitationByReference } from "../repositories/businessMembershipInvitationRepository";
import {
  createKnowledgeNodePersisted,
  getKnowledgeNodeById,
  transitionKnowledgeNodeStatusPersisted,
} from "../../commerceKnowledge/repositories/knowledgeNodeRepository";

const app = initializeApp({ projectId: "demo-11thonus" }, "staffInvitationCorr003EmulatorTest");
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
  displayName: "Corr003 Cafe",
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

beforeAll(async () => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }

  if (!(await getKnowledgeNodeById(db, "cat_food"))) {
    await createKnowledgeNodePersisted(db, {
      id: "ind_test",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Test Industry",
      slug: "test-industry",
      createdAt: new Date("2026-08-22T00:00:00.000Z"),
    });
    await createKnowledgeNodePersisted(db, {
      id: "cat_food",
      nodeType: "business_category",
      parentId: "ind_test",
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: new Date("2026-08-22T00:00:00.000Z"),
    });
    await transitionKnowledgeNodeStatusPersisted(db, "cat_food", "in_review", {
      updatedAt: new Date("2026-08-22T00:00:00.000Z"),
    });
    await transitionKnowledgeNodeStatusPersisted(db, "cat_food", "active", {
      updatedAt: new Date("2026-08-22T00:00:00.000Z"),
    });
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
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
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

/** Bootstraps a Business and leaves it at its real default status (`draft`) — never forced to `active`. */
async function seedDraftBusiness(ownerUserId: string): Promise<string> {
  const key = nextId("bootstrap");
  const params: BootstrapBusinessParams = {
    ownerUserId,
    idempotencyKey: key,
    correlationId: `corr_${key}`,
    actor,
    now: new Date("2026-08-22T00:00:00.000Z"),
    newId: () => nextId("evt"),
    generator: new SequenceGenerator([nextBusinessCode()]),
  };
  const result = await bootstrapBusiness(db, baseBusinessRequest, params);
  return result.businessId;
}

function inviteParams(overrides: { idempotencyKey: string; actorUserId: string }) {
  return {
    actorUserId: overrides.actorUserId,
    idempotencyKey: overrides.idempotencyKey,
    correlationId: `corr_${overrides.idempotencyKey}`,
    actor,
    now: new Date("2026-08-22T00:00:00.000Z"),
    newId: () => nextId("evt"),
  };
}

describe("ENG-P2-004-CORR-003 Phase P — real draft-Business invitation integration proof", () => {
  it("Owner invites Staff while the Business is still draft — succeeds, invitation persists, Business remains draft, sensitive audit still recorded", async () => {
    const businessId = await seedDraftBusiness("owner_corr003_draft");

    const businessSnapshotBefore = await db.collection("businesses").doc(businessId).get();
    expect(businessSnapshotBefore.data()?.["status"]).toBe("draft");

    const idempotencyKey = nextId("invite");
    const result = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "corr003-staffer@example.com" },
      },
      inviteParams({ idempotencyKey, actorUserId: "owner_corr003_draft" }),
    );

    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") return;
    expect(result.invitation.status).toBe("pending");
    expect(result.invitation.role).toBe("staff");

    // Invitation actually persists (real Firestore read, not the in-memory
    // command result).
    const stored = await getInvitationByReference(db, result.invitation.id);
    expect(stored.kind).toBe("found");

    // No unauthorized lifecycle change: the Business is still draft.
    const businessSnapshotAfter = await db.collection("businesses").doc(businessId).get();
    expect(businessSnapshotAfter.data()?.["status"]).toBe("draft");

    // Mandatory Sensitive-permission audit behavior is unchanged
    // (ENG-P2-004C) — an allow-decision audit event for staff.manage was
    // still durably recorded via the outbox, exactly as it is for any
    // other sensitive-permission decision.
    const outbox = await db.collection("outboxEntries").get();
    const auditEntries = outbox.docs.filter((d) => {
      const eventType = d.data()["event"]?.eventType as string | undefined;
      return typeof eventType === "string" && eventType.includes("permission_decision_recorded");
    });
    expect(auditEntries.length).toBeGreaterThan(0);
    const auditPayload = auditEntries[0]?.data()["event"]?.payload;
    expect(auditPayload?.permission).toBe("staff.manage");
    expect(auditPayload?.result).toBe("allow");
  });

  it("Owner invites Staff while the Business is pending_verification — also succeeds", async () => {
    const businessId = await seedDraftBusiness("owner_corr003_pv");
    await db.collection("businesses").doc(businessId).update({ status: "pending_verification" });

    const idempotencyKey = nextId("invite");
    const result = await createStaffInvitation(
      db,
      {
        businessId,
        role: "staff",
        deliveryTarget: { type: "email", value: "corr003-pv-staffer@example.com" },
      },
      inviteParams({ idempotencyKey, actorUserId: "owner_corr003_pv" }),
    );

    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") return;

    const businessSnapshotAfter = await db.collection("businesses").doc(businessId).get();
    expect(businessSnapshotAfter.data()?.["status"]).toBe("pending_verification");
  });

  it("non-scope permission (business.configureFraudRules) is still denied while the Business is draft (Phase O, integration level)", async () => {
    const businessId = await seedDraftBusiness("owner_corr003_nonscope");

    const { authorizeAndExecute } = await import("./authorizeAndExecute");
    const decisionResult = await authorizeAndExecute(db, {
      request: {
        userId: "owner_corr003_nonscope",
        businessId,
        permission: "business.configureFraudRules",
      },
      idempotencyKey: nextId("nonscope"),
      requestHash: "nonscope-hash",
      correlationId: nextId("corr"),
      actorId: "owner_corr003_nonscope",
      mutation: {
        async prepare() {
          return { ok: true };
        },
        apply() {
          return { ok: true };
        },
      },
    });
    expect(decisionResult.outcome).toBe("denied");
  });
});
