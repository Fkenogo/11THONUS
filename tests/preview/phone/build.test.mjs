import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertBundleHost,
  phoneBuildProcessEnv,
  pinnedPhoneEnv,
  stripServiceWorker,
  writeBundleMeta,
  writeIsolatedEnvDir,
} from "./build.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "phone-build-"));

test("the child environment drops EVERY inherited VITE_* variable", () => {
  const env = phoneBuildProcessEnv({
    PATH: "/bin",
    VITE_APP_CHECK_SITE_KEY: "real",
    VITE_APP_CHECK_DEBUG_TOKEN: "real",
    VITE_OBSERVABILITY_ENABLED: "true",
    VITE_AUTH_ENABLE_PHONE_OTP: "true",
    VITE_ANYTHING: "x",
  });
  assert.deepEqual(env, { PATH: "/bin" });
});

test("the isolated env dir holds exactly the pinned preview variables", () => {
  const dir = writeIsolatedEnvDir("https://phone.example.test", path.join(tmp(), "env"));
  assert.deepEqual(fs.readdirSync(dir), [".env"]);
  const parsed = Object.fromEntries(
    fs
      .readFileSync(path.join(dir, ".env"), "utf8")
      .trim()
      .split("\n")
      .map((l) => l.split(/=(.*)/s).slice(0, 2)),
  );
  assert.deepEqual(parsed, pinnedPhoneEnv("https://phone.example.test"));
  assert.equal(parsed.VITE_FIREBASE_PROJECT_ID, "demo-11thonus");
  assert.equal(parsed.VITE_USE_FIREBASE_EMULATOR, "true");
  assert.equal(parsed.VITE_AUTH_ENABLE_GOOGLE_SIGN_IN, "false");
  assert.equal(parsed.VITE_AUTH_ENABLE_PHONE_OTP, "false");
  assert.equal(parsed.VITE_OBSERVABILITY_ENABLED, "false");
  assert.equal(parsed.VITE_FIREBASE_PREVIEW_ORIGIN, "https://phone.example.test");
  for (const forbidden of [
    "VITE_APP_CHECK_SITE_KEY",
    "VITE_APP_CHECK_DEBUG_TOKEN",
    "VITE_FIREBASE_MEASUREMENT_ID",
  ]) {
    assert.ok(!(forbidden in parsed), forbidden);
  }
});

test("bundle metadata binds the bundle to its host; a different host is refused", () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, "index.html"), "<html></html>");
  assert.throws(() => assertBundleHost("a.example.test", dir), /no build metadata/);
  writeBundleMeta(dir, "a.example.test");
  assert.equal(assertBundleHost("a.example.test", dir).origin, "https://a.example.test");
  assert.equal(assertBundleHost("A.Example.Test", dir).host, "a.example.test");
  assert.throws(
    () => assertBundleHost("b.example.test", dir),
    /built for a\.example\.test but --host is b\.example\.test/,
  );
});

test("service-worker artefacts are stripped from the copy", () => {
  const dir = tmp();
  for (const f of ["sw.js", "workbox-1.js", "registerSW.js", "manifest.webmanifest", "keep.js"])
    fs.writeFileSync(path.join(dir, f), "x");
  fs.writeFileSync(
    path.join(dir, "index.html"),
    '<script src="/registerSW.js"></script><link rel="manifest" href="/manifest.webmanifest"><div id="root"></div>',
  );
  stripServiceWorker(dir);
  assert.deepEqual(fs.readdirSync(dir).sort(), ["index.html", "keep.js"]);
  assert.equal(fs.readFileSync(path.join(dir, "index.html"), "utf8"), '<div id="root"></div>');
});
