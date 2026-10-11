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

/** Non-blocking counterpart used while a detached child is completing its launch handshake. */
export function processStartStampAsync(pid) {
  return new Promise((resolve) => {
    let child;
    let stdout = "";
    try {
      child = spawn("ps", ["-o", "lstart=", "-p", String(pid)], {
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      resolve(undefined);
      return;
    }
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.on("error", () => resolve(undefined));
    child.on("close", (code) => {
      const stamp = code === 0 ? stdout.trim() : "";
      resolve(stamp.length > 0 ? stamp : undefined);
    });
  });
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

function resolveExecutable(command, env, cwd) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(cwd, command)]
    : (env?.PATH ?? "").split(path.delimiter).filter(Boolean).map((entry) => path.join(entry, command));
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return fs.realpathSync(candidate);
    } catch {
      // Continue through PATH; absence is reported without exposing the environment.
    }
  }
  return undefined;
}

function assertCanStart(name) {
  if (isOwnedAndAlive(name)) {
    throw new Error(
      `${name} is already running (pid ${readPid(name)}). Run \`pnpm preview:stop\` first.`,
    );
  }
  fs.rmSync(pidFile(name), { force: true }); // stale record (process gone or pid reused)
}

function spawnDetachedChild(name, command, args, { env, cwd = repoRoot } = {}) {
  ensureStateDirs();
  assertCanStart(name);
  const out = fs.openSync(logFile(name), "w");
  try {
    const child = spawn(command, args, {
      cwd,
      env,
      detached: true,
      stdio: ["ignore", out, out],
    });
    return child;
  } finally {
    // The child has inherited the descriptors; the supervising CLI should not retain them.
    fs.closeSync(out);
  }
}

