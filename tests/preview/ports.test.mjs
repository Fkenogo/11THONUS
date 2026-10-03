// Founder Preview (EA-002-CORR-001) — regression tests for the Emulator UI port collision.
// Real sockets, no services required:  pnpm test:preview-tooling
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { test } from "node:test";
import { emulatorUiReady, previewEmulatorsReady } from "./lib/emulatorClient.mjs";
import {
  DEFAULT_POSTGRES_URL,
  emulatorLaunchPorts,
  emulatorPortFingerprint,
  ports as configuredPorts,
  repoRoot,
  urls,
} from "./lib/config.mjs";
import {
  PortConflictError,
  assertEmulatorPortsFree,
  findOccupiedPorts,
  isPortFree,
} from "./lib/ports.mjs";

/** An "unrelated local project": a plain TCP server on a port the OS picks (or a given one). */
function occupy(port = 0, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const sockets = new Set();
    const server = net.createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      socket.end("unrelated-service\n");
    });
    server.once("error", reject);
    server.listen({ port, host }, () =>
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
  const listeners = await Promise.all(emulatorLaunchPorts.map(() => occupy()));
  const ports = Object.fromEntries(
    emulatorLaunchPorts.map((name, index) => [name, listeners[index].port]),
  );
  await Promise.all(listeners.map((listener) => listener.close()));
  return ports;
}

test("configuration: every Founder Preview service uses its dedicated 281xx port", () => {
  assert.deepEqual(configuredPorts, {
    auth: 28101,
    functions: 28102,
    firestore: 28103,
    storage: 28104,
    hosting: 28105,
    emulatorUi: 28106,
    hub: 28107,
    logging: 28108,
    web: 28109,
    postgres: 28110,
  });
  assert.equal(urls.emulatorUi, "http://localhost:28106");
  assert.equal(urls.web, "http://localhost:28109");
  assert.equal(urls.auth, "http://127.0.0.1:28101");
  assert.match(urls.functions, /^http:\/\/127\.0\.0\.1:28102\/demo-11thonus\/europe-west1$/);
  assert.equal(urls.firestore, "http://127.0.0.1:28103");
  assert.equal(new URL(DEFAULT_POSTGRES_URL).port, String(configuredPorts.postgres));
  assert.equal(
    emulatorPortFingerprint,
    JSON.stringify(
      Object.fromEntries(emulatorLaunchPorts.map((name) => [name, configuredPorts[name]])),
    ),
  );
  for (const name of Object.keys(configuredPorts)) {
    assert.ok(![4000, 4001, 9099, 5001, 8080, 5173, 54329].includes(configuredPorts[name]));
  }
});

test("configuration: tests/preview/lib/config.mjs and firebase.json (what the Firebase CLI reads) agree", () => {
  const firebase = JSON.parse(fs.readFileSync(path.join(repoRoot, "firebase.json"), "utf8"));
  const e = firebase.emulators;
  assert.equal(e.auth.port, configuredPorts.auth);
  assert.equal(e.functions.port, configuredPorts.functions);
  assert.equal(e.firestore.port, configuredPorts.firestore);
  assert.equal(e.storage.port, configuredPorts.storage);
  assert.equal(e.hosting.port, configuredPorts.hosting);
  assert.equal(e.ui.port, configuredPorts.emulatorUi);
  assert.equal(e.hub.port, configuredPorts.hub);
  assert.equal(e.logging.port, configuredPorts.logging);
  assert.equal(firebase.emulators.singleProjectMode, true);
});

