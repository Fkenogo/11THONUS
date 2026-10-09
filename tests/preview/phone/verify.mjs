// Allow-list + negative exposure checks, runnable against the local proxy or the public hostname.
//
// Safety order (never reorder):
//   1. credentials check for a public (Access-protected) origin;
//   2. GET-only IDENTITY probe — the target must prove it is the phone proxy (marker header, id,
//      and, when a host is given, a bundle bound to that host);
//   3. only then the positive checks and the negative probes (which include DELETE/PUT).
// If the identity probe fails the run aborts at once: no non-GET request is ever sent to an
// unverified base, so a mistyped --base (e.g. the Auth or Firestore emulator) can never be wiped.
import http from "node:http";
import https from "node:https";
import {
  CALLABLE_ALLOWLIST,
  HEADER_DECISION,
  HEADER_PROXY,
  IDENTITY_PATH,
  PROXY_ID,
} from "./config.mjs";

const AUTH = "/identitytoolkit.googleapis.com/v1";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export function isLoopbackBase(base) {
  return LOOPBACK_HOSTS.has(new URL(base).hostname);
}

/** Cloudflare Access service-token headers from the environment (never committed). */
export function accessHeaders(env = process.env) {
  const id = env.CF_ACCESS_CLIENT_ID;
  const secret = env.CF_ACCESS_CLIENT_SECRET;
  return id && secret ? { "cf-access-client-id": id, "cf-access-client-secret": secret } : {};
}

/** fetch() forbids overriding Host, so the Host-pinning probe uses the raw client. */
export function rawProbe(base, host, extraHeaders) {
  const url = new URL(base);
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: "/",
        method: "GET",
        headers: { ...extraHeaders, host },
        servername: url.hostname,
      },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode, decision: res.headers[HEADER_DECISION] });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

