import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv, FirebaseClientConfig } from "../../config/env";

const { mockApp, mockAuth, mockFunctions, getFirebaseApp, getFirebaseAuth, getFirebaseFunctions } =
  vi.hoisted(() => {
    const mockApp = { name: "[DEFAULT]" };
    const mockAuth = { name: "mock-auth" };
    const mockFunctions = { name: "mock-functions" };
    return {
      mockApp,
      mockAuth,
      mockFunctions,
      getFirebaseApp: vi.fn(() => mockApp),
      getFirebaseAuth: vi.fn(() => mockAuth),
      getFirebaseFunctions: vi.fn(() => mockFunctions),
    };
  });

// The preview must REUSE the shared Firebase composition modules — never
// re-implement Firebase initialization — so we mock exactly those shared
// modules and assert the accessor delegates to them.
vi.mock("../../infrastructure/firebase/app", () => ({ getFirebaseApp }));
vi.mock("../../infrastructure/firebase/auth", () => ({ getFirebaseAuth }));
vi.mock("../../infrastructure/firebase/functions", () => ({ getFirebaseFunctions }));

const REAL_CONFIG: FirebaseClientConfig = {
  apiKey: "real-api-key",
  authDomain: "eleventh-on-us-dev.firebaseapp.com",
  projectId: "eleventh-on-us-dev",
  storageBucket: "eleventh-on-us-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

function envFor(config: FirebaseClientConfig, useEmulator = false): AppEnv {
  return { firebase: config, useEmulator };
}

describe("getSignInPreviewPlatform", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses the shared Firebase app/auth/functions composition modules", async () => {
    const { getSignInPreviewPlatform } = await import("./signInPreviewPlatform");

    getSignInPreviewPlatform(envFor(REAL_CONFIG, false));

    expect(getFirebaseApp).toHaveBeenCalledWith(REAL_CONFIG);
    expect(getFirebaseAuth).toHaveBeenCalledWith(mockApp, false);
    expect(getFirebaseFunctions).toHaveBeenCalledWith(mockApp, false);
  });

  it("returns the auth and functions instances from the shared modules", async () => {
    const { getSignInPreviewPlatform } = await import("./signInPreviewPlatform");

    const platform = getSignInPreviewPlatform(envFor(REAL_CONFIG, false));

    expect(platform.auth).toBe(mockAuth);
    expect(platform.functions).toBe(mockFunctions);
  });

  it("propagates the emulator flag to auth and functions", async () => {
    const { getSignInPreviewPlatform } = await import("./signInPreviewPlatform");

    getSignInPreviewPlatform(envFor({ ...REAL_CONFIG, projectId: "demo-11thonus" }, true));

    expect(getFirebaseAuth).toHaveBeenCalledWith(mockApp, true);
    expect(getFirebaseFunctions).toHaveBeenCalledWith(mockApp, true);
  });

  it("activates for the approved real development project", async () => {
    const { getSignInPreviewPlatform } = await import("./signInPreviewPlatform");

    expect(() => getSignInPreviewPlatform(envFor(REAL_CONFIG, false))).not.toThrow();
  });

  it("activates for the emulator demo project (local dev/emulator preview)", async () => {
    const { getSignInPreviewPlatform } = await import("./signInPreviewPlatform");

    expect(() =>
      getSignInPreviewPlatform(envFor({ ...REAL_CONFIG, projectId: "demo-11thonus" }, true)),
    ).not.toThrow();
  });

  describe("approved-project allowlist (defense-in-depth)", () => {
    it.each([
      ["the staging project", "eleventh-on-us-staging"],
      ["a hypothetical production project", "eleventh-on-us-prod"],
      ["an unrelated/unknown project", "some-other-project"],
      ["a missing project ID", ""],
    ])("fails closed for %s (%j)", async (_label, projectId) => {
      const { getSignInPreviewPlatform } = await import("./signInPreviewPlatform");

      expect(() => getSignInPreviewPlatform(envFor({ ...REAL_CONFIG, projectId }, false))).toThrow(
        /approved/i,
      );
      expect(getFirebaseApp).not.toHaveBeenCalled();
      expect(getFirebaseAuth).not.toHaveBeenCalled();
      expect(getFirebaseFunctions).not.toHaveBeenCalled();
    });

    it("does not leak the API key or app ID in the refusal message", async () => {
      const { getSignInPreviewPlatform } = await import("./signInPreviewPlatform");

      let thrown: Error | undefined;
      try {
        getSignInPreviewPlatform(
          envFor({ ...REAL_CONFIG, projectId: "eleventh-on-us-prod" }, false),
        );
      } catch (error) {
        thrown = error as Error;
      }

      expect(thrown).toBeDefined();
      expect(thrown!.message).not.toContain(REAL_CONFIG.apiKey);
      expect(thrown!.message).not.toContain(REAL_CONFIG.appId);
    });
  });
});
