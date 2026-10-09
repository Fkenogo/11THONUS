// Tunnel readiness: a started cloudflared is NOT reported as running until it has stayed alive and
// logged an established edge connection. A process that exits first fails with its log tail.
export async function waitForTunnelReady({
  isAlive,
  readLog,
  timeoutMs = 45_000,
  intervalMs = 500,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const log = readLog();
    if (!isAlive()) {
      throw new Error(
        `cloudflared exited before the tunnel was ready.\n--- tunnel log (tail) ---\n${log.split("\n").slice(-25).join("\n")}`,
      );
    }
    if (/Registered tunnel connection/.test(log)) return;
    await sleep(intervalMs);
  }
  throw new Error(
    `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for an established tunnel connection.\n--- tunnel log (tail) ---\n${readLog().split("\n").slice(-25).join("\n")}`,
  );
}
