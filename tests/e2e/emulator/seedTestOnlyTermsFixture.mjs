// TEST_ONLY_FIXTURE Business Terms seed runner (`PRODUCT-ALIGN-002`,
// `FD-PREVIEW-TERMS-001`).
//
// Founder-authorized scope: local/emulator Founder-preview flows may use an
// explicitly test-only `TEST_ONLY_FIXTURE_*` Terms record so a Founder can
// exercise the Business Terms acceptance path against the Firebase Emulator
// Suite without a real, governed Terms version. This does **not** authorize
// any production/staging Terms content, and it does **not** touch or weaken
// `functions/src/domains/business/services/businessLifecycleCommand.ts`'s
// `assertCurrentBusinessTermsAccepted` fail-closed gate, nor any other
// production Terms path — this script only ever writes to the Firestore
// Emulator, and only after verifying it is actually talking to one.
//
// What it writes: the same `platformConfig/businessTerms` document
// `functions/src/domains/business/repositories/businessTermsConfigRepository.ts`
// reads (`currentVersion`, a string) — that repository's own docs state this
// collection has "No client write path" and is populated "exclusively by
// direct, server-side/ops action ... or, in tests, by direct emulator
// seeding" (its own words). This script is exactly that: a manually-run,
// emulator-only seed, never invoked from request-serving code.
//
// `TEST_ONLY_FIXTURE_*` naming: the seeded `currentVersion` value is
// `TEST_ONLY_FIXTURE_BUSINESS_TERMS_v0` — deliberately shaped so it can never
// be mistaken for, or accidentally match, a real governed Terms version
// string (no `"v1"`/date-stamped/semver-looking value is used).
//
// Fail-loud emulator guard (`PRODUCT-ALIGN-002-CORR-001` hardening): refuses
// to run (exit 1) unless EVERY one of the following is explicitly true, with
// no `??`/`||`/default-parameter fallback anywhere in the check — an empty,
// missing, or wrong value always fails closed, never silently substitutes
// the known-good demo value:
//   1. `FIRESTORE_EMULATOR_HOST` is set, non-empty, and its host is loopback
//      (`127.0.0.1` or `localhost`) — any other host is rejected.
//   2. `FIREBASE_AUTH_EMULATOR_HOST`, if set at all, is also loopback-only
//      (this script does not require it to be set, but if present it must
//      not point anywhere but the emulator).
//   3. The resolved project id (`GCLOUD_PROJECT` or `VITE_FIREBASE_PROJECT_ID`
//      — whichever is set) is set, non-empty, and is *exactly*
//      `demo-11thonus` — not merely "starts with demo-", not "empty is fine".
// This mirrors the guard `firebase-admin` itself needs to talk to the
// emulator rather than a real project, made explicit and checked up front so
// a misconfigured environment fails loudly instead of silently doing
// nothing or, worse, touching a real project.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEMO_PROJECT_ID = "demo-11thonus";
export const TEST_ONLY_FIXTURE_TERMS_VERSION = "TEST_ONLY_FIXTURE_BUSINESS_TERMS_v0";

function isLoopbackHost(hostAndPort) {
  const host = hostAndPort.split(":")[0];
  return host === "127.0.0.1" || host === "localhost";
}

function fail(message) {
  console.error(`seedTestOnlyTermsFixture: refusing to run — ${message}`);
  process.exit(1);
}

const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (typeof firestoreEmulatorHost !== "string" || firestoreEmulatorHost.length === 0) {
  fail(
    "FIRESTORE_EMULATOR_HOST is not set. This script only ever seeds the Firebase " +
      "Firestore Emulator, never a real project. Start the emulator suite first " +
      "(see README.md's clean-checkout local startup flow).",
  );
}
if (!isLoopbackHost(firestoreEmulatorHost)) {
  fail(
    `FIRESTORE_EMULATOR_HOST ("${firestoreEmulatorHost}") is not a loopback address. ` +
      "This script refuses to talk to any non-local Firestore endpoint.",
  );
}

const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (typeof authEmulatorHost === "string" && authEmulatorHost.length > 0 && !isLoopbackHost(authEmulatorHost)) {
  fail(
    `FIREBASE_AUTH_EMULATOR_HOST ("${authEmulatorHost}") is not a loopback address. ` +
      "This script refuses to run alongside a non-local Auth emulator endpoint.",
  );
}

// Deliberately no `??`/`||` fallback chain: each candidate var is checked in
// isolation and only an explicit, non-empty, exact match is accepted.
const gcloudProjectId = process.env.GCLOUD_PROJECT;
const viteProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
const hasGcloudProjectId = typeof gcloudProjectId === "string" && gcloudProjectId.length > 0;
const hasViteProjectId = typeof viteProjectId === "string" && viteProjectId.length > 0;

if (!hasGcloudProjectId && !hasViteProjectId) {
  fail(
    "no project id is set (checked GCLOUD_PROJECT and VITE_FIREBASE_PROJECT_ID). " +
      `This script only ever seeds the known demo project ("${DEMO_PROJECT_ID}") and never ` +
      "substitutes a default when the project id is empty or missing.",
  );
}
if (hasGcloudProjectId && gcloudProjectId !== DEMO_PROJECT_ID) {
  fail(
    `GCLOUD_PROJECT ("${gcloudProjectId}") is not exactly the known demo project id ` +
      `("${DEMO_PROJECT_ID}"). This script only ever seeds the demo emulator project.`,
  );
}
if (hasViteProjectId && viteProjectId !== DEMO_PROJECT_ID) {
  fail(
    `VITE_FIREBASE_PROJECT_ID ("${viteProjectId}") is not exactly the known demo project id ` +
      `("${DEMO_PROJECT_ID}"). This script only ever seeds the demo emulator project.`,
  );
}

// Resolve `require` against the `functions` package directory (not this
// file's own directory) so `firebase-admin` resolves from
// `functions/node_modules`, matching `seedCommerceKnowledge.mjs`'s existing
// convention for this exact kind of script.
const functionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../functions");
const require = createRequire(path.join(functionsDir, "package.json"));

// No substitution/default here either — both env vars were already verified
// above to be exactly what this script requires; GCLOUD_PROJECT is set only
// when it wasn't already the verified value, never overwritten with a
// silently-substituted default.
if (!hasGcloudProjectId) {
  process.env.GCLOUD_PROJECT = DEMO_PROJECT_ID;
}

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ projectId: DEMO_PROJECT_ID });
const db = getFirestore();

await db.collection("platformConfig").doc("businessTerms").set({
  currentVersion: TEST_ONLY_FIXTURE_TERMS_VERSION,
  __testOnlyFixture: true,
  seededAt: new Date().toISOString(),
});

console.log(
  `TEST_ONLY_FIXTURE Business Terms seed: platformConfig/businessTerms.currentVersion = "${TEST_ONLY_FIXTURE_TERMS_VERSION}" (project=${DEMO_PROJECT_ID})`,
);