export async function runVerification({
  base,
  publicHost,
  log,
  env = process.env,
  allowNoAccess = false,
}) {
  const access = accessHeaders(env);
  if (!isLoopbackBase(base) && !allowNoAccess && Object.keys(access).length === 0) {
    log(
      "FAIL  public origin requires Cloudflare Access service-token credentials: set CF_ACCESS_CLIENT_ID and " +
        "CF_ACCESS_CLIENT_SECRET (or pass --no-access if this origin is intentionally not behind Access). " +
        "No requests were sent.",
    );
    return false;
  }

  const headers = { ...access, ...(publicHost ? { host: publicHost } : {}) };
  const f = (p, init = {}) =>
    fetch(`${base}${p}`, {
      ...init,
      headers: { ...headers, ...init.headers },
      redirect: "manual",
    });

  // --- 2. identity gate (GET only) -------------------------------------------------------------
  let identity = null;
  let identityResponse = null;
  try {
    identityResponse = await f(IDENTITY_PATH);
    if (identityResponse.status === 200) identity = await identityResponse.json();
  } catch {
    identity = null;
  }
  const isProxy =
    identity?.proxy === PROXY_ID &&
    identityResponse?.headers.get(HEADER_PROXY) === PROXY_ID &&
    identityResponse?.headers.get(HEADER_DECISION) === "identity";
  if (!isProxy) {
    log(
      `FAIL  ${base} did not identify as the 11thONUS phone-preview proxy. ABORTING before any probe — ` +
        "no state-changing request was sent. Check --base (it must be the proxy, never an emulator port).",
    );
    return false;
  }
  if (publicHost && identity.bundleHost !== publicHost.toLowerCase()) {
    log(
      `FAIL  the proxy's bundle is bound to ${identity.bundleHost ?? "(none)"}, not ${publicHost}. ABORTING; rebuild for this host.`,
    );
    return false;
  }

  let failures = 0;
  const check = (name, pass, detail = "") => {
    log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
    if (!pass) failures += 1;
  };
  check("target identified as the phone-preview proxy", true, `bundle host ${identity.bundleHost}`);

  const root = await f("/");
  const shell = await root.text();
  check(
    "web app shell served",
    root.status === 200 && shell.includes('<div id="root"'),
    String(root.status),
  );
  check("no service worker shipped", (await f("/sw.js")).status === 404);
  if (!(root.status === 200 && shell.includes('<div id="root"'))) {
    log("FAIL  the app shell is missing — ABORTING before the negative probes.");
    return false;
  }

  // --- 3a. positive checks -----------------------------------------------------------------------
  const staff = { email: "diane.staff@preview.example.test", password: "Preview-Only-Passw0rd!" };
  const signIn = await f(`${AUTH}/accounts:signInWithPassword?key=k`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...staff, returnSecureToken: true }),
  });
  const signInBody = await signIn.json().catch(() => ({}));
  check(
    "Auth sign-in route works",
    signIn.ok && typeof signInBody.idToken === "string",
    String(signIn.status),
  );
  if (signInBody.idToken) {
    const call = await f("/__fn/getAccessibleBusinesses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${signInBody.idToken}`,
      },
      body: JSON.stringify({ data: { rawToken: signInBody.idToken, referenceType: "email" } }),
    });
    check(
      "allow-listed callable works with the ID token",
      call.status === 200,
      String(call.status),
    );
    const noToken = await f("/__fn/getAccessibleBusinesses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: {} }),
    });
    check(
      "unauthenticated callable is refused by the function (not the proxy)",
      (noToken.status === 401 || noToken.status === 403) &&
        noToken.headers.get(HEADER_DECISION) === "functions",
      String(noToken.status),
    );
    const refresh = await f("/securetoken.googleapis.com/v1/token?key=k", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(signInBody.refreshToken)}`,
    });
    check("token refresh route works", refresh.ok, String(refresh.status));
  }

  // --- 3b. negative exposure: PROXY-originated denial required ------------------------------------
  // Pass only when the proxy itself answered: its denial marker (404), or its own static SPA shell /
  // static 404. A response marked auth/functions was FORWARDED upstream and is a failure even when
  // the emulator then rejected it; an unmarked response is not from the proxy at all.
  const negatives = [
    ["Emulator UI path", "GET", "/emulator-ui"],
    ["Emulator Hub /emulators", "GET", "/emulators"],
    [
      "Emulator Hub /functions/projects",
      "GET",
      "/functions/projects/demo-11thonus/trigger_multicast",
    ],
    ["Auth /emulator/ accounts (read)", "GET", "/emulator/v1/projects/demo-11thonus/accounts"],
    ["Auth /emulator/ accounts (clear)", "DELETE", "/emulator/v1/projects/demo-11thonus/accounts"],
    [
      "Auth verification-code inspection",
      "GET",
      "/emulator/v1/projects/demo-11thonus/verificationCodes",
    ],
    ["Auth oobCodes inspection", "GET", "/emulator/v1/projects/demo-11thonus/oobCodes"],
    ["Auth emulator config reset", "PUT", "/emulator/v1/projects/demo-11thonus/config"],
    ["Auth admin batchGet", "POST", `${AUTH}/projects/demo-11thonus/accounts:batchGet`],
    ["Auth admin delete", "POST", `${AUTH}/projects/demo-11thonus/accounts:delete`],
    ["Auth sendOobCode (not allow-listed)", "POST", `${AUTH}/accounts:sendOobCode?key=k`],
    ["Firestore emulator REST", "GET", "/v1/projects/demo-11thonus/databases/(default)/documents"],
    [
      "Firestore emulator clear",
      "DELETE",
      "/emulator/v1/projects/demo-11thonus/databases/(default)/documents",
    ],
    ["Firestore listen channel", "POST", "/google.firestore.v1.Firestore/Listen/channel"],
    ["Storage emulator", "GET", "/v0/b/demo-11thonus.appspot.com/o"],
    ["Functions emulator direct route", "POST", "/demo-11thonus/europe-west1/authenticate"],
    ["non-allow-listed callable createBusiness", "POST", "/__fn/createBusiness"],
    [
      "non-allow-listed callable discoverPlatformAdministrator",
      "POST",
      "/__fn/discoverPlatformAdministrator",
    ],
    ["traversal", "GET", "/%2e%2e/%2e%2e/etc/passwd"],
    ["PostgreSQL port path", "GET", "/28110"],
  ];
  for (const [name, method, p] of negatives) {
    const response = await f(p, {
      method,
      headers: { "content-type": "application/json" },
      body: ["POST", "PUT"].includes(method) ? "{}" : undefined,
    });
    const decision = response.headers.get(HEADER_DECISION);
    let verdict = null;
    if (response.headers.get(HEADER_PROXY) === PROXY_ID) {
      if (decision === "deny" && response.status === 404) verdict = "proxy denied (404)";
      else if (decision === "static") {
        const body = await response.text();
        if (response.status === 404 || (response.status === 200 && body === shell)) {
          verdict = `proxy static ${response.status}`;
        }
      }
    }
    check(
      `not reachable: ${name}`,
      verdict !== null,
      verdict ?? `NOT a proxy denial: ${response.status} decision=${decision ?? "none"}`,
    );
  }

  // Host pinning: a request naming another local service is refused by the proxy.
  const rebind = await rawProbe(base, "127.0.0.1:4400", access);
  check(
    "unrelated localhost host header refused by the proxy (421)",
    rebind.status === 421 && rebind.decision === "deny",
    String(rebind.status),
  );

  // The admin credential must never be accepted even on an allow-listed Auth route.
  const owner = await f(`${AUTH}/accounts:signUp?key=k`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer owner" },
    body: JSON.stringify({ email: "x@y.test", password: "Aaaaaa1!", returnSecureToken: true }),
  });
  check(
    "Bearer owner on an Auth route is refused by the proxy",
    owner.status === 404 && owner.headers.get(HEADER_DECISION) === "deny",
    String(owner.status),
  );

  log(
    `\n${CALLABLE_ALLOWLIST.length} callables allow-listed; ${failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILED`}`,
  );
  return failures === 0;
}
