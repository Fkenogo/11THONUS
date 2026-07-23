/**
 * Cloud Functions entry point.
 *
 * No product-domain Cloud Functions exist yet — domain functions are
 * introduced starting Phase 2 (ENG-P2-xxx), per each domain's ownership
 * rules in the Repository and Folder Standard. This file wires the shared
 * platform foundation (ENG-P1-001): global function options (region), the
 * Admin SDK singleton every future domain service reuses, and `ping`,
 * which exists only to prove the Cloud Functions workspace builds, lints,
 * typechecks and deploys through the emulator — it carries no business
 * logic.
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { PLATFORM_REGION } from "./config/region";
import { getAdminApp } from "./infrastructure/firebase/admin";

setGlobalOptions({ region: PLATFORM_REGION, maxInstances: 10 });

// Initializes the shared Admin SDK app once, at module load, so every
// domain service added in later work packages can call `getAdminApp()`
// and reuse the same instance rather than re-initializing.
getAdminApp();

export const ping = onRequest((_request, response) => {
  response.status(200).json({ status: "ok" });
});
