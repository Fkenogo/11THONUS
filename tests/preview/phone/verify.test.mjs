import assert from "node:assert/strict";
import test from "node:test";
import { accessHeaders, rawProbe, runVerification } from "./verify.mjs";
import { close, listen, recordingServer, startProxy } from "./test-harness.mjs";

const run = (base, extra = {}) => {
  const lines = [];
  return runVerification({ base, log: (l) => lines.push(l), env: {}, ...extra }).then((ok) => ({
    ok,
    lines,
  }));
};
const onlyGets = (requests) => requests.every((r) => r.method === "GET");

/** A fake target that must never receive a state-changing request. */
async function wrongTarget(handler) {
  const t = recordingServer(handler);
  const port = await listen(t.server);
  return { ...t, base: `http://127.0.0.1:${port}`, stop: () => close(t.server) };
}

test("Auth emulator as --base → aborts before any destructive probe", async () => {
  const t = await wrongTarget((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(req.url === "/" ? JSON.stringify({ authEmulator: { ready: true } }) : "{}");
  });
  const { ok, lines } = await run(t.base);
  assert.equal(ok, false);
  assert.match(lines.join("\n"), /ABORTING before any probe/);
  assert.ok(
    t.requests.length >= 1 && onlyGets(t.requests),
    JSON.stringify(t.requests.map((r) => r.method)),
  );
  await t.stop();
});

test("Firestore emulator as --base → aborts, only GET sent", async () => {
  const t = await wrongTarget((req, res) => {
    res.statusCode = req.method === "GET" ? 200 : 405;
    res.end("Ok");
  });
  const { ok } = await run(t.base);
  assert.equal(ok, false);
  assert.ok(onlyGets(t.requests));
  await t.stop();
});

test("arbitrary HTTP server (even one that fakes the app shell) → aborts, only GET sent", async () => {
  const t = await wrongTarget((req, res) => {
    res.setHeader("content-type", "text/html");
    res.end('<div id="root"></div>');
  });
  const { ok } = await run(t.base);
  assert.equal(ok, false);
  assert.ok(onlyGets(t.requests));
  await t.stop();
});

test("a spoofed identity body without the proxy marker headers is rejected", async () => {
  const t = await wrongTarget((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ proxy: "11thonus-phone-preview", bundleHost: null }));
  });
  const { ok } = await run(t.base);
  assert.equal(ok, false);
  assert.ok(onlyGets(t.requests));
  await t.stop();
});

test("a proxy whose bundle is bound to another host → aborts", async () => {
  const p = await startProxy({ host: "phone.example.test" });
  const { ok, lines } = await run(p.base, {
    publicHost: "other.example.test",
    allowNoAccess: true,
  });
  // fetch() cannot override Host, so the proxy sees 127.0.0.1 and serves identity; binding mismatch aborts.
  assert.equal(ok, false);
  assert.match(lines.join("\n"), /bound to phone\.example\.test|ABORTING/);
  await p.stop();
});

test("valid phone proxy → verification proceeds and passes", async () => {
  const p = await startProxy();
  const { ok, lines } = await run(p.base);
  assert.equal(ok, true, lines.join("\n"));
  assert.match(lines.join("\n"), /target identified as the phone-preview proxy/);
  // Every destructive probe was answered by the proxy: the fake emulators never saw DELETE/PUT.
  const upstream = [...p.emulators.auth.requests, ...p.emulators.functions.requests];
  assert.ok(
    upstream.every((r) => r.method === "POST"),
    "emulators only ever received allow-listed POSTs",
  );
  assert.ok(
    !upstream.some((r) => /emulator\/v1|createBusiness|discoverPlatformAdministrator/.test(r.url)),
  );
  await p.stop();
});

test("a probe that is FORWARDED upstream fails even if the emulator rejects it", async () => {
  const p = await startProxy();
  // Simulate a regression: pretend the proxy forwards a denied route by answering it from the
  // functions upstream path. The verifier must require the proxy denial marker, not just a 4xx.
  const lines = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const response = await realFetch(url, init);
    if (String(url).endsWith("/__fn/createBusiness")) {
      return new Response("{}", {
        status: 400,
        headers: {
          "x-phone-preview-proxy": "11thonus-phone-preview",
          "x-phone-preview-decision": "functions",
        },
      });
    }
    return response;
  };
  try {
    const ok = await runVerification({ base: p.base, log: (l) => lines.push(l), env: {} });
    assert.equal(ok, false);
    assert.match(
      lines.join("\n"),
      /FAIL {2}not reachable: non-allow-listed callable createBusiness/,
    );
  } finally {
    globalThis.fetch = realFetch;
    await p.stop();
  }
});

test("a public origin without Access credentials fails clearly and sends nothing", async () => {
  const { ok, lines } = await run("https://phone.example.test");
  assert.equal(ok, false);
  assert.match(lines.join("\n"), /CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET/);
  assert.match(lines.join("\n"), /No requests were sent/);
});

test("Access service-token headers are sent on fetch requests and on the raw Host probe", async () => {
  const env = { CF_ACCESS_CLIENT_ID: "id.access", CF_ACCESS_CLIENT_SECRET: "secret" };
  assert.deepEqual(accessHeaders(env), {
    "cf-access-client-id": "id.access",
    "cf-access-client-secret": "secret",
  });
  assert.deepEqual(accessHeaders({ CF_ACCESS_CLIENT_ID: "only-id" }), {});

  const t = await wrongTarget();
  await runVerification({ base: t.base, log: () => {}, env });
  assert.equal(t.requests[0].headers["cf-access-client-id"], "id.access");
  assert.equal(t.requests[0].headers["cf-access-client-secret"], "secret");

  await rawProbe(t.base, "127.0.0.1:4400", accessHeaders(env));
  const raw = t.requests.at(-1);
  assert.equal(raw.headers.host, "127.0.0.1:4400");
  assert.equal(raw.headers["cf-access-client-id"], "id.access");
  await t.stop();
});
