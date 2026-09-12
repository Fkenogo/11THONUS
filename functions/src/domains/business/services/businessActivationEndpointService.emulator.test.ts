/**
 * Business activation endpoint composition against the real Firebase
 * Emulator Suite.
 *
 * Proves the transport chain end to end with a stubbed token verifier and
 * real Firestore: verified credential → server-resolved actor → genuinely
 * derived MFA evidence → command. Covers the MFA-true happy path, the
 * MFA-false denial, verifier failure before any command runs, and that
 * spoofed client-supplied administrator fields grant nothing.
 *
 * Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { handleActivateBusinessAfterVerification } from "./businessActivationEndpointService";
import { registerOrSignIn } from "../../authentication/services/registrationSignInService";
import { createAuthenticatedCredential } from "../../authentication/models/authenticatedCredential";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { EventActor } from "../../../shared/events/domainEvent";
import { createBusiness } from "../models/business";
import { toBusinessDocumentFields } from "../models/businessDocument";
import { bootstrapPlatformAdministrator } from "../../platformAdministration/services/bootstrapPlatformAdministrator";
import {
  BUSINESS_TERMS_CONFIG_COLLECTION,
  BUSINESS_TERMS_CONFIG_DOCUMENT_ID,
} from "../repositories/businessTermsConfigRepository";
import {
  createBusinessTermsAcceptance,
  toBusinessTermsAcceptanceDocumentFields,
  businessTermsAcceptanceId,
} from "../models/businessTermsAcceptance";

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "businessActivationEndpointServiceEmulatorTest",
);
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };
const NOW = new Date("2026-09-11T00:00:00.000Z");
const TEST_ONLY_TERMS_V0 = "TEST_ONLY_FIXTURE_v0";

function credentialFor(
  referenceType: AuthenticationReferenceType,
  referenceId: string,
  verifiedSecondFactor: boolean,
  authenticatedAt: Date = new Date("2026-09-10T23:59:00.000Z"),
) {
  return createAuthenticatedCredential({
    referenceType,
    referenceId,
    verifiedAt: NOW,
    providerSignals: { signInProvider: "phone" },
    verifiedSecondFactor,
    authenticatedAt,
  });
}

async function registerIdentity(
  referenceId: string,
  customerIdentityId: string,
  keySuffix: string,
) {
  await registerOrSignIn(
    db,
    credentialFor("phone_otp", referenceId, false),
    {
      eventId: `evt_actep_reg_${keySuffix}`,
      correlationId: `corr_actep_reg_${keySuffix}`,
      actor,
      occurredAt: "2026-09-11T00:00:00.000Z",
    },
    {
      idempotencyKey: `actep_reg_${keySuffix}`,
      requestHash: `actep_hash_reg_${keySuffix}`,
      issuedAt: NOW,
    },
    { generateCustomerIdentityId: () => customerIdentityId },
  );
}

async function seedPendingBusiness() {
  const business = createBusiness({
    id: "biz-1",
    businessCode: "BIZ23456X",
    ownerUserId: "cust_owner",
    displayName: "Seeded Cafe",
    primaryCategoryId: "cat_food",
    countryCode: "US",
    currencyCode: "USD",
    timezone: "America/Los_Angeles",
    city: "Springfield",
    contactPhone: "+15550100",
    supportedLanguages: ["en"],
    createdAt: NOW,
  });
  const fields = toBusinessDocumentFields({ ...business, status: "pending_verification" });
  const stripped: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) stripped[key] = val;
  }
  await db.collection("businesses").doc("biz-1").set(stripped);

  const acceptance = createBusinessTermsAcceptance({
    id: "",
    acceptingCustomerIdentityId: "cust_owner",
    businessId: "biz-1",
    termsVersion: TEST_ONLY_TERMS_V0,
    acceptedAt: NOW,
    languageCode: "en",
  });
  await db
    .collection("businessTermsAcceptances")
    .doc(businessTermsAcceptanceId("biz-1", "cust_owner", TEST_ONLY_TERMS_V0))
    .set(toBusinessTermsAcceptanceDocumentFields(acceptance));
}

async function seedAdmin(userId: string) {
  await bootstrapPlatformAdministrator(db, {
    targetUserId: userId,
    roles: ["knowledge_approver"],
    operatorReference: "ops_seed",
    correlationId: `corr_actep_admin_${userId}`,
    now: NOW,
  });
}

async function businessStatus(): Promise<unknown> {
  return (await db.collection("businesses").doc("biz-1").get()).data()?.["status"];
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
    "users",
    "customerProfiles",
    "loyaltyNumbers",
    "qrIdentityRecords",
    "authenticationReferences",
    "businesses",
    "businessMemberships",
    "businessTermsAcceptances",
    "platformAdministrators",
    "platformAdministrationAuditRecords",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
  await db
    .collection(BUSINESS_TERMS_CONFIG_COLLECTION)
    .doc(BUSINESS_TERMS_CONFIG_DOCUMENT_ID)
    .set({ currentVersion: TEST_ONLY_TERMS_V0 });
});

describe("handleActivateBusinessAfterVerification (emulator)", () => {
  it("activates on a verified MFA-satisfying administrator credential", async () => {
    await registerIdentity("authuid_admin", "cust_admin", "admin");
    await seedAdmin("cust_admin");
    await seedPendingBusiness();

    const outcome = await handleActivateBusinessAfterVerification(
      db,
      {
        rawToken: "verified-admin-token",
        referenceType: "phone_otp",
        businessId: "biz-1",
        idempotencyKey: "actep_key_1",
      },
      {
        verifier: { verify: async () => credentialFor("phone_otp", "authuid_admin", true) },
        now: () => NOW,
      },
    );

    expect(outcome.outcome).toBe("executed");
    expect(await businessStatus()).toBe("trial");
  });

  it("denies when the verified credential carries no second-factor evidence", async () => {
    await registerIdentity("authuid_admin2", "cust_admin2", "admin2");
    await seedAdmin("cust_admin2");
    await seedPendingBusiness();

    const outcome = await handleActivateBusinessAfterVerification(
      db,
      {
        rawToken: "verified-admin-token-no-mfa",
        referenceType: "phone_otp",
        businessId: "biz-1",
        idempotencyKey: "actep_key_2",
      },
      {
        verifier: { verify: async () => credentialFor("phone_otp", "authuid_admin2", false) },
        now: () => NOW,
      },
    );

    expect(outcome).toEqual({ outcome: "denied", reason: "NOT_PLATFORM_ADMINISTRATOR" });
    expect(await businessStatus()).toBe("pending_verification");
  });

  it("rejects a stale MFA-satisfying credential before the command runs (freshness gate)", async () => {
    await registerIdentity("authuid_admin3", "cust_admin3", "admin3");
    await seedAdmin("cust_admin3");
    await seedPendingBusiness();

    await expect(
      handleActivateBusinessAfterVerification(
        db,
        {
          rawToken: "verified-admin-token-stale",
          referenceType: "phone_otp",
          businessId: "biz-1",
          idempotencyKey: "actep_key_stale",
        },
        {
          verifier: {
            verify: async () =>
              credentialFor(
                "phone_otp",
                "authuid_admin3",
                true,
                new Date("2026-09-10T23:00:00.000Z"),
              ),
          },
          now: () => NOW,
        },
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(await businessStatus()).toBe("pending_verification");
  });

  it("fails before the command on an unverifiable token", async () => {
    await seedPendingBusiness();

    await expect(
      handleActivateBusinessAfterVerification(
        db,
        {
          rawToken: "",
          referenceType: "phone_otp",
          businessId: "biz-1",
          idempotencyKey: "actep_key_3",
        },
        {
          verifier: {
            verify: async () => {
              throw new Error("invalid token");
            },
          },
        },
      ),
    ).rejects.toThrow("invalid token");
    expect(await businessStatus()).toBe("pending_verification");
  });

  it("ignores spoofed client-supplied administrator fields", async () => {
    await registerIdentity("authuid_plain", "cust_plain", "plain");
    await seedPendingBusiness();

    const outcome = await handleActivateBusinessAfterVerification(
      db,
      {
        rawToken: "verified-plain-token",
        referenceType: "phone_otp",
        businessId: "biz-1",
        idempotencyKey: "actep_key_4",
        adminUserId: "cust_admin",
        role: "owner",
        targetStatus: "trial",
      } as unknown as {
        rawToken: string;
        referenceType: "phone_otp";
        businessId: string;
        idempotencyKey: string;
      },
      {
        verifier: { verify: async () => credentialFor("phone_otp", "authuid_plain", true) },
        now: () => NOW,
      },
    );

    // The caller is a plain customer: denied despite the spoofed fields, and
    // the business is untouched.
    expect(outcome).toEqual({ outcome: "denied", reason: "NOT_PLATFORM_ADMINISTRATOR" });
    expect(await businessStatus()).toBe("pending_verification");
  });
});
