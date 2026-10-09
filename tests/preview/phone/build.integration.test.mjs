// Real `vite build` of the phone bundle with a contaminated apps/web env: proves developer-local
// settings (.env*.local files AND process VITE_* variables) cannot reach the phone bundle.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../lib/config.mjs";
import { buildPhoneBundle } from "./build.mjs";

const webDir = path.join(repoRoot, "apps/web");
const sentinelFile = path.join(webDir, ".env.production.local");
const SENTINELS = {
  VITE_APP_CHECK_SITE_KEY: "SENTINEL_APPCHECK_SITE_KEY",
  VITE_APP_CHECK_DEBUG_TOKEN: "SENTINEL_APPCHECK_DEBUG_TOKEN",
  VITE_OBSERVABILITY_ENABLED: "true",
  VITE_AUTH_ENABLE_PHONE_OTP: "true",
  VITE_AUTH_ENABLE_GOOGLE_SIGN_IN: "true",
  VITE_FIREBASE_PROJECT_ID: "sentinel-real-project",
  VITE_FIREBASE_API_KEY: "SENTINEL_REAL_API_KEY",
  VITE_FIREBASE_MEASUREMENT_ID: "G-SENTINEL",
  VITE_SENTRY_DSN: "https://SENTINEL@sentry.invalid/1",
};

test("contaminated apps/web env files and VITE_* process variables do not enter the phone build", async () => {
  assert.ok(
    !fs.existsSync(sentinelFile),
    "refusing to overwrite an existing .env.production.local",
  );
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "phone-contam-"));
  fs.writeFileSync(
    sentinelFile,
    Object.entries(SENTINELS)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n"),
  );
  const saved = { ...process.env };
  Object.assign(process.env, SENTINELS);
  try {
    // Control: Vite's default env loading DOES see the contamination, so the assertions below are not vacuous.
    const vitePath = createRequire(path.join(webDir, "package.json")).resolve("vite");
    const { loadEnv } = await import(pathToFileURL(vitePath).href);
    const defaultLoad = loadEnv("production", webDir, "VITE_");
    assert.equal(defaultLoad.VITE_APP_CHECK_SITE_KEY, SENTINELS.VITE_APP_CHECK_SITE_KEY);

    buildPhoneBundle({
      publicHost: "phone-contam.example.test",
      outDir: path.join(out, "dist"),
      envDir: path.join(out, "env"),
    });

    const files = fs.readdirSync(path.join(out, "dist", "assets")).filter((f) => f.endsWith(".js"));
    const bundle = files
      .map((f) => fs.readFileSync(path.join(out, "dist", "assets", f), "utf8"))
      .join("\n");
    for (const value of Object.values(SENTINELS)) {
      if (/^(true)$/.test(value)) continue;
      assert.ok(!bundle.includes(value), `contamination leaked into the bundle: ${value}`);
    }
    assert.ok(!bundle.includes("sentry.invalid"));
    assert.ok(bundle.includes("demo-11thonus"), "pinned demo project is present");
    assert.ok(
      bundle.includes("https://phone-contam.example.test"),
      "pinned preview origin is present",
    );
    assert.ok(!bundle.includes("sentinel-real-project"));
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
    fs.rmSync(sentinelFile, { force: true });
    fs.rmSync(out, { recursive: true, force: true });
  }
});
