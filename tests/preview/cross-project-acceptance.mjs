// CI integration proof: hold the legacy project ports as unrelated TCP listeners while the full
// Founder Preview lifecycle and browser journeys use the dedicated 281xx allocation.
import assert from "node:assert/strict";
import net from "node:net";
import { spawn } from "node:child_process";

const legacyPorts = [4000, 4001, 9099];

function occupy(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.connectionCount = 0;
    server.on("connection", (socket) => {
      server.connectionCount += 1;
      socket.destroy();
    });
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port }, () => resolve(server));
  });
}

function runPreview(command) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", [command], { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`pnpm ${command} exited with ${signal ?? code}.`));
    });
  });
}

const listeners = [];
let previewStarted = false;
try {
  for (const port of legacyPorts) listeners.push(await occupy(port));
  console.log(`Legacy ports held by test fixtures: ${legacyPorts.join(", ")}`);

  await runPreview("preview:start");
  previewStarted = true;
  await runPreview("preview:status");
  await runPreview("preview:verify");
  await runPreview("preview:reset");
  await runPreview("preview:verify");
  await runPreview("test:e2e:preview");

  assert.ok(
    listeners.every((server) => server.listening && server.connectionCount === 0),
    "legacy test listeners remain open and received no preview connections",
  );
  console.log("Cross-project port-isolation acceptance passed; legacy listeners remained open.");
} finally {
  try {
    if (previewStarted) await runPreview("preview:stop");
  } finally {
    await Promise.all(
      listeners.map(
        (server) =>
          new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
    );
  }
}
