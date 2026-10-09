// Physical-phone Founder Preview — bounded same-origin reverse proxy.
//
// Serves the production web build and forwards ONLY the allow-listed Auth client routes and
// callables (see policy.mjs) to the two local emulators. Loopback-bound, deny-by-default, and
// never a general-purpose proxy: the upstream hosts/ports are the two constants in config.mjs.
//
// Every response carries `x-phone-preview-proxy` and `x-phone-preview-decision`, so a verifier can
// tell a PROXY denial from an upstream emulator's own error. Request bodies are buffered up to
// MAX_BODY_BYTES BEFORE anything is forwarded: an oversized request gets a deterministic 413 and
// never reaches an emulator.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { LOOPBACK, previewStateDir } from "../lib/config.mjs";
import {
  BUNDLE_META_FILE,
  DENY_BODY,
  HEADER_DECISION,
  HEADER_PROXY,
  MAX_BODY_BYTES,
  PROXY_ID,
  PROXY_PORT,
  distDir as defaultDistDir,
  upstream as defaultUpstream,
} from "./config.mjs";
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

const defaultLogPath = path.join(previewStateDir, "logs", "phone-proxy-access.log");

function defaultOnLog(entry) {
  fs.mkdirSync(path.dirname(defaultLogPath), { recursive: true });
  fs.appendFileSync(defaultLogPath, `${JSON.stringify(entry)}\n`);
}

/** Host header allow-list (anti DNS-rebinding): the public hostname and the loopback origins only. */
function hostAllowed(host, publicHost, port) {
  if (!host) return false;
  const name = host.toLowerCase();
  return name === `${LOOPBACK}:${port}` || name === `localhost:${port}` || name === publicHost;
}

export function createProxy({
  publicHost = "",
  distDir = defaultDistDir,
  upstream = defaultUpstream,
  maxBodyBytes = MAX_BODY_BYTES,
  onLog = defaultOnLog,
} = {}) {
  const normalizedPublicHost = publicHost.toLowerCase();

  function readBundleMeta() {
    try {
      return JSON.parse(fs.readFileSync(path.join(distDir, BUNDLE_META_FILE), "utf8"));
    } catch {
      return null;
    }
  }

  function send(res, decision, status, body, headers = {}) {
    res.writeHead(status, {
      ...SECURITY_HEADERS,
      "cache-control": "no-store",
      ...headers,
      [HEADER_PROXY]: PROXY_ID,
      [HEADER_DECISION]: decision,
    });
    res.end(body);
  }
  const sendDeny = (res, status) => send(res, "deny", status, DENY_BODY);

  function serveStatic(req, res, pathname) {
    let rel = pathname === "/" ? "/index.html" : pathname;
    let file = path.join(distDir, rel);
    if (!file.startsWith(distDir + path.sep)) return sendDeny(res, 404);
    const isAsset = path.extname(rel) !== "";
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      if (isAsset) return send(res, "static", 404, "Not found");
      file = path.join(distDir, "index.html"); // SPA fallback for client-side routes only
      rel = "/index.html";
    }
    // The bundle metadata is the proxy's own record, never an asset.
    if (path.basename(file) === BUNDLE_META_FILE) return sendDeny(res, 404);
    const immutable = rel.startsWith("/assets/");
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-store",
      [HEADER_PROXY]: PROXY_ID,
      [HEADER_DECISION]: "static",
    });
    if (req.method === "HEAD") return res.end();
    const stream = fs.createReadStream(file);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  }

  /** Forwards a fully buffered, size-checked body. Nothing is sent upstream before this point. */
  function forward(req, res, target, upstreamPath, body, decisionKind) {
    const headers = { ...req.headers, host: `${target.host}:${target.port}` };
    // Never forward the browser's cookies or the Access identity assertion to an emulator.
    delete headers.cookie;
    delete headers["cf-access-jwt-assertion"];
    delete headers["cf-access-client-id"];
    delete headers["cf-access-client-secret"];
    delete headers["transfer-encoding"];
    headers["content-length"] = String(body.length);
    const out = http.request(
      { host: target.host, port: target.port, method: req.method, path: upstreamPath, headers },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, {
          ...upstreamRes.headers,
          ...SECURITY_HEADERS,
          "cache-control": "no-store",
          [HEADER_PROXY]: PROXY_ID,
          [HEADER_DECISION]: decisionKind,
        });
        upstreamRes.pipe(res);
      },
    );
    out.on("error", () => {
      if (!res.headersSent) send(res, "upstream-error", 502, "Upstream unavailable");
      else res.destroy();
    });
    out.end(body);
  }

  /** Buffers up to the limit; resolves null (after sending 413) when the body is too large. */
  function readBounded(req, res, onTooLarge) {
    return new Promise((resolve) => {
      const declared = Number(req.headers["content-length"] ?? 0);
      const tooLarge = () => {
        req.removeAllListeners("data");
        req.removeAllListeners("end");
        onTooLarge(); // record the decision BEFORE responding: the log line is written on close
        res.once("finish", () => req.destroy());
        send(res, "deny", 413, DENY_BODY, { connection: "close" });
        resolve(null);
      };
      if (declared > maxBodyBytes) return tooLarge();
      const chunks = [];
      let received = 0;
      req.on("data", (chunk) => {
        received += chunk.length;
        if (received > maxBodyBytes) return tooLarge();
        chunks.push(chunk);
      });
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", () => resolve(null));
    });
  }

  return http.createServer((req, res) => {
    const started = Date.now();
    const url = new URL(req.url ?? "/", "http://placeholder");
    let decision = { kind: "deny", reason: "unclassified" };
    // One log line per request, written when the response is actually over, with the real status.
    res.once("close", () =>
      onLog({
        at: new Date().toISOString(),
        method: req.method,
        path: url.pathname,
        decision: decision.kind,
        reason: decision.reason,
        status: res.writableFinished ? res.statusCode : "aborted",
        ms: Date.now() - started,
      }),
    );

    if (!hostAllowed(req.headers.host, normalizedPublicHost, req.socket.localPort)) {
      decision = { kind: "deny", reason: "host" };
      return sendDeny(res, 421);
    }
    if (req.headers.upgrade) {
      decision = { kind: "deny", reason: "upgrade" }; // no websockets in the production build
      return sendDeny(res, 400);
    }

    decision = classify({
      method: req.method ?? "GET",
      pathname: url.pathname,
      search: url.search,
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      ),
    });

    if (decision.kind === "deny") return sendDeny(res, 404);
    if (decision.kind === "identity") {
      return send(
        res,
        "identity",
        200,
        JSON.stringify({
          proxy: PROXY_ID,
          publicHost: normalizedPublicHost || null,
          bundleHost: readBundleMeta()?.host ?? null,
        }),
        { "content-type": "application/json" },
      );
    }
    if (decision.kind === "static") return serveStatic(req, res, url.pathname);

    const kind = decision.kind;
    const target = upstream[kind];
    const path_ = decision.path;
    readBounded(req, res, () => {
      decision = { kind: "deny", reason: "body-too-large" };
    }).then((body) => {
      if (body !== null) forward(req, res, target, path_, body, kind);
    });
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
