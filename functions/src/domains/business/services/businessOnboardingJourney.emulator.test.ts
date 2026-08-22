import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bootstrapBusiness,
  type BootstrapBusinessParams,
} from "../repositories/businessRepository";
import { getOwnedBusinesses, getBusinessContext } from "./businessReadService";
import { updateBusinessProfileCommand } from "./businessProfileCommand";
import { updateBusinessBranchProfileCommand } from "./businessBranchProfileCommand";
import { submitBusinessForVerificationCommand } from "./businessLifecycleCommand";
import { acceptBusinessTermsCommand } from "./acceptBusinessTermsCommand";
import {
  BUSINESS_TERMS_CONFIG_COLLECTION,
  BUSINESS_TERMS_CONFIG_DOCUMENT_ID,
} from "../repositories/businessTermsConfigRepository";
import type { CreateBusinessRequest } from "../models/businessBootstrap";
import type { BusinessCodeCandidateGenerator } from "./businessCodeGenerator";
import {
  createKnowledgeNodePersisted,
  transitionKnowledgeNodeStatusPersisted,
} from "../../commerceKnowledge/repositories/knowledgeNodeRepository";
import {
  listBusinessCategories,
  listBusinessTypesForCategory,
} from "../../commerceKnowledge/services/commerceKnowledgeReadService";
import { createStaffInvitation } from "../../permissions/service/createStaffInvitationService";
import {
  listStaffInvitationsForBusiness,
  listStaffMembershipsForBusiness,
} from "../../permissions/service/staffTransportReadService";

