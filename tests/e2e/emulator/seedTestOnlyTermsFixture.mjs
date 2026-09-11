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
// Fail-loud emulator guard: refuses to run (exit 1) unless it detects
// `FIRESTORE_EMULATOR_HOST` and/or a Firebase project id equal to the known
// demo project id (`demo-11thonus`) — mirrors the guard `firebase-admin`
// itself needs to talk to the emulator rather than a real project, made
// explicit and checked up front so a misconfigured environment fails loudly
// instead of silently doing nothing or, worse, touching a real project.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEMO_PROJECT_ID = "demo-11thonus";
export const TEST_ONLY_FIXTURE_TERMS_VERSION = "TEST_ONLY_FIXTURE_BUSINESS_TERMS_v0";

const projectId = process.env.GCLOUD_PROJECT ?? process.env.VITE_FIREBASE_PROJECT_ID ?? "";
const emulatorHostSet = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const isDemoProject = projectId === "" || projectId === DEMO_PROJECT_ID;

if (!emulatorHostSet) {
  // No emulator host at all — this must never run against a real project.
  console.error(
    "seedTestOnlyTermsFixture: refusing to run — FIRESTORE_EMULATOR_HOST is not set. " +
      "This script only ever seeds the Firebase Firestore Emulator, never a real project. " +
      "Start the emulator suite first (see README.md's clean-checkout local startup flow).",
  );
  process.exit(1);
}

if (!isDemoProject) {
  console.error(
    `seedTestOnlyTermsFixture: refusing to run — resolved project id "${projectId}" is not the ` +
      `known demo project ("${DEMO_PROJECT_ID}"). This script only ever seeds the demo emulator project.`,
  );
  process.exit(1);
}

// Resolve `require` against the `functions` package directory (not this
// file's own directory) so `firebase-admin` resolves from
// `functions/node_modules`, matching `seedCommerceKnowledge.mjs`'s existing
// convention for this exact kind of script.
const functionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../functions");
const require = createRequire(path.join(functionsDir, "package.json"));

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = DEMO_PROJECT_ID;

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
