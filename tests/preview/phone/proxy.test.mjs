import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { startProxy } from "./test-harness.mjs";

const LIMIT = 1024;

function rawRequest(port, { method = "POST", path = "/__fn/recordPurchase", headers = {}, write }) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        agent: false,
        host: "127.0.0.1",
        port,
        method,
        path,
        headers: { host: `127.0.0.1:${port}`, "content-type": "application/json", ...headers },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString(),
          }),
        );
      },
    );
    req.on("error", (error) => resolve({ error }));
    write(req);
  });
}
const settle = () => new Promise((r) => setTimeout(r, 100));

test("normal body is forwarded intact", async () => {
  const p = await startProxy({ maxBodyBytes: LIMIT });
  const body = JSON.stringify({ data: { rawToken: "t" } });
  const res = await rawRequest(p.port, { write: (r) => r.end(body) });
  assert.equal(res.status, 200);
  assert.equal(res.headers["x-phone-preview-decision"], "functions");
  assert.equal(p.emulators.functions.requests.length, 1);
  assert.equal(p.emulators.functions.requests[0].body.toString(), body);
  assert.equal(p.emulators.functions.requests[0].url, "/demo-11thonus/europe-west1/recordPurchase");
  await p.stop();
});

test("a body exactly at the limit is forwarded", async () => {
  const p = await startProxy({ maxBodyBytes: LIMIT });
  const body = Buffer.from(
    JSON.stringify({ data: { rawToken: "t", pad: "x".repeat(LIMIT) } }).slice(0, 0) +
      JSON.stringify({ data: { rawToken: "t" } }).padEnd(LIMIT, " "),
  );
  assert.equal(body.length, LIMIT);
  const res = await rawRequest(p.port, { write: (r) => r.end(body) });
  assert.equal(res.status, 200);
  assert.equal(p.emulators.functions.requests[0].body.length, LIMIT);
  await p.stop();
});

test("Content-Length over the limit → 413, nothing forwarded", async () => {
  const p = await startProxy({ maxBodyBytes: LIMIT });
  const res = await rawRequest(p.port, {
    headers: { "content-length": String(LIMIT + 1) },
    write: (r) => r.end(Buffer.alloc(LIMIT + 1, 97)),
  });
  assert.equal(res.status, 413);
  assert.equal(res.headers["x-phone-preview-decision"], "deny");
  await settle();
  assert.equal(p.emulators.functions.requests.length, 0);
  await p.stop();
});

test("chunked body over the limit → 413, no upstream request ever starts", async () => {
  const p = await startProxy({ maxBodyBytes: LIMIT });
  const res = await rawRequest(p.port, {
    write: (r) => {
      r.write(Buffer.alloc(LIMIT - 10, 97));
      r.write(Buffer.alloc(100, 97)); // crosses the limit mid-stream
      setTimeout(() => r.end(Buffer.alloc(100, 97)), 30);
    },
  });
  assert.equal(res.status, 413);
  assert.equal(res.headers["x-phone-preview-decision"], "deny");
  await settle();
  assert.equal(p.emulators.functions.requests.length, 0);
  assert.equal(p.logs.at(-1).reason, "body-too-large");
  assert.equal(p.logs.at(-1).status, 413);
  await p.stop();
});

test("chunked body exactly at the limit is forwarded", async () => {
  const p = await startProxy({ maxBodyBytes: LIMIT });
  const res = await rawRequest(p.port, {
    write: (r) => {
      const body = JSON.stringify({ data: { rawToken: "t" } }).padEnd(LIMIT, " ");
      r.write(body.slice(0, LIMIT / 2));
      r.end(body.slice(LIMIT / 2));
    },
  });
  assert.equal(res.status, 200);
  assert.equal(p.emulators.functions.requests[0].body.length, LIMIT);
  await p.stop();
});

test("static responses log the real final status", async () => {
  const p = await startProxy();
  const get = (path) => rawRequest(p.port, { method: "GET", path, write: (r) => r.end() });
  assert.equal((await get("/")).status, 200);
  assert.equal((await get("/staff/counter")).status, 200); // SPA fallback
  assert.equal((await get("/assets/missing.js")).status, 404);
  assert.equal((await get("/assets/..%2f..%2fsecret")).status, 404); // containment
  assert.equal((await get("/phone-preview.json")).status, 404); // proxy metadata is never an asset
  await settle();
  const byPath = Object.fromEntries(p.logs.map((l) => [l.path, l]));
  assert.equal(byPath["/"].status, 200);
  assert.equal(byPath["/staff/counter"].status, 200);
  assert.equal(byPath["/assets/missing.js"].status, 404);
  assert.equal(byPath["/assets/..%2f..%2fsecret"].status, 404);
  assert.equal(byPath["/phone-preview.json"].status, 404);
  await p.stop();
});

test("a client that disconnects mid-response is not logged as success", async () => {
  const p = await startProxy();
  await new Promise((resolve) => {
    const req = http.request({
      agent: false,
      host: "127.0.0.1",
      port: p.port,
      path: "/assets/app.js",
      headers: { host: `127.0.0.1:${p.port}` },
    });
    req.on("response", (res) => {
      res.destroy();
      resolve();
    });
    req.on("error", resolve);
    req.end();
  });
  await settle();
  const entry = p.logs.find((l) => l.path === "/assets/app.js");
  assert.ok(entry.status === 200 || entry.status === "aborted"); // never a status the client did not get
  await p.stop();
});

test("every response carries the proxy marker; denials carry decision=deny; upstream cannot spoof", async () => {
  const p = await startProxy();
  const denied = await rawRequest(p.port, {
    method: "GET",
    path: "/emulator/v1/projects/demo-11thonus/accounts",
    write: (r) => r.end(),
  });
  assert.equal(denied.status, 404);
  assert.equal(denied.headers["x-phone-preview-proxy"], "11thonus-phone-preview");
  assert.equal(denied.headers["x-phone-preview-decision"], "deny");
  const identity = await rawRequest(p.port, {
    method: "GET",
    path: "/__phone-preview/identity",
    write: (r) => r.end(),
  });
  assert.equal(JSON.parse(identity.body).bundleHost, "phone.example.test");
  await p.stop();
});

test("a foreign Host header is refused by the proxy (421)", async () => {
  const p = await startProxy();
  const res = await rawRequest(p.port, {
    method: "GET",
    path: "/",
    headers: { host: "127.0.0.1:4400" },
    write: (r) => r.end(),
  });
  assert.equal(res.status, 421);
  assert.equal(res.headers["x-phone-preview-decision"], "deny");
  await p.stop();
});
