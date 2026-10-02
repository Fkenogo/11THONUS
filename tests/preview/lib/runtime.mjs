// Founder Preview (EA-002) — start/stop of the preview runtime: PostgreSQL, the
// Firebase emulators (Auth, Functions, Firestore, UI) and the web dev server.
// Reuses the repository's own commands (`pnpm --filter functions build`, `firebase
// emulators:start --project demo-11thonus`, `pnpm --filter web dev`).
import { spawnSync } from "node:child_process";
import { PROJECT_ID, ports, repoRoot, urls } from "./config.mjs";
import { buildPreviewEnv } from "./guards.mjs";
import { emulatorsReady } from "./emulatorClient.mjs";
import {
  isAlive,
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
    await waitFor("the Firebase emulators", emulatorsReady, { timeoutMs: 180_000 });
  } catch (error) {
    throw new Error(`${error.message}\n--- emulators log (tail) ---\n${tailLog("emulators")}`);
  }
}

export async function startWebServer(env) {
  startDetached(
    "web",
    "pnpm",
    ["--filter", "web", "run", "dev", "--port", String(ports.web), "--host", "127.0.0.1", "--strictPort"],
    {
      env: {
        ...env,
        VITE_USE_FIREBASE_EMULATOR: "true",
        // Email/Password is the only provider the preview uses; Google/Phone stay off.
        VITE_AUTH_ENABLE_EMAIL_PASSWORD: "true",
      },
    },
  );
  try {
    await waitFor(
      "the web dev server",
      async () => {
        try {
          return (await fetch(`http://127.0.0.1:${ports.web}/`)).ok;
        } catch {
          return false;
        }
      },
      { timeoutMs: 120_000 },
    );
  } catch (error) {
    throw new Error(`${error.message}\n--- web log (tail) ---\n${tailLog("web")}`);
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
    const pid = readPid(name);
    status[name] = isAlive(pid) ? `running (pid ${pid})` : "stopped";
  }
  return status;
}

export { urls };
