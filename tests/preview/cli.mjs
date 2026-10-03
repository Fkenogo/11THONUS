#!/usr/bin/env node
// Founder Preview (EA-002) — the one entry point:  pnpm preview:<command>
//
//   start    bring up (or reuse) PostgreSQL, migrations, emulators, the seeded dataset and the web app
//   stop     stop the web server and emulators it started (PostgreSQL is left running; never wiped)
//   status   what is running, migration level, seed state
//   reset    guarded wipe → migrate → reseed: returns to the same deterministic state
//   seed     seed a clean preview (refuses if data already exists — use `reset`)
//   migrate  apply canonical migrations to the local preview database only
//   verify   compare the live data to the committed expected fingerprint
//   accounts print the preview identities and counter artifacts
//
// Local only. Every destructive/writing command first runs the production-safety guards
// (`lib/guards.mjs`); they refuse anything that is not loopback + `demo-11thonus` +
// `PLATFORM_ENV=local` + the `eleventhonus_platform_local` database + gate off.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  PREVIEW_DATABASE,
  emulatorPortFingerprint,
  ports,
  previewStateDir,
  repoRoot,
  urls,
} from "./lib/config.mjs";
import {
  clearAuthAccounts,
  clearFirestore,
  previewEmulatorsReady,
  signIn,
} from "./lib/emulatorClient.mjs";
import { PreviewGuardError, assertLocalPreviewTarget } from "./lib/guards.mjs";
import {
  migratePostgres,
  resolvePostgresUrl,
  resetPostgresSchema,
  startComposePostgres,
  usesComposeDatabase,
  waitForPostgres,
  withClient,
} from "./lib/postgres.mjs";
import { ensureStateDirs, isOwnedWithConfig } from "./lib/processes.mjs";
import {
  buildFunctions,
  previewEnv,
  processStatus,
  startEmulators,
  startWebServer,
  stopPreviewProcesses,
} from "./lib/runtime.mjs";
import { computeFingerprint } from "./seed/fingerprint.mjs";
import { runFounderSlice1 } from "./seed/scenario.mjs";
import { loadIdentities } from "./seed/session.mjs";
import { verifyPreviewAccounts } from "./lib/identityVerification.mjs";

const statePath = path.join(previewStateDir, "state.json");
const expectedPath = path.join(repoRoot, "tests/preview/expected-fingerprint.json");
const log = (message = "") => console.log(message);

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return undefined;
  }
}

function writeState(state) {
  ensureStateDirs();
  fs.writeFileSync(
    statePath,
    `${JSON.stringify({ seededAt: new Date().toISOString(), ...state }, null, 2)}\n`,
  );
}

/** Pins this process to the preview target (and proves it) before anything touches data. */
function pinTarget() {
  const postgresUrl = resolvePostgresUrl();
  const env = previewEnv(postgresUrl);
  assertLocalPreviewTarget(env, { postgresUrl });
  // The in-process seed uses the Admin SDK: point it at the emulators, never a real project.
  for (const key of [
    "PLATFORM_ENV",
    "PLATFORM_POSTGRES_URL",
    "GCLOUD_PROJECT",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
  ]) {
    process.env[key] = env[key];
  }
  delete process.env.PURCHASE_ADMISSION_GATE_MODE;
  return { postgresUrl, env };
}

