// Physical-phone Founder Preview — bounded same-origin reverse proxy.
//
// Serves the production web build and forwards ONLY the allow-listed Auth client routes and
// callables (see policy.mjs) to the two local emulators. Loopback-bound, deny-by-default, and
// never a general-purpose proxy: the upstream hosts/ports are the two constants in config.mjs.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { LOOPBACK, previewStateDir } from "../lib/config.mjs";
import { MAX_BODY_BYTES, PROXY_PORT, distDir, upstream } from "./config.mjs";
import { classify } from "./policy.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
  "referrer-policy": "no-referrer",
  // The Staff Counter scans QR codes with the camera; nothing else is needed.
  "permissions-policy": "camera=(self), microphone=(), geolocation=()",
};

const logPath = path.join(previewStateDir, "logs", "phone-proxy-access.log");

function record(entry) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, "cache-control": "no-store", ...headers });
  res.end(body);
}

/** Host header allow-list (anti DNS-rebinding): the public hostname and the loopback origin only. */
function hostAllowed(host, publicHost) {
  if (!host) return false;
  const name = host.toLowerCase();
  return (
    name === `${LOOPBACK}:${PROXY_PORT}` ||
    name === `localhost:${PROXY_PORT}` ||
    name === publicHost
  );
}

function serveStatic(req, res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  let file = path.join(distDir, rel);
  if (!file.startsWith(distDir + path.sep)) return send(res, 404, "Not found");
  const isAsset = path.extname(rel) !== "";
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    if (isAsset) return send(res, 404, "Not found");
    file = path.join(distDir, "index.html"); // SPA fallback for client-side routes only
    rel = "/index.html";
  }
  const type = MIME[path.extname(file)] ?? "application/octet-stream";
  const immutable = rel.startsWith("/assets/");
  const headers = {
    "content-type": type,
    "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-store",
  };
  res.writeHead(200, { ...SECURITY_HEADERS, ...headers });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

function forward(req, res, target, upstreamPath) {
  const headers = { ...req.headers, host: `${target.host}:${target.port}` };
  // Never forward the browser's cookies or the Access identity assertion to an emulator.
  delete headers.cookie;
  delete headers["cf-access-jwt-assertion"];
  delete headers["cf-access-client-id"];
  delete headers["cf-access-client-secret"];
  const out = http.request(
    { host: target.host, port: target.port, method: req.method, path: upstreamPath, headers },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, {
        ...upstreamRes.headers,
        ...SECURITY_HEADERS,
        "cache-control": "no-store",
      });
      upstreamRes.pipe(res);
    },
  );
  out.on("error", () => {
    if (!res.headersSent) send(res, 502, "Upstream unavailable");
    else res.destroy();
  });
  req.pipe(out);
}

export function createProxy({ publicHost = "" } = {}) {
  const normalizedPublicHost = publicHost.toLowerCase();
  return http.createServer((req, res) => {
    const started = Date.now();
    const url = new URL(req.url ?? "/", "http://placeholder");
    const finish = (decision, status) =>
      record({
        method: req.method,
        path: url.pathname,
        decision: decision.kind,
        reason: decision.reason,
        status,
        ms: Date.now() - started,
      });

    if (!hostAllowed(req.headers.host, normalizedPublicHost)) {
      finish({ kind: "deny", reason: "host" }, 421);
      return send(res, 421, "Misdirected request");
    }
    if (req.headers.upgrade) {
      // No websockets are used by the production build.
      finish({ kind: "deny", reason: "upgrade" }, 400);
      return send(res, 400, "Bad request");
    }

    const decision = classify({
      method: req.method ?? "GET",
      pathname: url.pathname,
      search: url.search,
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      ),
    });

    if (decision.kind === "deny") {
      finish(decision, 404);
      return send(res, 404, "Not found");
    }
    if (decision.kind === "static") {
      finish(decision, 200);
      return serveStatic(req, res, url.pathname);
    }

    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > MAX_BODY_BYTES) {
      finish({ kind: "deny", reason: "body-too-large" }, 413);
      return send(res, 413, "Payload too large");
    }
    let received = 0;
    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) req.destroy();
    });
    res.on("finish", () => finish(decision, res.statusCode));
    forward(req, res, upstream[decision.kind], decision.path);
  });
}

// Run directly: node proxy.mjs  (the phone CLI starts it detached).
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createProxy({ publicHost: process.env.PHONE_PREVIEW_HOST ?? "" });
  // Loopback only: cloudflared connects locally; nothing on the LAN can reach this port.
  server.listen(PROXY_PORT, LOOPBACK, () => {
    console.log(
      `phone proxy listening on http://${LOOPBACK}:${PROXY_PORT} (public host: ${process.env.PHONE_PREVIEW_HOST ?? "none"})`,
    );
  });
}
