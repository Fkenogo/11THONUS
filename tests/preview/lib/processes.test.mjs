import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  isOwnedAndAlive,
  logFile,
  processStartStamp,
  readPid,
  startDetached,
  startDetachedObserved,
  stopDetached,
} from "./processes.mjs";
import { waitForTunnelReady } from "../phone/tunnel.mjs";

const pidsDir = path.join(process.cwd(), ".preview/pids");
const uniqueName = (suffix) => `process-test-${process.pid}-${suffix}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fixtureCommand() {
  return [
    "-e",
    'process.stdout.write("fixture stdout\\n"); process.stderr.write("fixture stderr\\n"); console.log("Registered tunnel connection test"); setInterval(() => {}, 1000);',
  ];
}

async function waitFor(predicate, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(10);
  }
  assert.fail("Timed out waiting for the managed child state.");
}

function processGroup(pid) {
  const result = spawnSync("ps", ["-o", "pgid=", "-p", String(pid)], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

test("detached process supervision preserves ownership, logs, and restart safety", async (t) => {
  const names = [];
  const unrelated = new Set();
  t.after(async () => {
    for (const name of names) await stopDetached(name);
    for (const child of unrelated) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    }
  });

  await t.test("startup waits through a transient ps miss before persisting ownership", async () => {
    const name = uniqueName("transient-ps");
    names.push(name);
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "phone-preview-ps-once-"));
    const marker = path.join(temp, "first-ps-call");
    const shim = path.join(temp, "ps");
    fs.writeFileSync(
      shim,
      `#!/bin/sh\nif mkdir "${marker}" 2>/dev/null; then exit 1; fi\nexec /bin/ps "$@"\n`,
    );
    fs.chmodSync(shim, 0o755);
    const originalPath = process.env.PATH;
    let pid;
    let firstPsCallFailed;
    try {
      process.env.PATH = `${temp}:${originalPath}`;
      pid = startDetached(name, process.execPath, fixtureCommand(), { env: { ...process.env } });
      firstPsCallFailed = fs.existsSync(marker);
    } finally {
      process.env.PATH = originalPath;
      fs.rmSync(temp, { recursive: true, force: true });
    }
    assert.equal(firstPsCallFailed, true);
    assert.ok(pid > 0);
    assert.equal(readPid(name), pid);
    assert.equal(isOwnedAndAlive(name), true);
    assert.deepEqual(
      fs.readdirSync(pidsDir).filter((entry) => entry.startsWith(`${name}.pid.`)),
      [],
      "atomic PID record leaves no staging files",
    );
    assert.equal(JSON.parse(fs.readFileSync(path.join(pidsDir, `${name}.pid`), "utf8")).stamp, processStartStamp(pid));
    await waitFor(() => fs.readFileSync(logFile(name), "utf8").includes("Registered tunnel connection"));
    assert.match(fs.readFileSync(logFile(name), "utf8"), /fixture stdout[\s\S]*fixture stderr/);
    await waitForTunnelReady({
      isAlive: () => isOwnedAndAlive(name),
      readLog: () => fs.readFileSync(logFile(name), "utf8"),
    });
    assert.equal(await stopDetached(name), true);
    assert.equal(isOwnedAndAlive(name), false);
  });

  await t.test("persistent identity lookup failure terminates the child and writes no PID record", async () => {
    const name = uniqueName("stamp-failure");
    names.push(name);
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "phone-preview-ps-fail-"));
    const pidPath = path.join(temp, "observed-pid");
    const shim = path.join(temp, "ps");
    fs.writeFileSync(shim, `#!/bin/sh\nprintf '%s' "$4" > "${pidPath}"\nexit 1\n`);
    fs.chmodSync(shim, 0o755);
    const originalPath = process.env.PATH;
    try {
      process.env.PATH = `${temp}:${originalPath}`;
      assert.throws(
        () => startDetached(name, "/bin/sleep", ["20"], { env: { ...process.env } }),
        /Could not establish the identity/,
      );
    } finally {
      process.env.PATH = originalPath;
    }
    const pid = Number(fs.readFileSync(pidPath, "utf8"));
    await waitFor(() => {
      try {
        process.kill(pid, 0);
        return false;
      } catch {
        return true;
      }
    });
    assert.equal(fs.existsSync(path.join(pidsDir, `${name}.pid`)), false);
    assert.equal(fs.statSync(logFile(name)).size, 0);
    fs.rmSync(temp, { recursive: true, force: true });
  });

  await t.test("stop signals only the owned detached process group, not the parent or an unrelated child", async () => {
    const name = uniqueName("group-stop");
    names.push(name);
    const unrelatedChild = spawn(process.execPath, fixtureCommand(), { stdio: "ignore" });
    unrelated.add(unrelatedChild);
    const pid = startDetached(name, process.execPath, fixtureCommand(), { env: process.env });
    assert.equal(processGroup(pid), String(pid));
    assert.notEqual(processGroup(process.pid), String(pid));
    assert.equal(await stopDetached(name), true);
    assert.doesNotThrow(() => process.kill(unrelatedChild.pid, 0));
    assert.doesNotThrow(() => process.kill(process.pid, 0));
  });

  await t.test("stale PID metadata never signals a different process", async () => {
    const name = uniqueName("stale-pid");
    names.push(name);
    const unrelatedChild = spawn("/bin/sleep", ["20"], { stdio: "ignore" });
    unrelated.add(unrelatedChild);
    const record = {
      pid: unrelatedChild.pid,
      stamp: "stale-start-stamp-that-cannot-match",
    };
    fs.mkdirSync(pidsDir, { recursive: true });
    fs.writeFileSync(path.join(pidsDir, `${name}.pid`), JSON.stringify(record));
    assert.equal(await stopDetached(name), false);
    assert.doesNotThrow(() => process.kill(unrelatedChild.pid, 0));
    assert.equal(fs.existsSync(path.join(pidsDir, `${name}.pid`)), false);
  });

  await t.test("repeated start-ready-stop cycles remain reliable and never terminate the parent", async () => {
    for (let i = 0; i < 3; i += 1) {
      const name = uniqueName(`cycle-${i}`);
      names.push(name);
      const pid = startDetached(name, process.execPath, fixtureCommand(), { env: process.env });
      await waitFor(() => fs.readFileSync(logFile(name), "utf8").includes("Registered tunnel connection"));
      await waitForTunnelReady({
        isAlive: () => isOwnedAndAlive(name),
        readLog: () => fs.readFileSync(logFile(name), "utf8"),
      });
      assert.equal(readPid(name), pid);
      assert.equal(await stopDetached(name), true);
      assert.equal(isOwnedAndAlive(name), false);
      assert.doesNotThrow(() => process.kill(process.pid, 0));
    }
  });
});

