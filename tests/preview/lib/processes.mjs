// Founder Preview (EA-002) — tiny process supervision for the preview's long-running
// children (Firebase emulators, web dev server). Each child is started in its own
// process group, its output goes to `.preview/logs/<name>.log`, and its pid to
// `.preview/pids/<name>.pid`, so `preview:stop` can end exactly what `preview:start`
// began — nothing else.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { previewStateDir, repoRoot } from "./config.mjs";

const logsDir = path.join(previewStateDir, "logs");
const pidsDir = path.join(previewStateDir, "pids");

export function ensureStateDirs() {
  fs.mkdirSync(logsDir, { recursive: true });
  fs.mkdirSync(pidsDir, { recursive: true });
}

const pidFile = (name) => path.join(pidsDir, `${name}.pid`);
export const logFile = (name) => path.join(logsDir, `${name}.log`);

/**
 * Process identity: the pid alone is not enough (pids are reused after a crash or reboot), so the
 * pid file also records the process start time (`ps -o lstart=`, available on Linux and macOS).
 * A pid is treated as "ours" only when its current start time still matches; if identity cannot be
 * established, we do NOT signal it.
 */
export function processStartStamp(pid) {
  const result = spawnSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" });
  const stamp = result.status === 0 ? result.stdout.trim() : "";
  return stamp.length > 0 ? stamp : undefined;
}

function readRecord(name) {
  try {
    const record = JSON.parse(fs.readFileSync(pidFile(name), "utf8"));
    return Number.isInteger(record.pid) && typeof record.stamp === "string" ? record : undefined;
  } catch {
    return undefined;
  }
}

export function readPid(name) {
  return readRecord(name)?.pid;
}

/** True only for a live process that is still the one we started (same pid AND start time). */
export function isOwnedAndAlive(name) {
  const record = readRecord(name);
  if (!record) return false;
  try {
    process.kill(record.pid, 0);
  } catch {
    return false;
  }
  return processStartStamp(record.pid) === record.stamp;
}

export function startDetached(name, command, args, { env, cwd = repoRoot } = {}) {
  ensureStateDirs();
  if (isOwnedAndAlive(name)) {
    throw new Error(
      `${name} is already running (pid ${readPid(name)}). Run \`pnpm preview:stop\` first.`,
    );
  }
  fs.rmSync(pidFile(name), { force: true }); // stale record (process gone or pid reused)
  const out = fs.openSync(logFile(name), "w");
  const child = spawn(command, args, {
    cwd,
    env,
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
  const stamp = processStartStamp(child.pid);
  if (!stamp) {
    child.kill("SIGTERM");
    throw new Error(`Could not establish the identity of the started ${name} process.`);
  }
  fs.writeFileSync(pidFile(name), JSON.stringify({ pid: child.pid, stamp }));
  return child.pid;
}

export async function stopDetached(name, { graceMs = 8000 } = {}) {
  const pid = readPid(name);
  if (!isOwnedAndAlive(name)) {
    // Gone, or the pid now belongs to an unrelated process: never signal it.
    fs.rmSync(pidFile(name), { force: true });
    return false;
  }
  try {
    process.kill(-pid, "SIGTERM"); // the whole process group we created
  } catch {
    process.kill(pid, "SIGTERM");
  }
  const started = Date.now();
  while (isOwnedAndAlive(name) && Date.now() - started < graceMs) {
    await new Promise((r) => setTimeout(r, 250));
  }
  if (isOwnedAndAlive(name)) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      process.kill(pid, "SIGKILL");
    }
  }
  fs.rmSync(pidFile(name), { force: true });
  return true;
}

export async function waitFor(description, probe, { timeoutMs = 120_000, intervalMs = 1000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await probe()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s waiting for ${description}.`);
}

/** Last lines of a child log, for error messages. */
export function tailLog(name, lines = 25) {
  try {
    return fs.readFileSync(logFile(name), "utf8").split("\n").slice(-lines).join("\n");
  } catch {
    return "(no log)";
  }
}
