// Builds the production web bundle for the phone preview into .preview/phone-dist.
// The bundle is an ordinary `vite build` (default mode, so none of the founder-qa/sign-in preview
// env files are read) pinned to the demo project + emulator mode, with the preview origin baked in.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "../lib/config.mjs";
import { PINNED_WEB_ENV } from "../lib/guards.mjs";
import { distDir } from "./config.mjs";

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

export function buildPhoneBundle({ publicHost }) {
  const origin = `https://${publicHost}`;
  const env = {
    ...process.env,
    ...PINNED_WEB_ENV,
    VITE_AUTH_ENABLE_EMAIL_PASSWORD: "true",
    VITE_FIREBASE_PREVIEW_ORIGIN: origin,
  };
  for (const name of [
    "VITE_FIREBASE_MEASUREMENT_ID",
    "VITE_APP_CHECK_SITE_KEY",
    "VITE_APP_CHECK_DEBUG_TOKEN",
  ]) {
    delete env[name];
  }
  fs.rmSync(distDir, { recursive: true, force: true });
  const result = spawnSync(
    "pnpm",
    ["--filter", "web", "exec", "vite", "build", "--outDir", distDir, "--emptyOutDir"],
    { cwd: repoRoot, env, stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error("vite build failed.");
  stripServiceWorker(distDir);
  return origin;
}
