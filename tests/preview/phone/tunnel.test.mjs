import assert from "node:assert/strict";
import test from "node:test";
import { waitForTunnelReady } from "./tunnel.mjs";

const fast = { intervalMs: 1, sleep: () => new Promise((r) => setTimeout(r, 1)) };

test("ready only once an edge connection is registered and the process is alive", async () => {
  let polls = 0;
  await waitForTunnelReady({
    isAlive: () => true,
    readLog: () =>
      ++polls < 3 ? "INF Starting tunnel" : "INF Registered tunnel connection connIndex=0",
    ...fast,
  });
  assert.ok(polls >= 3);
});

test("cloudflared exiting early fails with its log, never success", async () => {
  await assert.rejects(
    waitForTunnelReady({
      isAlive: () => false,
      readLog: () => "ERR Tunnel credentials not found",
      ...fast,
    }),
    /exited before the tunnel was ready[\s\S]*credentials not found/,
  );
});

test("an alive process that never connects times out with its log", async () => {
  await assert.rejects(
    waitForTunnelReady({
      isAlive: () => true,
      readLog: () => "INF Starting tunnel",
      timeoutMs: 20,
      ...fast,
    }),
    /Timed out[\s\S]*Starting tunnel/,
  );
});

test("a process that dies after logging a connection is still caught on the next poll", async () => {
  // The log already shows a connection but the process is gone: not usable.
  await assert.rejects(
    waitForTunnelReady({
      isAlive: () => false,
      readLog: () => "INF Registered tunnel connection",
      ...fast,
    }),
    /exited before the tunnel was ready/,
  );
});