function checkPrerequisites() {
  const problems = [];
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  if (major < 20) problems.push(`Node 20+ is required (found ${process.versions.node}).`);
  if (spawnSync("pnpm", ["--version"], { stdio: "ignore" }).status !== 0)
    problems.push("pnpm is not installed.");
  const java = spawnSync("java", ["-version"], { encoding: "utf8" });
  const match = `${java.stderr}${java.stdout}`.match(/version "(\d+)/);
  if (java.error || !match)
    problems.push("Java 21+ is required by the Firestore emulator (java not found).");
  else if (Number.parseInt(match[1], 10) < 21)
    problems.push(`Java 21+ is required by the Firestore emulator (found ${match[1]}).`);
  if (
    usesComposeDatabase() &&
    spawnSync("docker", ["--version"], { stdio: "ignore" }).status !== 0
  ) {
    problems.push("Docker is required for the local PostgreSQL (or set PREVIEW_POSTGRES_URL).");
  }
  if (!fs.existsSync(path.join(repoRoot, "node_modules")))
    problems.push("Run `pnpm install` first.");
  if (problems.length > 0)
    throw new Error(`Prerequisites not met:\n  - ${problems.join("\n  - ")}`);
}

async function ensurePostgres(postgresUrl) {
  if (usesComposeDatabase()) {
    log("→ PostgreSQL: docker compose (docker-compose.postgres.yml)");
    startComposePostgres();
  } else {
    log("→ PostgreSQL: using PREVIEW_POSTGRES_URL");
  }
  await waitForPostgres(postgresUrl);
}

function runExistingSeed(script, env) {
  const result = spawnSync("node", [path.join(repoRoot, "tests/e2e/emulator", script)], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} failed.`);
}

async function seedBaseData(env) {
  log(
    "→ Reference data: Commerce Knowledge seed + test-only Terms fixture (existing seed scripts)",
  );
  runExistingSeed("seedCommerceKnowledge.mjs", env);
  runExistingSeed("seedTestOnlyTermsFixture.mjs", env);
}

async function databaseIsSeeded(postgresUrl) {
  try {
    return await withClient(postgresUrl, async (client) => {
      const r = await client.query("SELECT count(*)::int AS n FROM reward_programs");
      return r.rows[0].n > 0;
    });
  } catch {
    return false; // schema not migrated yet
  }
}

async function seedIsCoherent(postgresUrl) {
  const { identities, password } = loadIdentities();
  const state = readState();
  if (!state || !(await databaseIsSeeded(postgresUrl))) return false;
  try {
    const failures = await verifyPreviewAccounts(identities, password, signIn);
    if (failures.length > 0) {
      log(`→ Preview Auth accounts missing or invalid: ${failures.join(", ")}`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function ensureEmulators(env) {
  if (isOwnedWithConfig("emulators", emulatorPortFingerprint) && (await previewEmulatorsReady()))
    return;
  log("→ Building Functions (pnpm --filter functions build)");
  buildFunctions(env);
  log("→ Starting Firebase emulators (Auth, Functions, Firestore, UI)");
  await startEmulators(env);
}

async function seedScenario(postgresUrl) {
  log("→ Seeding scenario founder-slice-1 through real callables/services");
  const state = await runFounderSlice1({ postgresUrl, log });
  const fingerprint = await computeFingerprint({ postgresUrl, state });
  writeState({ ...state, fingerprint });
  return { state, fingerprint };
}

async function commandMigrate() {
  const { postgresUrl } = pinTarget();
  await ensurePostgres(postgresUrl);
  log("→ Building Functions (migration runner is compiled from functions/)");
  buildFunctions(previewEnv(postgresUrl));
  const result = await migratePostgres(postgresUrl);
  log(
    `Migrations applied: ${result.applied.length ? result.applied.join(", ") : "none (already current)"}`,
  );
  log(`Already applied: ${result.alreadyApplied.length}`);
}

async function commandReset({ startRuntime = true, skipBuild = false } = {}) {
  checkPrerequisites();
  const { postgresUrl, env } = pinTarget();
  await ensurePostgres(postgresUrl);
  if (!skipBuild) {
    log("→ Building Functions");
    buildFunctions(env);
  }
  if (startRuntime) await ensureEmulators(env);
  if (
    !isOwnedWithConfig("emulators", emulatorPortFingerprint) ||
    !(await previewEmulatorsReady())
  ) {
    throw new Error("The owned demo-project Firebase emulators are not ready.");
  }

  log("→ RESET: wiping emulator data and the local preview database");
  await clearFirestore();
  await clearAuthAccounts();
  await resetPostgresSchema(postgresUrl);
  const migrated = await migratePostgres(postgresUrl);
  log(`   migrations applied: ${migrated.applied.length}`);
  await seedBaseData(env);
  const result = await seedScenario(postgresUrl);
  log("→ Reset complete.");
  return result;
}

async function commandStart() {
  checkPrerequisites();
  const { postgresUrl, env } = pinTarget();
  await ensurePostgres(postgresUrl);
  log("→ Building Functions");
  buildFunctions(env);
  const migrated = await migratePostgres(postgresUrl);
  log(
    `→ Migrations: ${migrated.applied.length ? `applied ${migrated.applied.length}` : "already current"}`,
  );
  await ensureEmulators(env);
  await seedBaseData(env);

  if (await seedIsCoherent(postgresUrl)) {
    log(
      "→ Seeded Founder Preview data found and consistent — keeping it (use `pnpm preview:reset` to return to the pristine state).",
    );
  } else {
    log(
      "→ No consistent seed found (first run, or the emulators were restarted) — resetting to the deterministic state.",
    );
    await commandReset({ startRuntime: false, skipBuild: true });
  }

  log("→ Starting the web app");
  if (processStatus().web.startsWith("running")) log("   already running");
  else await startWebServer(env);
  printSummary();
}

function printSummary() {
  const state = readState();
  log("");
  log("────────────────────────────────────────────────────────────");
  log(" 11thONUS Founder Preview is running (local only)");
  log("────────────────────────────────────────────────────────────");
  log(` Web app        ${urls.web}`);
  log(` Emulator UI    ${urls.emulatorUi}   (local debugging only)`);
  log(` Database       postgres localhost:${ports.postgres}/${PREVIEW_DATABASE}`);
  log(" Sign in        Email/Password at the web app — accounts and the shared");
  log("                preview-only password: `pnpm preview:accounts`");
  if (state) log(` Seeded         ${state.seededAt}`);
  log(" Reset          pnpm preview:reset      Stop: pnpm preview:stop");
  log("────────────────────────────────────────────────────────────");
}

async function commandStop() {
  const stopped = await stopPreviewProcesses();
  log(
    stopped.length ? `Stopped: ${stopped.join(", ")}` : "Nothing of the preview's own was running.",
  );
  log("PostgreSQL (if started via docker compose) is left running; data is never wiped by `stop`.");
}

async function commandStatus() {
  const status = processStatus();
  const emulatorReady =
    isOwnedWithConfig("emulators", emulatorPortFingerprint) && (await previewEmulatorsReady());
  log(`Web app:      ${status.web}   ${urls.web}`);
  log(`Emulators:    ${status.emulators}   (ready: ${emulatorReady ? "yes" : "no"})`);
  let postgresUrl;
  try {
    postgresUrl = resolvePostgresUrl();
    await waitForPostgres(postgresUrl, { timeoutMs: 3000 });
    const applied = await withClient(postgresUrl, async (c) => {
      try {
        return (await c.query("SELECT count(*)::int AS n FROM schema_migrations")).rows[0].n;
      } catch {
        return 0;
      }
    });
    log(`PostgreSQL:   reachable, ${applied} migrations applied (${PREVIEW_DATABASE})`);
    log(
      `Seeded:       ${(await seedIsCoherent(postgresUrl)) ? "yes (consistent)" : "no / inconsistent"}`,
    );
  } catch (error) {
    log(`PostgreSQL:   not reachable (${error.message})`);
  }
  const state = readState();
  if (state) log(`Last seed:    ${state.seededAt}`);
}

async function commandSeed() {
  checkPrerequisites();
  const { postgresUrl, env } = pinTarget();
  if (
    !isOwnedWithConfig("emulators", emulatorPortFingerprint) ||
    !(await previewEmulatorsReady())
  ) {
    throw new Error("Start the owned Founder Preview emulators first (`pnpm preview:start`).");
  }
  if (await databaseIsSeeded(postgresUrl)) {
    throw new Error(
      "The preview database already contains data. Run `pnpm preview:reset` for a clean, deterministic reseed.",
    );
  }
  await seedBaseData(env);
  await seedScenario(postgresUrl);
}

async function commandVerify({ write = false } = {}) {
  const { postgresUrl } = pinTarget();
  const state = readState();
  if (!state)
    throw new Error("No seed state found. Run `pnpm preview:start` or `pnpm preview:reset`.");
  const live = await computeFingerprint({ postgresUrl, state });
  const liveJson = `${JSON.stringify(live, null, 2)}\n`;
  if (write) {
    fs.writeFileSync(expectedPath, liveJson);
    log(`Wrote ${path.relative(repoRoot, expectedPath)}`);
    return;
  }
  const expected = fs.readFileSync(expectedPath, "utf8");
  if (expected !== liveJson) {
    const tmp = path.join(previewStateDir, "live-fingerprint.json");
    fs.writeFileSync(tmp, liveJson);
    throw new Error(
      `Live data differs from tests/preview/expected-fingerprint.json.\n  Live fingerprint written to ${path.relative(repoRoot, tmp)} — diff the two files.`,
    );
  }
  log("Founder Preview data matches the expected deterministic fingerprint.");
}

function commandAccounts() {
  const { password, identities } = loadIdentities();
  const state = readState();
  log(`Shared preview-only password (emulator only): ${password}`);
  log("");
  for (const i of identities) {
    const artifact = state?.identities?.[i.key];
    const extra = artifact?.loyaltyNumber
      ? `   LN ${artifact.loyaltyNumber}  QR ${artifact.qrReference}`
      : "";
    log(
      `${i.role.padEnd(17)} ${i.email.padEnd(46)} ${i.displayName}${i.business ? ` — ${i.business}` : ""}${extra}`,
    );
  }
}

const [command = "help", ...flags] = process.argv.slice(2);
const commands = {
  start: commandStart,
  stop: commandStop,
  status: commandStatus,
  reset: () => commandReset(),
  seed: commandSeed,
  migrate: commandMigrate,
  verify: () => commandVerify({ write: flags.includes("--write") }),
  accounts: async () => commandAccounts(),
};

if (!commands[command]) {
  log(`Usage: node tests/preview/cli.mjs <${Object.keys(commands).join("|")}>`);
  process.exit(command === "help" ? 0 : 1);
}

try {
  await commands[command]();
  process.exit(0);
} catch (error) {
  if (error instanceof PreviewGuardError) console.error(`\n${error.message}\n`);
  else console.error(`\nFounder Preview \`${command}\` failed: ${error.message}\n`);
  process.exit(1);
}
