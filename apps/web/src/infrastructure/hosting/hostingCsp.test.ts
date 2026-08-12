/// <reference types="node" />
/**
 * Hosting Content-Security-Policy regression coverage
 * (AUTH-PREVIEW-READINESS-001, P-2).
 *
 * The authentication orchestration reaches the AUTH-03 `authenticate` callable
 * over `httpsCallable(getFunctions(app, "europe-west1"), …)`, which resolves to
 * `https://europe-west1-eleventh-on-us-dev.cloudfunctions.net`. That origin must
 * be present in the Hosting CSP `connect-src` for authentication to work from a
 * Firebase Hosting preview, while the policy stays otherwise restrictive (no
 * wildcard, reCAPTCHA/Google origins preserved).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** Walk up from the test's cwd to locate the repo-root firebase.json. */
function findFirebaseJson(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = resolve(dir, "firebase.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("firebase.json not found walking up from " + process.cwd());
}

const FUNCTIONS_ORIGIN = "https://europe-west1-eleventh-on-us-dev.cloudfunctions.net";
// Firebase Auth's popup/redirect resolver loads a hidden iframe at
// `https://<authDomain>/__/auth/iframe`, governed by `frame-src`; without it the
// mandatory Google sign-in preview is blocked.
const AUTH_DOMAIN_ORIGIN = "https://eleventh-on-us-dev.firebaseapp.com";
const RECAPTCHA_ORIGINS = [
  "https://www.google.com",
  "https://www.gstatic.com",
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
];

interface CspHeader {
  key: string;
  value: string;
}
interface HeaderRule {
  source: string;
  headers: CspHeader[];
}

const firebaseConfig = JSON.parse(readFileSync(findFirebaseJson(), "utf8")) as {
  hosting: { headers: HeaderRule[] };
};

/** Every `Content-Security-Policy` header value declared under Hosting. */
function cspValues(): { source: string; value: string }[] {
  return firebaseConfig.hosting.headers.flatMap((rule) =>
    rule.headers
      .filter((h) => h.key === "Content-Security-Policy")
      .map((h) => ({ source: rule.source, value: h.value })),
  );
}

function directive(value: string, name: string): string {
  const match = value
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(name + " ") || d === name);
  return match ?? "";
}

function connectSrc(value: string): string {
  return directive(value, "connect-src");
}

describe("Hosting CSP — authentication callable origin (P-2)", () => {
  it("declares a CSP for every document route serving the SPA", () => {
    const csps = cspValues();
    expect(csps.length).toBeGreaterThanOrEqual(2);
  });

  it("permits the europe-west1 callable Functions origin in connect-src on every document route", () => {
    for (const { value } of cspValues()) {
      expect(connectSrc(value)).toContain(FUNCTIONS_ORIGIN);
    }
  });

  it("permits the Firebase Auth iframe origin in frame-src on every document route (Google popup)", () => {
    for (const { value } of cspValues()) {
      const frameSrc = directive(value, "frame-src");
      expect(frameSrc).toContain(AUTH_DOMAIN_ORIGIN);
      // reCAPTCHA/Google popup frame must remain permitted.
      expect(frameSrc).toContain("https://www.google.com");
    }
  });

  it("keeps the reCAPTCHA/Google and Identity Toolkit origins already present", () => {
    for (const { value } of cspValues()) {
      for (const origin of RECAPTCHA_ORIGINS) {
        expect(value).toContain(origin);
      }
    }
  });

  it("does not weaken connect-src with a bare wildcard", () => {
    for (const { value } of cspValues()) {
      const cs = connectSrc(value);
      expect(cs).not.toContain("*");
    }
  });

  it("preserves the restrictive object-src 'none' and default-src 'self'", () => {
    for (const { value } of cspValues()) {
      expect(value).toContain("default-src 'self'");
      expect(value).toContain("object-src 'none'");
    }
  });
});