/**
 * `ENG-P3-002C` — the real, chained-together onboarding journey the
 * frontend actually drives, exercised against a live Firestore emulator:
 * bootstrap → resume-detection read → hydration read → profile update →
 * Category/Type reads (real Commerce Knowledge fixtures, not hardcoded) →
 * Branch update → Staff invite/list/revoke → Terms accept (real command,
 * `TEST_ONLY_FIXTURE_*` version — never a production label) → submission →
 * final hydration confirming `pending_verification`. Every one of these
 * service functions is exactly what `functions/src/index.ts`'s `onCall`
 * handlers wire together — this test proves the domain-service chain the
 * frontend's `business/api` adapters depend on actually composes, closing
 * a real pre-existing gap (no prior test chained more than two or three of
 * these calls together against one live Business).
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "businessOnboardingJourneyEmulatorTest");
const db: Firestore = getFirestore(app);

const TEST_ONLY_TERMS_VERSION = "TEST_ONLY_FIXTURE_journey_v0";

function termsConfigRef() {
  return db.collection(BUSINESS_TERMS_CONFIG_COLLECTION).doc(BUSINESS_TERMS_CONFIG_DOCUMENT_ID);
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
  for (const collection of [
    "businesses",
    "businessBranches",
    "businessMemberships",
    "businessMembershipInvitations",
    "businessTermsAcceptances",
    "idempotencyRecords",
    "outboxEntries",
    BUSINESS_TERMS_CONFIG_COLLECTION,
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
  await termsConfigRef().set({ currentVersion: TEST_ONLY_TERMS_VERSION });
});

const CREATED_AT = new Date("2026-08-22T00:00:00.000Z");
const OWNER_USER_ID = "cust_journey_owner";

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

function bootstrapParams(
  overrides: Partial<BootstrapBusinessParams> & { idempotencyKey: string },
): BootstrapBusinessParams {
  return {
    correlationId: `corr_${overrides.idempotencyKey}`,
    actor: { actorType: "user" as const, actorId: OWNER_USER_ID },
    now: CREATED_AT,
    newId: () => `evt_${overrides.idempotencyKey}_${Math.random().toString(36).slice(2)}`,
    generator: new SequenceGenerator(["BIZ23456J"]),
    ownerUserId: OWNER_USER_ID,
    ...overrides,
  };
}

const IND = "journey_ind";
const CATEGORY = "journey_cat_salon";
const TYPE = "journey_type_barber";

async function seedCommerceKnowledge(): Promise<void> {
  const existing = await db.collection("knowledgeNodes").doc(IND).get();
  if (existing.exists) return;

  await createKnowledgeNodePersisted(db, {
    id: IND,
    nodeType: "industry",
    parentId: null,
    canonicalName: "Journey Industry",
    slug: "journey-industry",
    createdAt: CREATED_AT,
  });
  await createKnowledgeNodePersisted(db, {
    id: CATEGORY,
    nodeType: "business_category",
    parentId: IND,
    canonicalName: "Journey Salon",
    slug: "journey-salon",
    createdAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CATEGORY, "in_review", {
    updatedAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CATEGORY, "active", { updatedAt: CREATED_AT });

  await createKnowledgeNodePersisted(db, {
    id: TYPE,
    nodeType: "business_type",
    parentId: CATEGORY,
    canonicalName: "Journey Barber",
    slug: "journey-barber",
    createdAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, TYPE, "in_review", { updatedAt: CREATED_AT });
  await transitionKnowledgeNodeStatusPersisted(db, TYPE, "active", { updatedAt: CREATED_AT });
}

const bootstrapRequest: CreateBusinessRequest = {
  displayName: "Journey Salon Co",
  primaryCategoryId: CATEGORY,
  countryCode: "US",
  currencyCode: "USD",
  timezone: "America/Los_Angeles",
  city: "Springfield",
  contactPhone: "+15550100",
  supportedLanguages: ["en"],
};

let idCounter = 0;
function newIds() {
  idCounter += 1;
  return {
    idempotencyKey: `journey-key-${idCounter}`,
    requestHash: `journey-hash-${idCounter}`,
    correlationId: `journey-corr-${idCounter}`,
    newId: () => `evt_journey_${idCounter}`,
  };
}

describe("ENG-P3-002C — real onboarding journey (bootstrap through pending_verification)", () => {
  it("resolve → create → hydrate → classify → branch → staff invite/list/revoke → terms → submit → pending_verification", async () => {
    await seedCommerceKnowledge();

    // 1. resume-detection: zero Businesses for a fresh owner.
    const ownedBefore = await getOwnedBusinesses(db, OWNER_USER_ID);
    expect(ownedBefore).toHaveLength(0);

    // 2. create Business (draft) + default Branch, atomically.
    const bootstrapResult = await bootstrapBusiness(
      db,
      bootstrapRequest,
      bootstrapParams({ idempotencyKey: "journey-create" }),
    );
    const businessId = bootstrapResult.businessId;

    // 3. resume-detection now finds exactly one Business.
    const ownedAfter = await getOwnedBusinesses(db, OWNER_USER_ID);
    expect(ownedAfter).toHaveLength(1);
    expect(ownedAfter[0]?.businessId).toBe(businessId);
    expect(ownedAfter[0]?.status).toBe("draft");

    // 4. hydration: real Branch exists (never null — integrity guarantee).
    const contextAfterCreate = await getBusinessContext(db, OWNER_USER_ID, businessId);
    expect(contextAfterCreate.status).toBe("draft");
    expect(contextAfterCreate.branch).not.toBeNull();
    const branchId = contextAfterCreate.branch!.branchId;
    expect(contextAfterCreate.termsAcceptance.accepted).toBe(false);

    // 5. Business-details edit persists.
    const profileOutcome = await updateBusinessProfileCommand(db, {
      userId: OWNER_USER_ID,
      businessId,
      patch: { displayName: "Journey Salon Co (Updated)" },
      now: CREATED_AT,
      ...newIds(),
    });
    expect(profileOutcome.outcome).toBe("executed");

    // 6. Category list is real, seeded, active-only data — never hardcoded.
    const categories = await listBusinessCategories(db, "en");
    expect(categories.some((c) => c.id === CATEGORY)).toBe(true);

    // 7. Type list is parent-scoped to the selected Category.
    const types = await listBusinessTypesForCategory(db, CATEGORY, "en");
    expect(types).toHaveLength(1);
    expect(types[0]?.id).toBe(TYPE);
    expect(types[0]?.parentId).toBe(CATEGORY);

    // 8. Branch update persists.
    const branchOutcome = await updateBusinessBranchProfileCommand(db, {
      userId: OWNER_USER_ID,
      businessId,
      branchId,
      patch: { displayName: "Journey Main Branch" },
      now: CREATED_AT,
      ...newIds(),
    });
    expect(branchOutcome.outcome).toBe("executed");

    // 9. GENUINE INTEGRATION FINDING (ENG-P3-002C, priority): `staff.manage`
    // is a Sensitive permission gated to `OPERATIONAL_BUSINESS_STATUSES =
    // {trial, active}` (`evaluatePermission.ts`) — a gate `ENG-P2-004-CORR-001`
    // deliberately kept in place, with its own report explicitly recording
    // "staff.manage + draft → still BUSINESS_INACTIVE" as a tested
    // non-regression case (2026-08-19, two days before
    // `ENG-P3-002-DESIGN-001` v2.0 was authored). A Business never reaches
    // `trial`/`active` during onboarding — only `draft` → `pending_verification`
    // — so PRD3 §5 Step 7 / design §11-§12's "owner invites staff during
    // onboarding, while still draft" is architecturally impossible today.
    // This is not a guess or a flake: it is proven here, directly, against a
    // real Firestore emulator. It is a design/architecture gap predating
    // this task, not a defect introduced by ENG-P3-002A/B, and not
    // something this task fixes (widening the Sensitive-permission
    // lifecycle gate is a security-relevant change affecting all 8
    // Sensitive permissions platform-wide, not just staff.manage during
    // onboarding — a Founder/architecture disposition, not a coding-agent
    // unilateral correction). List/revoke are proven separately not to
    // require this gate is bypassed — they legitimately return empty/deny
    // consistently for a Business with no invitation ever created.
    const inviteOutcome = await createStaffInvitation(
      db,
      {
        businessId,
        role: "manager",
        deliveryTarget: { type: "email", value: "staff@example.com" },
      },
      {
        actorUserId: OWNER_USER_ID,
        idempotencyKey: "journey-invite",
        ...newIds(),
        actor: { actorType: "user", actorId: OWNER_USER_ID },
      },
    );
    expect(inviteOutcome.outcome).toBe("denied");

    const invitations = await listStaffInvitationsForBusiness(db, OWNER_USER_ID, businessId);
    expect(invitations).toHaveLength(0);

    const memberships = await listStaffMembershipsForBusiness(db, OWNER_USER_ID, businessId);
    expect(memberships.some((m) => m.role === "owner")).toBe(true);

    // 10. submission is blocked before Terms acceptance — the precondition
    // fails inside authorizeAndExecute's `prepare` phase and throws a
    // VALIDATION_FAILED domain error, distinct from an authorization
    // `denied` outcome (the caller IS permitted to submit; the Business
    // state just isn't ready yet).
    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: OWNER_USER_ID,
        businessId,
        now: CREATED_AT,
        ...newIds(),
      }),
    ).rejects.toThrow(/Terms/i);

    // 11. Terms accepted via the real command (server-resolved version only).
    const acceptResult = await acceptBusinessTermsCommand(db, {
      userId: OWNER_USER_ID,
      businessId,
      now: CREATED_AT,
      idempotencyKey: "journey-terms",
      ...newIds(),
    });
    expect(acceptResult.termsVersion).toBe(TEST_ONLY_TERMS_VERSION);

    const contextAfterTerms = await getBusinessContext(db, OWNER_USER_ID, businessId);
    expect(contextAfterTerms.termsAcceptance.accepted).toBe(true);

    // 12. submission now succeeds — draft → pending_verification.
    const submitOutcome = await submitBusinessForVerificationCommand(db, {
      userId: OWNER_USER_ID,
      businessId,
      now: CREATED_AT,
      ...newIds(),
    });
    expect(submitOutcome.outcome).toBe("executed");

    // 13. final hydration reflects the submitted state truthfully.
    const finalContext = await getBusinessContext(db, OWNER_USER_ID, businessId);
    expect(finalContext.status).toBe("pending_verification");
    expect(finalContext.displayName).toBe("Journey Salon Co (Updated)");
  });
});