test("all runtime consumers derive emulator endpoints from the guarded port configuration", () => {
  const source = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  const appPorts = source("apps/web/src/infrastructure/firebase/emulatorPorts.ts");
  for (const [name, key, port] of [
    ["auth", "AUTH", configuredPorts.auth],
    ["functions", "FUNCTIONS", configuredPorts.functions],
    ["firestore", "FIRESTORE", configuredPorts.firestore],
    ["storage", "STORAGE", configuredPorts.storage],
  ]) {
    assert.ok(appPorts.includes(`VITE_FIREBASE_${key}_EMULATOR_PORT`));
    assert.ok(appPorts.includes(`    ${port},`), `${name} fallback must match the preview port`);
    assert.ok(
      source(`apps/web/src/infrastructure/firebase/${name}.ts`).includes("FIREBASE_EMULATOR_PORTS"),
      `${name} SDK client must consume the shared emulator port config`,
    );
  }
  assert.ok(source("tests/e2e/emulator/seedCommerceKnowledge.mjs").includes("ports.firestore"));
  assert.ok(source("tests/e2e/emulator/terms-and-team.spec.ts").includes("urls.functions"));
  assert.ok(source("playwright.config.ts").includes("baseURL: urls.web"));
  assert.ok(
    source("tests/preview/lib/postgres.mjs").includes(
      "PREVIEW_POSTGRES_PORT: String(ports.postgres)",
    ),
  );
  assert.ok(
    source("docker-compose.postgres.yml").includes(
      "127.0.0.1:${PREVIEW_POSTGRES_PORT:-54329}:5432",
    ),
  );
  const ci = source(".github/workflows/ci.yml");
  assert.ok(ci.includes(`- ${configuredPorts.postgres}:5432`));
  assert.ok(ci.includes(`@localhost:${configuredPorts.postgres}/eleventhonus_platform_local`));
  assert.ok(ci.includes(`@localhost:${configuredPorts.postgres}/eleventhonus_platform_test`));
});

test("legacy project ports 4000, 4001 and 9099 can be occupied without being probed", async () => {
  const occupiedLegacyPorts = new Set([4000, 4001, 9099]);
  const probed = [];
  await assertEmulatorPortsFree({
    ports: configuredPorts,
    probe: async (port) => {
      probed.push(port);
      assert.ok(!occupiedLegacyPorts.has(port), `must not probe unrelated legacy port ${port}`);
      return true;
    },
  });
  assert.deepEqual(
    probed,
    emulatorLaunchPorts.map((name) => configuredPorts[name]),
  );
});

test("emulator and web readiness probes run only for positively owned preview processes", () => {
  const runtime = fs.readFileSync(path.join(repoRoot, "tests/preview/lib/runtime.mjs"), "utf8");
  const cli = fs.readFileSync(path.join(repoRoot, "tests/preview/cli.mjs"), "utf8");
  const processes = fs.readFileSync(path.join(repoRoot, "tests/preview/lib/processes.mjs"), "utf8");
  assert.match(
    runtime,
    /isOwnedWithConfig\("emulators", emulatorPortFingerprint\)[\s\S]*?emulatorsReady\(\)/,
  );
  assert.match(runtime, /if \(!isOwnedAndAlive\("web"\)\) throw new Error[\s\S]*?fetch\(/);
  assert.ok(!runtime.includes("webPortAnswers"));
  assert.ok(cli.includes('isOwnedWithConfig("emulators", emulatorPortFingerprint)'));
  assert.match(processes, /JSON\.stringify\(\{ pid: child\.pid, stamp, configFingerprint \}\)/);
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

test("an IPv6-only listener does not block the preview's IPv4 loopback port", async (t) => {
  let other;
  try {
    other = await occupy(0, "::1");
  } catch (error) {
    if (["EADDRNOTAVAIL", "EAFNOSUPPORT", "EPERM"].includes(error.code)) {
      t.skip("IPv6 loopback is unavailable in this environment");
      return;
    }
    throw error;
  }
  try {
    assert.equal(await isPortFree(other.port), true);
    assert.equal(other.isListening(), true, "the IPv6-only listener remains untouched");
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

test("readiness: an Emulator UI that never responds is bounded by the request timeout", async () => {
  const hanging = await uiServer(() => {});
  try {
    assert.equal(await emulatorUiReady({ baseUrl: hanging.baseUrl, timeoutMs: 25 }), false);
  } finally {
    await hanging.close();
  }
});

test("an existing emulator suite is reusable only when its demo-project UI is ready", async () => {
  assert.equal(
    await previewEmulatorsReady({ coreReady: async () => true, uiReady: async () => false }),
    false,
  );
  assert.equal(
    await previewEmulatorsReady({ coreReady: async () => true, uiReady: async () => true }),
    true,
  );
  assert.equal(
    await previewEmulatorsReady({ coreReady: async () => false, uiReady: async () => true }),
    false,
  );
});
