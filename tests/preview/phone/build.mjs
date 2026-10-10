// Builds the production web bundle for the phone preview into .preview/phone-dist.
//
// The build is hermetic: Vite is pointed at a generated, isolated `envDir` that contains ONLY the
// pinned preview-safe variables below, and every inherited `VITE_*` process variable is removed.
// Vite therefore never reads apps/web/.env.local (or any other .env* file), so a developer's real
// App Check key, debug token, observability settings or Google/Phone sign-in flags cannot reach the
// bundle. The bundle's host is recorded in phone-preview.json and enforced at start.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { previewStateDir, repoRoot } from "../lib/config.mjs";
import { PINNED_WEB_ENV } from "../lib/guards.mjs";
import { BUNDLE_META_FILE, distDir } from "./config.mjs";

export const phoneEnvDir = path.join(previewStateDir, "phone-env");
const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "build-worker.mjs");

/** The ONLY VITE_* values the phone bundle may contain. */
export function pinnedPhoneEnv(origin) {
  return {
    ...PINNED_WEB_ENV,
    VITE_AUTH_ENABLE_EMAIL_PASSWORD: "true",
    VITE_AUTH_ENABLE_GOOGLE_SIGN_IN: "false",
    VITE_AUTH_ENABLE_PHONE_OTP: "false",
    VITE_OBSERVABILITY_ENABLED: "false",
    VITE_FIREBASE_PREVIEW_ORIGIN: origin,
  };
}

/** Child-process environment: the caller's environment minus every VITE_* variable. */
export function phoneBuildProcessEnv(baseEnv) {
  return Object.fromEntries(Object.entries(baseEnv).filter(([key]) => !key.startsWith("VITE_")));
}

/** Writes the isolated env dir (a single `.env`) and returns its path. */
export function writeIsolatedEnvDir(origin, dir = phoneEnvDir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const body = Object.entries(pinnedPhoneEnv(origin))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  fs.writeFileSync(path.join(dir, ".env"), `${body}\n`);
  return dir;
}

/** Removes PWA artefacts: a service worker must never outlive a torn-down temporary preview. */
export function stripServiceWorker(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (/^(sw\.js|registerSW\.js|workbox-.*\.js|manifest\.webmanifest)(\.map)?$/.test(name)) {
      fs.rmSync(path.join(dir, name), { force: true });
    }
  }
  const indexPath = path.join(dir, "index.html");
  const html = fs
    .readFileSync(indexPath, "utf8")
    .replace(/<script[^>]*registerSW\.js[^>]*><\/script>/g, "")
    .replace(/<link[^>]*rel="manifest"[^>]*>/g, "");
  fs.writeFileSync(indexPath, html);
}

export function writeBundleMeta(dir, host) {
  fs.writeFileSync(
    path.join(dir, BUNDLE_META_FILE),
    `${JSON.stringify({ host, origin: `https://${host}`, builtAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

export function readBundleMeta(dir = distDir) {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, BUNDLE_META_FILE), "utf8"));
    return typeof meta.host === "string" ? meta : undefined;
  } catch {
    return undefined;
  }
}

/** Refuses to serve a bundle built for a different hostname than the one requested. */
export function assertBundleHost(host, dir = distDir) {
  const meta = readBundleMeta(dir);
  if (!meta) {
    throw new Error(
      "The phone bundle has no build metadata. Rebuild: `pnpm preview:phone build --host <host>`.",
    );
  }
  if (meta.host !== host.toLowerCase()) {
    throw new Error(
      `The phone bundle was built for ${meta.host} but --host is ${host}. Rebuild for this host: ` +
        "`pnpm preview:phone build --host <host>`.",
    );
  }
  return meta;
}

export function buildPhoneBundle({ publicHost, outDir = distDir, envDir = phoneEnvDir }) {
  const host = publicHost.toLowerCase();
  const origin = `https://${host}`;
  writeIsolatedEnvDir(origin, envDir);
  fs.rmSync(outDir, { recursive: true, force: true });
  const result = spawnSync(process.execPath, [workerPath, envDir, outDir], {
    cwd: repoRoot,
    env: phoneBuildProcessEnv(process.env),
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("vite build failed.");
  stripServiceWorker(outDir);
  writeBundleMeta(outDir, host);
  return origin;
}
