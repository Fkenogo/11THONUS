import { describe, expect, it, vi } from "vitest";
import { getFirebaseApp } from "./app";
import { initializeFirebaseAppCheck } from "./appCheck";
import type { FirebaseClientConfig } from "../../config/env";

const testConfig: FirebaseClientConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("initializeFirebaseAppCheck", () => {
  it("warns and returns undefined when no site key is configured in development", () => {
    const app = getFirebaseApp(testConfig, `appcheck-dev-no-key-${Math.random()}`);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = initializeFirebaseAppCheck(app, { siteKey: undefined, isDev: true });

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/App Check.*site key/i));

    warnSpy.mockRestore();
  });

  it("throws a clear error when no site key is configured outside development", () => {
    const app = getFirebaseApp(testConfig, `appcheck-prod-no-key-${Math.random()}`);

    expect(() =>
      initializeFirebaseAppCheck(app, { siteKey: undefined, isDev: false }),
    ).toThrowError(/App Check site key is required/i);
  });

  it("initializes App Check when a site key is provided in development", () => {
    const app = getFirebaseApp(testConfig, `appcheck-dev-with-key-${Math.random()}`);

    const result = initializeFirebaseAppCheck(app, { siteKey: "test-site-key", isDev: true });

    expect(result).toBeDefined();
    expect(result?.app).toBe(app);
  });

  it("initializes App Check when a site key is provided outside development", () => {
    const app = getFirebaseApp(testConfig, `appcheck-prod-with-key-${Math.random()}`);

    const result = initializeFirebaseAppCheck(app, { siteKey: "test-site-key", isDev: false });

    expect(result).toBeDefined();
    expect(result?.app).toBe(app);
  });

  it("sets the debug token global in dev mode when a debug token is provided", () => {
    const app = getFirebaseApp(testConfig, `appcheck-debug-${Math.random()}`);

    initializeFirebaseAppCheck(app, {
      siteKey: "test-site-key",
      debugToken: "test-debug-token",
      isDev: true,
    });

    expect(
      (globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown })
        .FIREBASE_APPCHECK_DEBUG_TOKEN,
    ).toBe("test-debug-token");
  });

  it("does not set the debug token global outside dev mode", () => {
    const app = getFirebaseApp(testConfig, `appcheck-no-debug-prod-${Math.random()}`);
    const globalWithToken = globalThis as typeof globalThis & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown;
    };
    delete globalWithToken.FIREBASE_APPCHECK_DEBUG_TOKEN;

    initializeFirebaseAppCheck(app, {
      siteKey: "test-site-key",
      debugToken: "test-debug-token",
      isDev: false,
    });

    expect(globalWithToken.FIREBASE_APPCHECK_DEBUG_TOKEN).toBeUndefined();
  });
});
