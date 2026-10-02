// Founder Preview (EA-002) — the ONLY places the seed calls domain services in-process
// instead of a callable, and why:
//
//   • bootstrapPlatformAdministrator — by design never a callable ("never exported from
//     functions/src/index.ts"); it is the repository's own operator-bootstrap service.
//   • activateBusinessAfterVerificationCommand — a callable exists, but it requires an
//     ID token carrying a verified second-factor claim plus ≤5-minute fresh authentication.
//     Whether the Auth emulator can issue that claim is UNVERIFIED (EA-001 §15, D-9). The
//     seed therefore runs the SAME domain command in-process. The real checks inside the
//     command still run: an active `platformAdministrators` record, Terms revalidated in the
//     transaction, the pending_verification → trial transition. Only the second-factor
//     EVIDENCE is supplied by this (trusted, local) seed process. This is the seed
//     equivalent of how the repository's own emulator tests exercise the command; it is
//     NOT a production-path change and exists nowhere in `functions/src`.
//   • Commercial commands — implemented as services only; there is no Operator endpoint
//     (WP-COM-06a R-1). The seed does NOT fake one. Each command runs through its real
//     runner (`runAdministratorCommand`): administrator authority, idempotency, audit.
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { functionsDir, PROJECT_ID } from "../lib/config.mjs";
import { createSeedPool } from "../lib/postgres.mjs";

const requireFromFunctions = createRequire(path.join(functionsDir, "package.json"));
const lib = (p) => requireFromFunctions(`./lib/${p}.js`);

export function createAdminServices({ postgresUrl }) {
  // The guards (`assertLocalPreviewTarget`) have already pinned these before we are called.
  const { initializeApp, getApps, getApp } = requireFromFunctions("firebase-admin/app");
  const { getFirestore } = requireFromFunctions("firebase-admin/firestore");
  const appName = "founder-preview-seed";
  const app = getApps().some((a) => a.name === appName)
    ? getApp(appName)
    : initializeApp({ projectId: PROJECT_ID }, appName);
  const db = getFirestore(app);
  const pool = createSeedPool(postgresUrl);

  const { bootstrapPlatformAdministrator } = lib(
    "domains/platformAdministration/services/bootstrapPlatformAdministrator",
  );
  const { activateBusinessAfterVerificationCommand } = lib(
    "domains/business/services/businessActivationCommand",
  );
  const { firestorePlatformAdministratorRecordReader } = lib(
    "domains/commercial/services/commercialAuthority",
  );
  const commercial = {
    ...lib("domains/commercial/services/openCommercialAccount"),
    ...lib("domains/commercial/services/setPriceSchedule"),
    ...lib("domains/commercial/services/grantTrial"),
    ...lib("domains/commercial/services/adjustCommercialCredit"),
    ...lib("domains/commercial/services/recordSettlement"),
    ...lib("domains/commercial/services/confirmSettlement"),
    ...lib("domains/commercial/services/cancelSettlement"),
    ...lib("domains/commercial/services/voidSettlement"),
    ...lib("domains/commercial/services/activatePaidService"),
    ...lib("domains/commercial/services/commercialRestriction"),
  };
  const { reconcileCommercialConsumption } = lib(
    "domains/commercial/services/reconcileCommercialConsumption",
  );

  let counter = 0;
  const nextKey = (label) => `preview:admin:${String(++counter).padStart(5, "0")}:${label}`;
  const readAdministratorRecord = firestorePlatformAdministratorRecordReader(db);

  async function businessCountry(businessId) {
    const snapshot = await db.collection("businesses").doc(businessId).get();
    return snapshot.exists ? (snapshot.data().countryCode ?? null) : null;
  }

  return {
    db,
    pool,

    async bootstrapAdministrator(customerIdentityId) {
      return bootstrapPlatformAdministrator(db, {
        targetUserId: customerIdentityId,
        roles: ["knowledge_editor"],
        operatorReference: "founder-preview-seed",
        correlationId: randomUUID(),
        now: new Date(),
      });
    },

    async activateBusiness(adminId, businessId) {
      const outcome = await activateBusinessAfterVerificationCommand(db, {
        adminUserId: adminId,
        verifiedMfaSatisfied: true, // seed-supplied evidence; see header comment
        businessId,
        idempotencyKey: nextKey("activateBusiness"),
        requestHash: `business.activateAfterVerification:${businessId}:${adminId}`,
        correlationId: randomUUID(),
        now: new Date(),
        newId: randomUUID,
      });
      if (outcome.outcome !== "executed") {
        throw new Error(`Business activation did not execute: ${JSON.stringify(outcome)}`);
      }
      return outcome.result;
    },

    /** Runs one Commercial command through its real runner as the bootstrapped administrator. */
    async commercial(adminId, command, input) {
      const deps = { pool, readAdministratorRecord, resolveBusinessCountry: businessCountry };
      const context = {
        adminUserId: adminId,
        verifiedMfaSatisfied: true, // seed-supplied evidence; see header comment
        idempotencyKey: nextKey(command),
        correlationId: randomUUID(),
      };
      const response = await commercial[command](deps, context, input);
      return response.result;
    },

    async reconcileConsumption() {
      return reconcileCommercialConsumption(pool, { correlationId: randomUUID(), limit: 500 });
    },

    async close() {
      await pool.end();
    },
  };
}
