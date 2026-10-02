// Founder Preview (EA-002) — tiny process supervision for the preview's long-running
// children (Firebase emulators, web dev server). Each child is started in its own
// process group, its output goes to `.preview/logs/<name>.log`, and its pid to
// `.preview/pids/<name>.pid`, so `preview:stop` can end exactly what `preview:start`
// began — nothing else.
import { spawn } from "node:child_process";
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

export function readPid(name) {
  try {
    const pid = Number.parseInt(fs.readFileSync(pidFile(name), "utf8"), 10);
    return Number.isInteger(pid) ? pid : undefined;
  } catch {
    return undefined;
  }
}

export function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function startDetached(name, command, args, { env, cwd = repoRoot } = {}) {
  ensureStateDirs();
  const existing = readPid(name);
  if (isAlive(existing)) {
    throw new Error(`${name} is already running (pid ${existing}). Run \`pnpm preview:stop\` first.`);
  }
  const out = fs.openSync(logFile(name), "w");
  const child = spawn(command, args, {
    cwd,
    env,
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
  fs.writeFileSync(pidFile(name), String(child.pid));
  return child.pid;
}

export async function stopDetached(name, { graceMs = 8000 } = {}) {
  const pid = readPid(name);
  if (!isAlive(pid)) {
    fs.rmSync(pidFile(name), { force: true });
    return false;
  }
  try {
    process.kill(-pid, "SIGTERM"); // the whole process group
  } catch {
    process.kill(pid, "SIGTERM");
  }
  const started = Date.now();
  while (isAlive(pid) && Date.now() - started < graceMs) {
    await new Promise((r) => setTimeout(r, 250));
  }
  if (isAlive(pid)) {
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
