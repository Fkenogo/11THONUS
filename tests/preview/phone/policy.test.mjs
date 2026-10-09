import assert from "node:assert/strict";
import test from "node:test";
import { CALLABLE_ALLOWLIST } from "./config.mjs";
import { classify } from "./policy.mjs";

const json = { "content-type": "application/json" };
const req = (method, pathname, extra = {}) => ({
  method,
  pathname,
  search: "",
  headers: json,
  ...extra,
});

test("every allow-listed callable maps to the emulator callable route", () => {
  for (const name of CALLABLE_ALLOWLIST) {
    assert.deepEqual(classify(req("POST", `/__fn/${name}`)), {
      kind: "functions",
      path: `/demo-11thonus/europe-west1/${name}`,
    });
  }
});

test("non-allow-listed callables, wrong methods and content types are denied", () => {
  assert.equal(classify(req("POST", "/__fn/createBusiness")).kind, "deny");
  assert.equal(classify(req("POST", "/__fn/discoverPlatformAdministrator")).kind, "deny");
  assert.equal(classify(req("GET", "/__fn/recordPurchase")).kind, "deny");
  assert.equal(classify(req("POST", "/__fn/recordPurchase", { headers: {} })).kind, "deny");
  assert.equal(classify(req("POST", "/__fn/recordPurchase/extra")).kind, "deny");
  assert.equal(
    classify(req("POST", "/__fn/../emulator/v1/projects/demo-11thonus/accounts")).kind,
    "deny",
  );
});

test("browser-client Auth routes pass; admin and emulator routes are denied", () => {
  const ok = (p) => classify(req("POST", p, { search: "?key=k" }));
  assert.equal(ok("/identitytoolkit.googleapis.com/v1/accounts:signUp").kind, "auth");
  assert.equal(ok("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword").kind, "auth");
  assert.equal(ok("/identitytoolkit.googleapis.com/v1/accounts:lookup").kind, "auth");
  assert.equal(ok("/securetoken.googleapis.com/v1/token").kind, "auth");
  for (const p of [
    "/emulator/v1/projects/demo-11thonus/accounts",
    "/emulator/v1/projects/demo-11thonus/oobCodes",
    "/emulator/v1/projects/demo-11thonus/verificationCodes",
    "/emulator/v1/projects/demo-11thonus/config",
    "/identitytoolkit.googleapis.com/v1/projects/demo-11thonus/accounts:batchGet",
    "/identitytoolkit.googleapis.com/v1/projects/demo-11thonus/accounts:delete",
    "/identitytoolkit.googleapis.com/v1/accounts:delete",
    "/identitytoolkit.googleapis.com/v1/accounts:sendOobCode",
    "/identitytoolkit.googleapis.com/v2/passwordPolicy",
  ]) {
    assert.equal(classify(req("POST", p)).kind, "deny", p);
    assert.equal(classify(req("GET", p)).kind, "deny", p);
  }
});

test("owner/admin authorization and extra query parameters on Auth routes are denied", () => {
  const p = "/identitytoolkit.googleapis.com/v1/accounts:signUp";
  assert.equal(
    classify(req("POST", p, { headers: { ...json, authorization: "Bearer owner" } })).kind,
    "deny",
  );
  assert.equal(classify(req("POST", p, { search: "?key=k&x=1" })).kind, "deny");
  assert.equal(classify(req("GET", p)).kind, "deny");
});

test("encoded traversal is denied and static serving is read-only", () => {
  assert.equal(classify(req("GET", "/%2e%2e/etc/passwd")).kind, "deny");
  assert.equal(classify(req("GET", "/assets/%2f%2e%2e")).kind, "deny");
  assert.equal(classify(req("POST", "/")).kind, "deny");
  assert.equal(classify(req("GET", "/")).kind, "static");
  assert.equal(classify(req("GET", "/staff/counter")).kind, "static");
});

test("the identity route is GET-only", () => {
  assert.equal(classify(req("GET", "/__phone-preview/identity")).kind, "identity");
  assert.equal(classify(req("POST", "/__phone-preview/identity")).kind, "deny");
  assert.equal(classify(req("DELETE", "/__phone-preview/identity")).kind, "deny");
});