test("observed detached launch reports child lifecycle before recording ownership", async (t) => {
  const names = [];
  t.after(async () => {
    for (const name of names) await stopDetached(name);
  });

  const createName = (suffix) => {
    const name = uniqueName(`observed-${suffix}`);
    names.push(name);
    return name;
  };

  await t.test("successful spawn establishes ownership and captures both output streams", async () => {
    const name = createName("success");
    const pid = await startDetachedObserved(name, process.execPath, fixtureCommand(), {
      env: process.env,
    });
    assert.ok(pid > 0);
    assert.equal(readPid(name), pid);
    assert.equal(isOwnedAndAlive(name), true);
    await waitFor(() => fs.readFileSync(logFile(name), "utf8").includes("Registered tunnel connection"));
    const output = fs.readFileSync(logFile(name), "utf8");
    assert.match(output, /fixture stdout/);
    assert.match(output, /fixture stderr/);
    assert.equal(await stopDetached(name), true);
  });

  await t.test("executable-not-found is classified as a pre-spawn error", async () => {
    const name = createName("missing-executable");
    await assert.rejects(
      startDetachedObserved(name, `missing-cloudflared-${process.pid}`, [], { env: process.env }),
      (error) => {
        assert.match(error.message, /launch failed before spawn/i);
        assert.equal(error.details.spawned, false);
        assert.equal(error.details.pid, null);
        assert.equal(error.details.resolvedExecutable, null);
        assert.match(error.details.errorCode, /ENOENT/);
        assert.equal(error.details.ownershipMetadataWritten, false);
        return true;
      },
    );
    assert.equal(fs.existsSync(path.join(pidsDir, `${name}.pid`)), false);
  });

  await t.test("immediate non-zero exit is classified with its exit code", async () => {
    const name = createName("exit-before-stamp");
    await assert.rejects(
      startDetachedObserved(name, process.execPath, ["-e", "process.exit(17)"], {
        env: process.env,
        lookupStartStamp: async () => {
          await sleep(60);
          return undefined;
        },
        identityTimeoutMs: 500,
        pollIntervalMs: 5,
      }),
      (error) => {
        assert.match(error.message, /child exited before ownership established/i);
        assert.equal(error.details.spawned, true);
        assert.equal(error.details.exitCode, 17);
        assert.equal(error.details.signal, null);
        assert.equal(error.details.identityEstablished, false);
        assert.equal(error.details.ownershipMetadataWritten, false);
        return true;
      },
    );
    assert.equal(fs.existsSync(path.join(pidsDir, `${name}.pid`)), false);
  });

  await t.test("signal termination before identity is classified with the signal", async () => {
    const name = createName("signal-before-stamp");
    await assert.rejects(
      startDetachedObserved(name, process.execPath, ["-e", 'process.kill(process.pid, "SIGTERM")'], {
        env: process.env,
        lookupStartStamp: async () => {
          await sleep(60);
          return undefined;
        },
        identityTimeoutMs: 500,
        pollIntervalMs: 5,
      }),
      (error) => {
        assert.match(error.message, /child terminated before ownership established/i);
        assert.equal(error.details.spawned, true);
        assert.equal(error.details.exitCode, null);
        assert.equal(error.details.signal, "SIGTERM");
        return true;
      },
    );
  });

  await t.test("temporary identity lookup misses succeed while the child remains alive", async () => {
    const name = createName("transient-identity");
    let lookups = 0;
    const pid = await startDetachedObserved(name, process.execPath, fixtureCommand(), {
      env: process.env,
      lookupStartStamp: async (childPid) => {
        lookups += 1;
        return lookups < 3 ? undefined : processStartStamp(childPid);
      },
      identityTimeoutMs: 500,
      pollIntervalMs: 5,
    });
    assert.ok(pid > 0);
    assert.ok(lookups >= 3);
    assert.equal(readPid(name), pid);
    assert.equal(isOwnedAndAlive(name), true);
    assert.equal(await stopDetached(name), true);
  });

  await t.test("persistent identity miss reports live-child timeout and cleans up", async () => {
    const name = createName("identity-timeout");
    const error = await startDetachedObserved(name, process.execPath, fixtureCommand(), {
      env: process.env,
      lookupStartStamp: async () => undefined,
      identityTimeoutMs: 100,
      pollIntervalMs: 5,
    }).catch((caught) => caught);
    assert.ok(error instanceof Error);
    assert.match(error.message, /live child identity lookup timed out/i);
    assert.equal(error.details.spawned, true);
    assert.equal(error.details.liveChild, true);
    assert.equal(error.details.identityEstablished, false);
    assert.equal(error.details.ownershipMetadataWritten, false);
    assert.throws(() => process.kill(error.details.pid, 0), { code: "ESRCH" });
    assert.equal(fs.existsSync(path.join(pidsDir, `${name}.pid`)), false);
  });

  await t.test("ownership persistence failure cleans up and leaves no record", async () => {
    const name = createName("persistence-error");
    const error = await startDetachedObserved(name, process.execPath, fixtureCommand(), {
      env: process.env,
      persistOwnership() {
        const persistenceError = new Error("permission denied writing PID metadata");
        persistenceError.code = "EACCES";
        throw persistenceError;
      },
    }).catch((caught) => caught);
    assert.ok(error instanceof Error);
    assert.match(error.message, /ownership metadata persistence failed/i);
    assert.equal(error.details.spawned, true);
    assert.equal(error.details.identityEstablished, true);
    assert.equal(error.details.ownershipMetadataWritten, false);
    assert.equal(error.details.errorCode, "EACCES");
    assert.throws(() => process.kill(error.details.pid, 0), { code: "ESRCH" });
    assert.equal(fs.existsSync(path.join(pidsDir, `${name}.pid`)), false);
  });

  await t.test("identity wait yields so parent timers and child exit events are delivered", async () => {
    const name = createName("non-blocking-handshake");
    let timerDelivered = false;
    setTimeout(() => {
      timerDelivered = true;
    }, 10);
    await assert.rejects(
      startDetachedObserved(name, process.execPath, ["-e", "process.exit(3)"], {
        env: process.env,
        lookupStartStamp: async () => {
          await sleep(80);
          return undefined;
        },
        identityTimeoutMs: 500,
        pollIntervalMs: 5,
      }),
      /child exited before ownership established/i,
    );
    assert.equal(timerDelivered, true);
    assert.doesNotThrow(() => process.kill(process.pid, 0));
  });

  await t.test("repeated tunnel-style ready and stop cycles retain parent and stale-PID safety", async () => {
    for (let index = 0; index < 3; index += 1) {
      const name = createName(`cycle-${index}`);
      const pid = await startDetachedObserved(name, process.execPath, fixtureCommand(), {
        env: process.env,
      });
      await waitForTunnelReady({
        isAlive: () => isOwnedAndAlive(name),
        readLog: () => fs.readFileSync(logFile(name), "utf8"),
      });
      assert.equal(readPid(name), pid);
      assert.equal(await stopDetached(name), true);
      assert.equal(isOwnedAndAlive(name), false);
      assert.doesNotThrow(() => process.kill(process.pid, 0));
    }

    const staleName = createName("stale-pid");
    const unrelated = spawn("/bin/sleep", ["20"], { stdio: "ignore" });
    const stalePath = path.join(pidsDir, `${staleName}.pid`);
    fs.writeFileSync(stalePath, JSON.stringify({ pid: unrelated.pid, stamp: "old process start" }));
    assert.equal(await stopDetached(staleName), false);
    assert.doesNotThrow(() => process.kill(unrelated.pid, 0));
    unrelated.kill("SIGTERM");
  });
});
