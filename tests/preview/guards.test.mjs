// Founder Preview (EA-002) — unit tests for the production-safety guards. Pure functions, no
// service required:  pnpm test:preview-tooling
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_POSTGRES_URL, ports } from "./lib/config.mjs";
import {
  PreviewGuardError,
  assertLocalPostgres,
  assertLocalPreviewTarget,
  buildPreviewEnv,
  isLoopbackHost,
} from "./lib/guards.mjs";

const goodEnv = () => buildPreviewEnv({}, { postgresUrl: DEFAULT_POSTGRES_URL, ports });

test("the built preview environment passes every guard", () => {
  assert.doesNotThrow(() =>
    assertLocalPreviewTarget(goodEnv(), { postgresUrl: DEFAULT_POSTGRES_URL }),
  );
});

test("buildPreviewEnv forces the permitted values and strips dangerous inherited ones", () => {
  const env = buildPreviewEnv(
    {
      PLATFORM_ENV: "production",
      GCLOUD_PROJECT: "eleventh-on-us-dev",
      PURCHASE_ADMISSION_GATE_MODE: "enforce",
      HELD_PURCHASE_PROCESSOR_MODE: "drain",
      GOOGLE_APPLICATION_CREDENTIALS: "/secret.json",
      FIREBASE_TOKEN: "token",
      FIRESTORE_EMULATOR_HOST: "firestore.example.com:8080",
    },
    { postgresUrl: DEFAULT_POSTGRES_URL, ports },
  );
  assert.equal(env.PLATFORM_ENV, "local");
  assert.equal(env.GCLOUD_PROJECT, "demo-11thonus");
  assert.equal(env.FIRESTORE_EMULATOR_HOST, `127.0.0.1:${ports.firestore}`);
  assert.equal(env.PURCHASE_ADMISSION_GATE_MODE, undefined);
  assert.equal(env.HELD_PURCHASE_PROCESSOR_MODE, undefined);
  assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, undefined);
  assert.equal(env.FIREBASE_TOKEN, undefined);
  assert.match(env.NO_PROXY, /127\.0\.0\.1/);
});

for (const [label, mutate] of [
  ["PLATFORM_ENV is not local", (e) => ({ ...e, PLATFORM_ENV: "production" })],
  ["PLATFORM_ENV is missing", (e) => ({ ...e, PLATFORM_ENV: undefined })],
  ["the project is not demo-11thonus", (e) => ({ ...e, GCLOUD_PROJECT: "eleventh-on-us-dev" })],
  ["the project is empty", (e) => ({ ...e, GCLOUD_PROJECT: "" })],
  ["the Firestore emulator host is not set", (e) => ({ ...e, FIRESTORE_EMULATOR_HOST: undefined })],
  [
    "the Firestore emulator host is remote",
    (e) => ({ ...e, FIRESTORE_EMULATOR_HOST: "10.0.0.5:8080" }),
  ],
  [
    "the Auth emulator host is remote",
    (e) => ({ ...e, FIREBASE_AUTH_EMULATOR_HOST: "auth.example.com:9099" }),
  ],
  ["the admission gate is enforcing", (e) => ({ ...e, PURCHASE_ADMISSION_GATE_MODE: "enforce" })],
  [
    "the admission gate is in shadow mode",
    (e) => ({ ...e, PURCHASE_ADMISSION_GATE_MODE: "shadow" }),
  ],
  [
    "Google credentials are present",
    (e) => ({ ...e, GOOGLE_APPLICATION_CREDENTIALS: "/key.json" }),
  ],
  ["a Firebase token is present", (e) => ({ ...e, FIREBASE_TOKEN: "x" })],
]) {
  test(`refuses when ${label}`, () => {
    assert.throws(
      () => assertLocalPreviewTarget(mutate(goodEnv()), { postgresUrl: DEFAULT_POSTGRES_URL }),
      PreviewGuardError,
    );
  });
}

test("the admission gate explicitly set to off is accepted", () => {
  assert.doesNotThrow(() =>
    assertLocalPreviewTarget(
      { ...goodEnv(), PURCHASE_ADMISSION_GATE_MODE: "off" },
      { postgresUrl: DEFAULT_POSTGRES_URL },
    ),
  );
});

for (const [label, url] of [
  ["a remote host", "postgres://u:p@db.example.com:5432/eleventhonus_platform_local"],
  ["a Cloud SQL style private IP", "postgres://u:p@10.20.30.40:5432/eleventhonus_platform_local"],
  [
    "the integration-test database",
    "postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test",
  ],
  ["some other database", "postgres://postgres:postgres@localhost:54329/postgres"],
  [
    "a production-looking database",
    "postgres://postgres:postgres@localhost:5432/eleventhonus_platform",
  ],
  ["a non-postgres URL", "http://localhost:54329/eleventhonus_platform_local"],
  ["garbage", "not a url"],
  ["an empty string", ""],
]) {
  test(`refuses PostgreSQL target: ${label}`, () => {
    assert.throws(() => assertLocalPostgres(url), PreviewGuardError);
  });
}

test("accepts the loopback preview database on any local port", () => {
  assert.doesNotThrow(() =>
    assertLocalPostgres("postgres://postgres:postgres@127.0.0.1:5432/eleventhonus_platform_local"),
  );
  assert.doesNotThrow(() => assertLocalPostgres(DEFAULT_POSTGRES_URL));
});

test("loopback detection", () => {
  for (const host of ["127.0.0.1", "localhost", "LOCALHOST", "::1"])
    assert.equal(isLoopbackHost(host), true);
  for (const host of ["0.0.0.0", "example.com", "127.0.0.1.evil.com", "", undefined]) {
    assert.equal(isLoopbackHost(host), false);
  }
});
