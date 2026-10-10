// Shared helpers for the phone-preview tests: ephemeral fake emulators + a real proxy instance.
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createProxy } from "./proxy.mjs";

export function listen(server) {
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve(server.address().port)),
  );
}
export const close = (server) =>
  new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections?.();
  });

/** A recording HTTP server. `handler(req, res, body)` answers; every request is kept in `.requests`. */
export function recordingServer(handler = (req, res) => res.end("ok")) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      handler(req, res, body);
    });
  });
  return { server, requests };
}

/** Fake Auth + Functions emulators that behave just enough for the verifier's positive checks. */
export function fakeEmulators() {
  const auth = recordingServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url.startsWith("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")) {
      return res.end(JSON.stringify({ idToken: "tok", refreshToken: "ref", localId: "u" }));
    }
    if (req.url.startsWith("/securetoken.googleapis.com/v1/token"))
      return res.end(JSON.stringify({ id_token: "tok" }));
    res.statusCode = 400;
    res.end(JSON.stringify({ error: { message: "upstream-rejected" } }));
  });
  const functions = recordingServer((req, res, body) => {
    res.setHeader("content-type", "application/json");
    let rawToken;
    try {
      rawToken = JSON.parse(body.toString()).data?.rawToken;
    } catch {
      /* not JSON */
    }
    res.statusCode = rawToken ? 200 : 401;
    res.end(
      JSON.stringify(rawToken ? { result: {} } : { error: { message: "authentication_failed" } }),
    );
  });
  return { auth, functions };
}

export function tempDist({ host = "phone.example.test" } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "phone-dist-"));
  fs.mkdirSync(path.join(dir, "assets"));
  fs.writeFileSync(path.join(dir, "index.html"), '<!doctype html><div id="root"></div>');
  fs.writeFileSync(path.join(dir, "assets", "app.js"), "console.log(1)");
  fs.writeFileSync(path.join(dir, "phone-preview.json"), JSON.stringify({ host }));
  return dir;
}

export async function startProxy({ maxBodyBytes = 1024, host = "phone.example.test" } = {}) {
  const emulators = fakeEmulators();
  const authPort = await listen(emulators.auth.server);
  const fnPort = await listen(emulators.functions.server);
  const distDir = tempDist({ host });
  const logs = [];
  const proxy = createProxy({
    publicHost: host,
    distDir,
    maxBodyBytes,
    upstream: {
      auth: { host: "127.0.0.1", port: authPort },
      functions: { host: "127.0.0.1", port: fnPort },
    },
    onLog: (entry) => logs.push(entry),
  });
  const port = await listen(proxy);
  return {
    base: `http://127.0.0.1:${port}`,
    port,
    logs,
    emulators,
    distDir,
    stop: async () => {
      await Promise.all([
        close(proxy),
        close(emulators.auth.server),
        close(emulators.functions.server),
      ]);
      fs.rmSync(distDir, { recursive: true, force: true });
    },
  };
}
