// Founder Preview (EA-002-CORR-001) — regression tests for the Emulator UI port collision.
// Real sockets, no services required:  pnpm test:preview-tooling
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { test } from "node:test";
import { emulatorUiReady } from "./lib/emulatorClient.mjs";
import { ports as configuredPorts, repoRoot, urls } from "./lib/config.mjs";
import {
  PortConflictError,
  assertEmulatorPortsFree,
  findOccupiedPorts,
  isPortFree,
} from "./lib/ports.mjs";

/** An "unrelated local project": a plain TCP server on a port the OS picks (or a given one). */
function occupy(port = 0) {
  return new Promise((resolve, reject) => {
    const sockets = new Set();
    const server = net.createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      socket.end("unrelated-service\n");
    });
    server.once("error", reject);
    server.listen({ port, host: "127.0.0.1" }, () =>
      resolve({
        port: server.address().port,
        isListening: () => server.listening,
        answers: () =>
          new Promise((ok) => {
            const c = net.connect(server.address().port, "127.0.0.1");
            let data = "";
            c.on("data", (d) => (data += d));
            c.on("close", () => ok(data.trim() === "unrelated-service"));
            c.on("error", () => ok(false));
          }),
        close: () =>
          new Promise((done) => {
            for (const s of sockets) s.destroy();
            server.close(done);
          }),
      }),
    );
  });
}

async function freePort() {
  const probe = await occupy();
  const { port } = probe;
  await probe.close();
  return port;
}

async function freePreviewPorts() {
  return {
    auth: await freePort(),
    functions: await freePort(),
    firestore: await freePort(),
    emulatorUi: await freePort(),
  };
}

test("configuration: the preview's Emulator UI port is 4001 and never the default 4000", () => {
  assert.equal(configuredPorts.emulatorUi, 4001);
  assert.notEqual(configuredPorts.emulatorUi, 4000);
  assert.equal(urls.emulatorUi, "http://localhost:4001");
  // The launch preflight covers every port the emulators bind, and none of them is 4000.
  for (const name of ["auth", "functions", "firestore", "emulatorUi"]) {
    assert.notEqual(configuredPorts[name], 4000, `${name} must not use 4000`);
  }
});

test("configuration: tests/preview/lib/config.mjs and firebase.json (what the Firebase CLI reads) agree", () => {
  const firebase = JSON.parse(fs.readFileSync(path.join(repoRoot, "firebase.json"), "utf8"));
  const e = firebase.emulators;
  assert.equal(e.auth.port, configuredPorts.auth);
  assert.equal(e.functions.port, configuredPorts.functions);
  assert.equal(e.firestore.port, configuredPorts.firestore);
  assert.equal(e.ui.port, configuredPorts.emulatorUi);
  assert.notEqual(e.ui.port, 4000);
});

test("an unrelated process on port 4000 is irrelevant: preflight passes and the process is untouched", async () => {
  // Stand-in for the other project's :4000 listener. Use 4000 itself when it is free on this machine;
  // otherwise something real already holds it, which is exactly the scenario under test.
  let other;
  try {
    other = await occupy(4000);
  } catch {
    other = undefined;
  }
  try {
    assert.equal(await isPortFree(4000), false, "4000 is occupied for the duration of this test");
    // The real configured ports are probed; 4000 is not among them, so this must not fail because of it.
    const occupiedNames = (await findOccupiedPorts()).map((o) => o.port);
    assert.ok(!occupiedNames.includes(4000), "4000 is never probed or reported");
    if (other) {
      assert.deepEqual(
        occupiedNames.filter((p) => p === configuredPorts.emulatorUi),
        [],
        "4001 is independent of 4000",
      );
      assert.equal(other.isListening(), true, "the unrelated listener was not stopped");
      assert.equal(await other.answers(), true, "the unrelated listener still serves its clients");
    }
  } finally {
    await other?.close();
  }
});

test("preflight passes when every emulator port is free", async () => {
  await assert.doesNotReject(assertEmulatorPortsFree({ ports: await freePreviewPorts() }));
});

test("an unrelated process on the preview's own Emulator UI port fails explicitly and is left alone", async () => {
  const ports = await freePreviewPorts();
  const other = await occupy();
  ports.emulatorUi = other.port;
  try {
    await assert.rejects(assertEmulatorPortsFree({ ports }), (error) => {
      assert.ok(error instanceof PortConflictError);
      assert.deepEqual(
        error.occupied.map((o) => o.name),
        ["emulatorUi"],
      );
      assert.match(
        error.message,
        new RegExp(`${other.port} \\(needed by the Firebase Emulator UI\\)`),
      );
      assert.match(error.message, /does not stop or modify processes it did not start/);
      return true;
    });
    assert.equal(other.isListening(), true, "the unrelated listener was not stopped");
    assert.equal(await other.answers(), true, "the unrelated listener still serves its clients");
  } finally {
    await other.close();
  }
});

test("a conflict on any other required emulator port is also reported, with every conflict listed", async () => {
  const ports = await freePreviewPorts();
  const a = await occupy();
  const b = await occupy();
  ports.auth = a.port;
  ports.firestore = b.port;
  try {
    const occupied = await findOccupiedPorts({ ports });
    assert.deepEqual(
      occupied.map((o) => o.name),
      ["auth", "firestore"],
    );
  } finally {
    await a.close();
    await b.close();
  }
});

test("the preflight only probes: it never signals a process (no kill in the module)", () => {
  const source = fs.readFileSync(path.join(repoRoot, "tests/preview/lib/ports.mjs"), "utf8");
  assert.doesNotMatch(source, /process\.kill|child_process|SIGTERM|SIGKILL|lsof|pkill/);
});

function uiServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () =>
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        close: () =>
          new Promise((done) => {
            server.closeAllConnections?.();
            server.close(done);
          }),
      }),
    );
  });
}

test("readiness: only the Emulator UI of the demo project counts as ready", async () => {
  const real = await uiServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ projectId: "demo-11thonus", hub: {} }));
  });
  const otherProject = await uiServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ projectId: "tiizi-dev" }));
  });
  const unrelatedWeb = await uiServer((req, res) => res.end("<html>some other dev server</html>"));
  const erroring = await uiServer((req, res) => {
    res.statusCode = 500;
    res.end("nope");
  });
  try {
    assert.equal(await emulatorUiReady({ baseUrl: real.baseUrl }), true);
    assert.equal(await emulatorUiReady({ baseUrl: otherProject.baseUrl }), false);
    assert.equal(await emulatorUiReady({ baseUrl: unrelatedWeb.baseUrl }), false);
    assert.equal(await emulatorUiReady({ baseUrl: erroring.baseUrl }), false);
  } finally {
    await Promise.all([real, otherProject, unrelatedWeb, erroring].map((s) => s.close()));
  }
  // Nothing listening at all.
  assert.equal(await emulatorUiReady({ baseUrl: `http://127.0.0.1:${await freePort()}` }), false);
});
