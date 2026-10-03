// Founder Preview (EA-002) — start/stop of the preview runtime: PostgreSQL, the
// Firebase emulators (Auth, Functions, Firestore, UI) and the web dev server.
// Reuses the repository's own commands (`pnpm --filter functions build`, `firebase
// emulators:start --project demo-11thonus`, `pnpm --filter web dev`).
import { spawnSync } from "node:child_process";
import { PROJECT_ID, ports, repoRoot, urls } from "./config.mjs";
import { buildPreviewEnv } from "./guards.mjs";
import { emulatorsReady, emulatorUiReady } from "./emulatorClient.mjs";
import { assertEmulatorPortsFree, isPortFree } from "./ports.mjs";
import {
  isOwnedAndAlive,
  readPid,
  startDetached,
  stopDetached,
  tailLog,
  waitFor,
} from "./processes.mjs";

/**
 * Optional escape hatch for sandboxed/corporate networks whose HTTP proxy intercepts
 * loopback traffic and breaks the emulators' own local calls. Off by default.
 */
function withOptionalProxyStrip(env) {
  if (env.PREVIEW_STRIP_PROXY !== "1") return env;
  const cleaned = { ...env };
  for (const key of Object.keys(cleaned)) {
    if (/^(https?_proxy|all_proxy|global_agent_.*|docker_https_proxy|yarn_https_proxy)$/i.test(key)) {
      delete cleaned[key];
    }
  }
  cleaned.JAVA_TOOL_OPTIONS = "";
  return cleaned;
}

export function previewEnv(postgresUrl) {
  return withOptionalProxyStrip(buildPreviewEnv(process.env, { postgresUrl, ports }));
}

export function buildFunctions(env) {
  const result = spawnSync("pnpm", ["--filter", "functions", "run", "build"], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("`pnpm --filter functions run build` failed.");
}

export async function startEmulators(env) {
  // Reuse only a complete, positively owned preview. A managed but stale/incomplete instance is
  // safe to restart; an unowned listener is never queried, stopped or modified.
  if (isOwnedAndAlive("emulators")) {
    if ((await emulatorsReady()) && (await emulatorUiReady())) return;
    await stopDetached("emulators");
  }
  // Bind-only preflight: never connect to, signal or identify whatever holds a configured port.
  await assertEmulatorPortsFree();
  startDetached(
    "emulators",
    "pnpm",
    [
      "exec",
      "firebase",
      "emulators:start",
      "--project",
      PROJECT_ID,
      "--only",
      "auth,functions,firestore,ui",
    ],
    { env },
  );
  try {
    await waitFor(
      "the Firebase emulators",
      async () => {
        // The emulators we spawned must still be alive: if the CLI exited (e.g. it lost a port race),
        // anything answering on the ports belongs to someone else and must not count as ready.
        if (!isOwnedAndAlive("emulators")) throw new Error("the Firebase emulators exited during startup");
        return (await emulatorsReady()) && (await emulatorUiReady());
      },
      { timeoutMs: 180_000 },
    );
  } catch (error) {
    const tail = tailLog("emulators");
    // Leave a retryable state: never keep a half-started suite (and its ports) behind.
    await stopDetached("emulators");
    throw new Error(`${error.message}\n--- emulators log (tail) ---\n${tail}`);
  }
}

export async function startWebServer(env) {
  // A bind-only check detects collisions without connecting to or identifying the listener.
  if (!(await isPortFree(ports.web))) {
    throw new Error(
      `Port ${ports.web} is already in use. The preview does not inspect or modify the process; free the port and retry.`,
    );
  }
  startDetached(
    "web",
    "pnpm",
    [
      "--filter",
      "web",
      "run",
      "dev",
      "--port",
      String(ports.web),
      "--host",
      "127.0.0.1",
      "--strictPort",
    ],
    {
      env: {
        ...env,
        // Pinned demo Firebase configuration + emulator mode come from `buildPreviewEnv`.
        // Email/Password is the only provider the preview uses; Google/Phone stay off.
        VITE_AUTH_ENABLE_EMAIL_PASSWORD: "true",
      },
    },
  );
  try {
    await waitFor(
      "the web dev server",
      async () => {
        // The spawned server must still be alive (not exited because the port was taken) AND serve
        // Vite's own client endpoint. This readiness request is made only after ownership is verified.
        if (!isOwnedAndAlive("web")) throw new Error("the web dev server exited during startup");
        try {
          const response = await fetch(`http://127.0.0.1:${ports.web}/@vite/client`);
          return response.ok && (await response.text()).includes("vite");
        } catch {
          return false;
        }
      },
      { timeoutMs: 120_000 },
    );
  } catch (error) {
    const tail = tailLog("web");
    await stopDetached("web");
    throw new Error(`${error.message}\n--- web log (tail) ---\n${tail}`);
  }
}

export async function stopPreviewProcesses() {
  const stopped = [];
  for (const name of ["web", "emulators"]) {
    if (await stopDetached(name)) stopped.push(name);
  }
  return stopped;
}

export function processStatus() {
  const status = {};
  for (const name of ["emulators", "web"]) {
    status[name] = isOwnedAndAlive(name) ? `running (pid ${readPid(name)})` : "stopped";
  }
  return status;
}

export { urls };
