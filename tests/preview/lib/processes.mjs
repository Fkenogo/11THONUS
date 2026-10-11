// Founder Preview (EA-002) — tiny process supervision for the preview's long-running
// children (Firebase emulators, web dev server). Each child is started in its own
// process group, its output goes to `.preview/logs/<name>.log`, and its pid to
// `.preview/pids/<name>.pid`, so `preview:stop` can end exactly what `preview:start`
// began — nothing else.
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
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

/**
 * `spawn()` can return before a just-created child is visible to `ps` on macOS. Retry briefly
 * before treating that as a failed launch; otherwise the caller may SIGTERM a healthy child before
 * it has emitted its first log line or before ownership metadata can be written.
 */
export function waitForProcessStartStamp(pid, { timeoutMs = 1500, intervalMs = 25 } = {}) {
  const deadline = Date.now() + timeoutMs;
  const waitCell = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
  do {
    const stamp = processStartStamp(pid);
    if (stamp) return stamp;
    try {
      process.kill(pid, 0);
    } catch {
      return undefined;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    Atomics.wait(waitCell, 0, 0, Math.min(intervalMs, remaining));
  } while (Date.now() < deadline);
  return processStartStamp(pid);
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

/** True only when a live owned process was launched for the expected configuration. */
export function isOwnedWithConfig(name, configFingerprint) {
  const record = readRecord(name);
  return isOwnedAndAlive(name) && record?.configFingerprint === configFingerprint;
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

export function startDetached(name, command, args, { env, cwd = repoRoot, configFingerprint } = {}) {
  ensureStateDirs();
  if (isOwnedAndAlive(name)) {
    throw new Error(
      `${name} is already running (pid ${readPid(name)}). Run \`pnpm preview:stop\` first.`,
    );
  }
  fs.rmSync(pidFile(name), { force: true }); // stale record (process gone or pid reused)
  const out = fs.openSync(logFile(name), "w");
  let child;
  try {
    child = spawn(command, args, {
      cwd,
      env,
      detached: true,
      stdio: ["ignore", out, out],
    });
  } finally {
    // The child has inherited the descriptors; the supervising CLI should not retain them.
    fs.closeSync(out);
  }
  child.unref();
  const stamp = waitForProcessStartStamp(child.pid);
  if (!stamp) {
    if (child.pid) child.kill("SIGTERM");
    throw new Error(`Could not establish the identity of the started ${name} process.`);
  }
  const recordPath = pidFile(name);
  const temporaryRecordPath = `${recordPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(
      temporaryRecordPath,
      JSON.stringify({ pid: child.pid, stamp, configFingerprint }),
      { flag: "wx" },
    );
    fs.renameSync(temporaryRecordPath, recordPath);
  } catch (error) {
    fs.rmSync(temporaryRecordPath, { force: true });
    child.kill("SIGTERM");
    throw error;
  }
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
