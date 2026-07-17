/**
 * Phase 0 scaffold placeholder.
 *
 * No product-domain Cloud Functions exist yet — domain functions are
 * introduced starting Phase 1 (ENG-P1-xxx), per each domain's ownership
 * rules in the Repository and Folder Standard.
 *
 * `ping` exists only to prove the Cloud Functions workspace builds,
 * lints, typechecks and deploys through the emulator; it carries no
 * business logic.
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";

setGlobalOptions({ maxInstances: 10 });

export const ping = onRequest((_request, response) => {
  response.status(200).json({ status: "ok" });
});
