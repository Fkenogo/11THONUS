// Allow-list + negative exposure checks, runnable against the local proxy or the public hostname.
import http from "node:http";
import https from "node:https";
import { CALLABLE_ALLOWLIST } from "./config.mjs";

const AUTH = "/identitytoolkit.googleapis.com/v1";

/** A denied probe: 404/421/4xx, or the SPA shell (never emulator content). */
async function isNotExposed(response, shell) {
  if (response.status >= 400) return `${response.status}`;
  const type = response.headers.get("content-type") ?? "";
  if (response.status === 200 && type.startsWith("text/html")) {
    return (await response.text()) === shell ? "200 (SPA shell only)" : null;
  }
  return null;
}

/** fetch() forbids overriding Host, so this probe uses the raw client. */
function rawStatus(base, host) {
  const url = new URL(base);
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: "/",
        method: "GET",
        headers: { host },
        servername: url.hostname,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.on("error", reject);
    req.end();
  });
}

export async function runVerification({ base, publicHost, log }) {
  const headers = publicHost ? { host: publicHost } : {};
  const f = (p, init = {}) =>
    fetch(`${base}${p}`, { ...init, headers: { ...headers, ...init.headers }, redirect: "manual" });
  let failures = 0;
  const check = (name, pass, detail = "") => {
    log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
    if (!pass) failures += 1;
  };

  const root = await f("/");
  const shell = await root.text();
  check(
    "web app shell served",
    root.status === 200 && shell.includes('<div id="root"'),
    String(root.status),
  );
  check("no service worker shipped", (await f("/sw.js")).status === 404);

  // Positive: real sign-in + a real callable through the proxy (Edge: Access may require a service token on the public host).
  const identity = {
    email: "diane.staff@preview.example.test",
    password: "Preview-Only-Passw0rd!",
  };
  const signIn = await f(`${AUTH}/accounts:signInWithPassword?key=k`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...identity, returnSecureToken: true }),
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
      noToken.status === 401 || noToken.status === 403,
      String(noToken.status),
    );
    const refresh = await f("/securetoken.googleapis.com/v1/token?key=k", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(signInBody.refreshToken)}`,
    });
    check("token refresh route works", refresh.ok, String(refresh.status));
  }

  // Negative exposure.
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
    const verdict = await isNotExposed(response, shell);
    check(`not reachable: ${name}`, verdict !== null, verdict ?? `EXPOSED ${response.status}`);
  }
  // Host pinning: a request naming another local service (DNS-rebinding / unrelated port) is refused.
  const rebindStatus = await rawStatus(base, "127.0.0.1:4400");
  check(
    "unrelated localhost host header refused (421)",
    rebindStatus === 421,
    String(rebindStatus),
  );
  // The admin credential must never be accepted even on an allow-listed Auth route.
  const owner = await f(`${AUTH}/accounts:signUp?key=k`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer owner" },
    body: JSON.stringify({ email: "x@y.test", password: "Aaaaaa1!", returnSecureToken: true }),
  });
  check("Bearer owner on an Auth route is refused", owner.status === 404, String(owner.status));

  log(
    `\n${CALLABLE_ALLOWLIST.length} callables allow-listed; ${failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILED`}`,
  );
  return failures === 0;
}
