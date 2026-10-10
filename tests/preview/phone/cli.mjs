#!/usr/bin/env node
// Physical-phone Founder Preview — pnpm preview:phone <command>
//
//   build  --host <public-host>    production web bundle (origin baked in) → .preview/phone-dist
//   start  --host <public-host>    start the loopback phone proxy (needs `pnpm preview:start` running)
//   stop                            stop the proxy and the tunnel (leaves the preview + Cloudflare resources)
//   tunnel --name <tunnel>          run the named Cloudflare tunnel → the proxy ONLY (http://127.0.0.1:28111)
//   status                          proxy/tunnel state
//   verify [--base <url>] [--host <public-host>] [--no-access]   allow-list + negative exposure checks
//
// Local-only tooling around the existing preview; it never starts or alters the emulators or PostgreSQL.
import fs from "node:fs";
import path from "node:path";
import {
  ensureStateDirs,
  isOwnedAndAlive,
  logFile,
  readPid,
  startDetached,
  stopDetached,
  tailLog,
  waitFor,
} from "../lib/processes.mjs";
import { isPortFree } from "../lib/ports.mjs";
import { assertBundleHost, buildPhoneBundle } from "./build.mjs";
import { assertPreviewBackendOwned } from "./ownership.mjs";
import { waitForTunnelReady } from "./tunnel.mjs";
import { IDENTITY_PATH, PROXY_ORIGIN, PROXY_PORT, distDir } from "./config.mjs";
import { runVerification } from "./verify.mjs";

const here = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2);
const command = args[0];
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const log = (m = "") => console.log(m);

function requireHost() {
  const host = flag("host");
  if (!host || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
    throw new Error("--host <public-hostname> is required (e.g. phone-preview.example.com).");
  }
  return host.toLowerCase();
}

async function main() {
  ensureStateDirs();
  switch (command) {
    case "build": {
      const origin = buildPhoneBundle({ publicHost: requireHost() });
      log(`✓ built ${distDir} for ${origin}`);
      return;
    }
    case "start": {
      const host = requireHost();
      if (!fs.existsSync(path.join(distDir, "index.html")))
        throw new Error("Run `pnpm preview:phone build --host …` first.");
      assertBundleHost(host); // never serve a bundle built for host A through host B
      await assertPreviewBackendOwned(); // owned, canonical, seeded — port occupancy proves nothing
      if (!(await isPortFree(PROXY_PORT)) && !isOwnedAndAlive("phone-proxy")) {
        throw new Error(`Port ${PROXY_PORT} is already in use by something else.`);
      }
      if (isOwnedAndAlive("phone-proxy")) await stopDetached("phone-proxy");
      startDetached("phone-proxy", process.execPath, [path.join(here, "proxy.mjs")], {
        env: { ...process.env, PHONE_PREVIEW_HOST: host },
      });
      await waitFor(
        "the phone proxy",
        async () => {
          try {
            return (await fetch(`${PROXY_ORIGIN}${IDENTITY_PATH}`)).ok;
          } catch {
            return false;
          }
        },
        { timeoutMs: 15_000, intervalMs: 300 },
      ).catch((e) => {
        throw new Error(`${e.message}\n${tailLog("phone-proxy")}`);
      });
      log(`✓ phone proxy on ${PROXY_ORIGIN} (public host ${host})`);
      return;
    }
    case "tunnel": {
      const name = flag("name");
      if (!name) throw new Error("--name <tunnel-name> is required.");
      if (isOwnedAndAlive("phone-tunnel")) throw new Error("The tunnel is already running.");
      if (!isOwnedAndAlive("phone-proxy"))
        throw new Error("Start the phone proxy first: `pnpm preview:phone start --host <host>`.");
      // The ONLY origin the tunnel may reach is the phone proxy.
      startDetached(
        "phone-tunnel",
        "cloudflared",
        ["tunnel", "--no-autoupdate", "run", "--url", PROXY_ORIGIN, name],
        { env: process.env },
      );
      try {
        await waitForTunnelReady({
          isAlive: () => isOwnedAndAlive("phone-tunnel"),
          readLog: () => tailLog("phone-tunnel", 400),
        });
      } catch (error) {
        await stopDetached("phone-tunnel"); // clears pid state; never leave a half-started tunnel
        throw error;
      }
      log(
        `✓ cloudflared tunnel "${name}" established → ${PROXY_ORIGIN} (logs: ${logFile("phone-tunnel")})`,
      );
      return;
    }
    case "stop": {
      const tunnel = await stopDetached("phone-tunnel");
      const proxy = await stopDetached("phone-proxy");
      log(
        `tunnel: ${tunnel ? "stopped" : "not running"} · proxy: ${proxy ? "stopped" : "not running"}`,
      );
      log(
        "Emulators, PostgreSQL and Cloudflare resources were left untouched (see the runbook to delete the tunnel/DNS/Access app).",
      );
      return;
    }
    case "status": {
      log(
        `proxy : ${isOwnedAndAlive("phone-proxy") ? `running (pid ${readPid("phone-proxy")}) ${PROXY_ORIGIN}` : "stopped"}`,
      );
      log(
        `tunnel: ${isOwnedAndAlive("phone-tunnel") ? `running (pid ${readPid("phone-tunnel")})` : "stopped"}`,
      );
      log(`bundle: ${fs.existsSync(path.join(distDir, "index.html")) ? distDir : "not built"}`);
      return;
    }
    case "verify": {
      const ok = await runVerification({
        base: flag("base") ?? PROXY_ORIGIN,
        publicHost: flag("host"),
        allowNoAccess: args.includes("--no-access"),
        log,
      });
      process.exitCode = ok ? 0 : 1;
      return;
    }
    default:
      log(
        "usage: pnpm preview:phone <build|start|tunnel|stop|status|verify> [--host H] [--name N] [--base URL] [--no-access]",
      );
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
