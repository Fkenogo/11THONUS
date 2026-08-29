// One-off, explicitly-invoked Commerce Knowledge seed runner for local
// Firebase Emulator-backed Playwright E2E (Package H, ENG-P3-002-UI-IMP-H).
//
// Reuses the already-governed, idempotent `runCommerceKnowledgeSeed` loader
// (functions/src/domains/commerceKnowledge/seed/seedLoader.ts) against the
// `BURUNDI_PILOT_SEED_MANIFEST` — the same tool its own doc-comment describes
// as "if ever wired up, a manually-run operational script outside the
// request-serving path". This is exactly that: EST-01's Category/Type
// dropdowns (`useBusinessCategoriesQuery`/`useBusinessTypesQuery`) read real
// Commerce Knowledge nodes through `getBusinessCategories`/`getBusinessTypes`,
// so a live establishment-flow E2E test needs this data seeded in the
// Firestore emulator before it navigates to `/business/new`. No production
// code is added or modified to support this — it is test fixture setup only,
// run (via `require`d compiled output, matching `functions`' own CommonJS
// build) against `FIRESTORE_EMULATOR_HOST`, never a real project. Idempotent:
// safe to run once before the whole Playwright suite (see
// `tests/e2e/emulator/globalSetup.ts`) or repeatedly by hand.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolve `require` against the `functions` package directory (not this
// file's own directory) so `firebase-admin` and the compiled seed modules
// both resolve from `functions/node_modules`, matching how `functions` runs
// its own emulator tests.
const functionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../functions");
const require = createRequire(path.join(functionsDir, "package.json"));

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT ?? "demo-11thonus";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { runCommerceKnowledgeSeed } = require("./lib/domains/commerceKnowledge/seed/seedLoader.js");
const {
  BURUNDI_PILOT_SEED_MANIFEST,
} = require("./lib/domains/commerceKnowledge/seed/burundiPilotSeedManifest.js");

initializeApp({ projectId: "demo-11thonus" });
const db = getFirestore();

const result = await runCommerceKnowledgeSeed(db, BURUNDI_PILOT_SEED_MANIFEST, { now: new Date() });
console.log(
  `Commerce Knowledge seed: created=${result.created.length} unchanged=${result.unchanged.length} reconciled=${result.reconciled.length} (manifestVersion=${result.manifestVersion})`,
);
