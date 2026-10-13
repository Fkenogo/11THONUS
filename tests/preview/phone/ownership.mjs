// The phone proxy may only ever front the canonical, guarded Founder Preview. Occupied ports are
// NOT evidence of that: this reuses the preview's own ownership/readiness mechanisms (owned emulator
// process launched for the canonical port fingerprint, emulator-specific readiness incl. the demo
// project, seed state) and adds identity probes of the Auth and Functions ports themselves.
import fs from "node:fs";
import path from "node:path";
import {
  LOOPBACK,
  PROJECT_ID,
  FUNCTIONS_REGION,
  emulatorPortFingerprint,
  ports,
  previewStateDir,
  urls,
} from "../lib/config.mjs";
import { previewEmulatorsReady, signIn } from "../lib/emulatorClient.mjs";
import { isOwnedWithConfig } from "../lib/processes.mjs";
import { loadIdentities } from "../seed/session.mjs";

async function getJson(fetchImpl, url) {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** True only for the Firebase Auth emulator (its root answers `{authEmulator:{ready:true}}`). */
export async function isAuthEmulator(base, fetchImpl = fetch) {
  try {
    return (await getJson(fetchImpl, `${base}/`))?.authEmulator?.ready === true;
  } catch {
    return false;
  }
}

/** True only for the Functions emulator serving the demo project's `ping` function. */
export async function isDemoFunctionsEmulator(base, fetchImpl = fetch) {
  try {
    return (
      (await getJson(fetchImpl, `${base}/${PROJECT_ID}/${FUNCTIONS_REGION}/ping`))?.status === "ok"
    );
  } catch {
    return false;
  }
}

function defaultSeeded() {
  const statePath = path.join(previewStateDir, "state.json");
  if (!fs.existsSync(statePath)) return Promise.resolve(false);
  const { identities, password } = loadIdentities();
  const operator = identities.find((i) => i.key === "operator");
  return signIn({ email: operator.email, password }).then(
    () => true,
    () => false,
  );
}

/**
 * Throws unless the canonical Founder Preview backend is running, owned by the preview tooling and
 * seeded. `deps` is injectable for tests.
 */
export async function assertPreviewBackendOwned(deps = {}) {
  const {
    owned = () => isOwnedWithConfig("emulators", emulatorPortFingerprint),
    ready = () => previewEmulatorsReady(),
    authIdentity = () => isAuthEmulator(`http://${LOOPBACK}:${ports.auth}`),
    functionsIdentity = () => isDemoFunctionsEmulator(`http://${LOOPBACK}:${ports.functions}`),
    seeded = defaultSeeded,
  } = deps;
  const fail = (why) => {
    throw new Error(
      `Refusing to start the phone proxy: ${why}\n` +
        "The phone preview only fronts the canonical Founder Preview started by `pnpm preview:start`. " +
        "It never exposes processes it did not start.",
    );
  };
  if (!owned()) {
    fail(
      `no preview-owned emulator process for the canonical port fingerprint (ports ${ports.auth}/${ports.functions} may be held by something else).`,
    );
  }
  if (!(await authIdentity()))
    fail(`the service on the Auth port (${ports.auth}) is not the Firebase Auth emulator.`);
  if (!(await functionsIdentity()))
    fail(
      `the service on the Functions port (${ports.functions}) is not the ${PROJECT_ID} Functions emulator.`,
    );
  if (!(await ready())) fail(`the emulators are not ready for the ${PROJECT_ID} project.`);
  if (!(await seeded())) fail("the preview is not seeded/consistent. Run `pnpm preview:reset`.");
}

export { urls };
