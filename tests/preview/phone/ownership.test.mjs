import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPreviewBackendOwned,
  isAuthEmulator,
  isDemoFunctionsEmulator,
} from "./ownership.mjs";
import { close, listen, recordingServer } from "./test-harness.mjs";

const good = {
  owned: () => true,
  ready: async () => true,
  authIdentity: async () => true,
  functionsIdentity: async () => true,
  seeded: async () => true,
};
const rejects = (deps, pattern) =>
  assert.rejects(() => assertPreviewBackendOwned({ ...good, ...deps }), pattern);

test("correct owned, ready, seeded preview passes", async () => {
  await assertPreviewBackendOwned(good);
});

test("wrong / stale process (not owned for the canonical fingerprint) is refused", async () => {
  await rejects({ owned: () => false }, /no preview-owned emulator process/);
});

test("unrelated service on the Auth port is refused", async () => {
  await rejects({ authIdentity: async () => false }, /not the Firebase Auth emulator/);
});

test("unrelated service on the Functions port is refused", async () => {
  await rejects(
    { functionsIdentity: async () => false },
    /not the demo-11thonus Functions emulator/,
  );
});

test("emulators not ready for the demo project, or unseeded preview, is refused", async () => {
  await rejects({ ready: async () => false }, /not ready/);
  await rejects({ seeded: async () => false }, /not seeded/);
});

test("identity probes accept the real shapes and reject unrelated servers", async () => {
  const json = (body) => (req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(body));
  };
  const authReal = recordingServer(json({ authEmulator: { ready: true } }));
  const fnReal = recordingServer(json({ status: "ok" }));
  const html = recordingServer((req, res) => res.end("<html>some other app</html>"));
  const ports = await Promise.all([
    listen(authReal.server),
    listen(fnReal.server),
    listen(html.server),
  ]);
  const base = (i) => `http://127.0.0.1:${ports[i]}`;
  assert.equal(await isAuthEmulator(base(0)), true);
  assert.equal(await isAuthEmulator(base(2)), false);
  assert.equal(await isAuthEmulator(base(1)), false); // a Functions ping body is not an Auth emulator
  assert.equal(await isDemoFunctionsEmulator(base(1)), true);
  assert.equal(await isDemoFunctionsEmulator(base(2)), false);
  assert.equal(await isDemoFunctionsEmulator("http://127.0.0.1:1"), false); // nothing listening
  await Promise.all([close(authReal.server), close(fnReal.server), close(html.server)]);
});