function persistDetachedOwnership(name, pid, stamp, configFingerprint) {
  const recordPath = pidFile(name);
  const temporaryRecordPath = `${recordPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(
      temporaryRecordPath,
      JSON.stringify({ pid, stamp, configFingerprint }),
      { flag: "wx" },
    );
    fs.renameSync(temporaryRecordPath, recordPath);
  } catch (error) {
    fs.rmSync(temporaryRecordPath, { force: true });
    throw error;
  }
}

function pidIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

function createLifecycleState(child) {
  const state = {
    spawned: false,
    spawnError: undefined,
    error: undefined,
    exitObserved: false,
    exitCode: null,
    signal: null,
    closeObserved: false,
    closeCode: null,
    closeSignal: null,
    waiters: new Set(),
  };
  const notify = () => {
    for (const waiter of [...state.waiters]) waiter();
  };
  child.on("spawn", () => {
    state.spawned = true;
    notify();
  });
  child.on("error", (error) => {
    state.error = error;
    if (!state.spawned) state.spawnError = error;
    notify();
  });
  child.on("exit", (code, signal) => {
    state.exitObserved = true;
    state.exitCode = code;
    state.signal = signal;
    notify();
  });
  child.on("close", (code, signal) => {
    state.closeObserved = true;
    state.closeCode = code;
    state.closeSignal = signal;
    notify();
  });
  return state;
}

function waitForLifecycleChange(state, timeoutMs) {
  return new Promise((resolve) => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      state.waiters.delete(finish);
      resolve();
    };
    state.waiters.add(finish);
    timer = setTimeout(finish, timeoutMs);
  });
}

function lifecycleDetails({ name, command, resolvedExecutable, child, state, stage, stamp }) {
  return {
    name,
    executable: command,
    resolvedExecutable: resolvedExecutable ?? null,
    spawned: state.spawned,
    pid: Number.isInteger(child.pid) ? child.pid : null,
    stage,
    exitCode: state.exitObserved ? state.exitCode : null,
    signal: state.exitObserved ? state.signal : null,
    closeObserved: state.closeObserved,
    closeCode: state.closeObserved ? state.closeCode : null,
    closeSignal: state.closeObserved ? state.closeSignal : null,
    liveChild: Number.isInteger(child.pid) ? pidIsAlive(child.pid) : false,
    identityEstablished: Boolean(stamp),
    ownershipMetadataWritten: false,
    logFile: logFile(name),
  };
}

function observedLaunchError(message, details, cause) {
  const suffix = cause?.code ? ` (${cause.code})` : "";
  if (cause?.code && details.errorCode === undefined) details.errorCode = cause.code;
  const error = new Error(
    `${message}${suffix}\nLaunch evidence: ${JSON.stringify(details)}\nTunnel log: ${details.logFile}`,
    cause ? { cause } : undefined,
  );
  error.name = "ObservedDetachedLaunchError";
  error.details = details;
  return error;
}

async function waitForSpawn(child, state, options) {
  const deadline = Date.now() + options.spawnTimeoutMs;
  while (!state.spawned) {
    if (state.spawnError) {
      await waitForLifecycleChange(state, 25); // allow Node's paired `close` event to arrive
      const details = lifecycleDetails({ ...options, child, state, stage: "spawn" });
      throw observedLaunchError(
        `Launch failed before spawn: ${state.spawnError.message}`,
        details,
        state.spawnError,
      );
    }
    if (state.exitObserved) {
      const details = lifecycleDetails({ ...options, child, state, stage: "spawn" });
      const label = state.signal
        ? `child terminated before spawn (signal ${state.signal})`
        : `child exited before spawn (code ${state.exitCode})`;
      throw observedLaunchError(label, details);
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      const details = lifecycleDetails({ ...options, child, state, stage: "spawn-timeout" });
      throw observedLaunchError("Timed out waiting for child spawn", details);
    }
    await waitForLifecycleChange(state, Math.min(options.pollIntervalMs, remaining));
  }
}

async function waitForChildExit(state, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (!state.exitObserved && Date.now() < deadline) {
    await waitForLifecycleChange(state, Math.min(25, deadline - Date.now()));
  }
  return state.exitObserved;
}

async function stopUnownedChild(child, state) {
  if (!state.spawned || !Number.isInteger(child.pid) || state.exitObserved) return;
  try {
    process.kill(-child.pid, "SIGTERM"); // only the detached process group created above
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      // The child may have exited between the liveness check and signal.
    }
  }
  if (!(await waitForChildExit(state, 500))) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {
        // The child may have exited between the liveness check and signal.
      }
    }
    await waitForChildExit(state, 500);
  }
}

/**
 * Asynchronous detached launch for the phone tunnel. Unlike `startDetached`, this observes Node's
 * child lifecycle while resolving the OS start-time identity; the web/emulator callers retain the
 * existing synchronous startup contract.
 */
export async function startDetachedObserved(
  name,
  command,
  args,
  {
    env = process.env,
    cwd = repoRoot,
    configFingerprint,
    spawnTimeoutMs = 5000,
    identityTimeoutMs = 1500,
    pollIntervalMs = 25,
    lookupStartStamp = processStartStampAsync,
    persistOwnership = persistDetachedOwnership,
  } = {},
) {
  const resolvedExecutable = resolveExecutable(command, env, cwd);
  let child;
  try {
    child = spawnDetachedChild(name, command, args, { env, cwd });
  } catch (cause) {
    const details = {
      name,
      executable: command,
      resolvedExecutable: resolvedExecutable ?? null,
      spawned: false,
      pid: null,
      stage: "spawn-call",
      exitCode: null,
      signal: null,
      closeObserved: false,
      closeCode: null,
      closeSignal: null,
      liveChild: false,
      identityEstablished: false,
      ownershipMetadataWritten: false,
      logFile: logFile(name),
    };
    throw observedLaunchError(`Launch failed before spawn: ${cause.message}`, details, cause);
  }

  const state = createLifecycleState(child);
  let stamp;
  let stage = "spawn";
  try {
    await waitForSpawn(child, state, {
      name,
      command,
      resolvedExecutable,
      spawnTimeoutMs,
      pollIntervalMs,
    });
    stage = "identity";
    const deadline = Date.now() + identityTimeoutMs;
    while (Date.now() < deadline) {
      if (state.exitObserved) {
        const details = lifecycleDetails({ name, command, resolvedExecutable, child, state, stage });
        const label = state.signal
          ? `Child terminated before ownership established (signal ${state.signal})`
          : `Child exited before ownership established (code ${state.exitCode})`;
        throw observedLaunchError(label, details);
      }
      stamp = await lookupStartStamp(child.pid);
      if (state.exitObserved) continue;
      if (stamp && pidIsAlive(child.pid)) break;
      stamp = undefined;
      const remaining = deadline - Date.now();
      if (remaining > 0) {
        await waitForLifecycleChange(state, Math.min(pollIntervalMs, remaining));
      }
    }

    if (!stamp) {
      if (state.exitObserved) {
        const details = lifecycleDetails({ name, command, resolvedExecutable, child, state, stage });
        const label = state.signal
          ? `Child terminated before ownership established (signal ${state.signal})`
          : `Child exited before ownership established (code ${state.exitCode})`;
        throw observedLaunchError(label, details);
      }
      const details = lifecycleDetails({ name, command, resolvedExecutable, child, state, stage });
      throw observedLaunchError("Live child identity lookup timed out", details);
    }

    stage = "ownership";
    try {
      persistOwnership(name, child.pid, stamp, configFingerprint);
    } catch (cause) {
      const details = lifecycleDetails({ name, command, resolvedExecutable, child, state, stage, stamp });
      throw observedLaunchError(`Ownership metadata persistence failed: ${cause.message}`, details, cause);
    }
    child.unref();
    return child.pid;
  } catch (error) {
    await stopUnownedChild(child, state);
    if (error?.name === "ObservedDetachedLaunchError") throw error;
    const details = lifecycleDetails({ name, command, resolvedExecutable, child, state, stage, stamp });
    throw observedLaunchError(`Launch failed during ${stage}: ${error.message}`, details, error);
  }
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
  const child = spawnDetachedChild(name, command, args, { env, cwd });
  child.unref();
  const stamp = waitForProcessStartStamp(child.pid);
  if (!stamp) {
    if (child.pid) child.kill("SIGTERM");
    throw new Error(`Could not establish the identity of the started ${name} process.`);
  }
  try {
    persistDetachedOwnership(name, child.pid, stamp, configFingerprint);
  } catch (error) {
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
