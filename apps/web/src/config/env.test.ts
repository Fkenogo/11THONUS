import { describe, expect, it, vi } from "vitest";
import { loadEnv } from "./env";

const validSource = {
  VITE_FIREBASE_API_KEY: "test-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "test-project",
  VITE_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  VITE_FIREBASE_APP_ID: "1:123456789:web:abcdef",
};

describe("loadEnv", () => {
  it("loads a complete, valid Firebase client configuration", () => {
    const env = loadEnv(validSource);

    expect(env.firebase).toEqual({
      apiKey: "test-api-key",
      authDomain: "test.firebaseapp.com",
      projectId: "test-project",
      storageBucket: "test-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef",
      measurementId: undefined,
    });
  });

  it("includes an optional measurementId when present", () => {
    const env = loadEnv({ ...validSource, VITE_FIREBASE_MEASUREMENT_ID: "G-TEST123" });

    expect(env.firebase.measurementId).toBe("G-TEST123");
  });

  it("throws a clear error naming every missing required variable", () => {
    expect(() => loadEnv({})).toThrowError(
      /VITE_FIREBASE_API_KEY.*VITE_FIREBASE_AUTH_DOMAIN.*VITE_FIREBASE_PROJECT_ID.*VITE_FIREBASE_STORAGE_BUCKET.*VITE_FIREBASE_MESSAGING_SENDER_ID.*VITE_FIREBASE_APP_ID/s,
    );
  });

  it("defaults useEmulator to the Vite DEV flag when not explicitly set", () => {
    expect(loadEnv(validSource, { DEV: true }).useEmulator).toBe(true);
    expect(loadEnv(validSource, { DEV: false }).useEmulator).toBe(false);
  });

  it("honours an explicit VITE_USE_FIREBASE_EMULATOR override over the DEV flag", () => {
    expect(
      loadEnv({ ...validSource, VITE_USE_FIREBASE_EMULATOR: "false" }, { DEV: true }).useEmulator,
    ).toBe(false);
    expect(
      loadEnv({ ...validSource, VITE_USE_FIREBASE_EMULATOR: "true" }, { DEV: false }).useEmulator,
    ).toBe(true);
  });

  it("passes through optional App Check configuration", () => {
    const env = loadEnv({
      ...validSource,
      VITE_APP_CHECK_SITE_KEY: "site-key-123",
      VITE_APP_CHECK_DEBUG_TOKEN: "debug-token-123",
    });

    expect(env.appCheckSiteKey).toBe("site-key-123");
    expect(env.appCheckDebugToken).toBe("debug-token-123");
  });

  it("leaves App Check configuration undefined when not provided", () => {
    const env = loadEnv(validSource);

    expect(env.appCheckSiteKey).toBeUndefined();
    expect(env.appCheckDebugToken).toBeUndefined();
  });

  it("throws on an invalid VITE_USE_FIREBASE_EMULATOR value instead of silently defaulting", () => {
    expect(() => loadEnv({ ...validSource, VITE_USE_FIREBASE_EMULATOR: "yes" })).toThrowError(
      /VITE_USE_FIREBASE_EMULATOR/,
    );
  });

  it("falls back to safe demo Firebase config and forces emulator mode in DEV when required variables are missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const env = loadEnv({}, { DEV: true });

    expect(env.firebase.projectId).toBe("demo-11thonus");
    expect(env.useEmulator).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/missing.*demo/is));

    warnSpy.mockRestore();
  });

  it("still throws on missing required variables outside DEV, even though DEV has a fallback", () => {
    expect(() => loadEnv({}, { DEV: false })).toThrowError(
      /Missing required environment variables/,
    );
  });
});
