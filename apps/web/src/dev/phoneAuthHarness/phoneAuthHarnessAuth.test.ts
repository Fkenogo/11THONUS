import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FirebaseClientConfig } from "../../config/env";

const { mockApp, mockAuth, initializeApp, getApps, getApp, getAuth, connectAuthEmulator } =
  vi.hoisted(() => {
    const mockApp = { name: "phone-auth-harness" };
    const mockAuth = { name: "mock-auth" };
    return {
      mockApp,
      mockAuth,
      initializeApp: vi.fn(() => mockApp),
      getApps: vi.fn(() => [] as unknown[]),
      getApp: vi.fn(() => mockApp),
      getAuth: vi.fn(() => mockAuth),
      connectAuthEmulator: vi.fn(),
    };
  });

vi.mock("firebase/app", () => ({ initializeApp, getApps, getApp }));
vi.mock("firebase/auth", () => ({ getAuth, connectAuthEmulator }));

const REAL_CONFIG: FirebaseClientConfig = {
  apiKey: "real-api-key",
  authDomain: "eleventh-on-us-dev.firebaseapp.com",
  projectId: "eleventh-on-us-dev",
  storageBucket: "eleventh-on-us-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("getPhoneAuthHarnessAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApps.mockReturnValue([]);
  });

  it("initializes a distinctly-named secondary Firebase app, never the shared default app", async () => {
    const { getPhoneAuthHarnessAuth } = await import("./phoneAuthHarnessAuth");

    getPhoneAuthHarnessAuth(REAL_CONFIG);

    expect(initializeApp).toHaveBeenCalledWith(REAL_CONFIG, "phone-auth-harness");
  });

  it("reuses the existing harness app instead of re-initializing when already present", async () => {
    getApps.mockReturnValue([mockApp]);
    const { getPhoneAuthHarnessAuth } = await import("./phoneAuthHarnessAuth");

    getPhoneAuthHarnessAuth(REAL_CONFIG);

    expect(initializeApp).not.toHaveBeenCalled();
    expect(getApp).toHaveBeenCalledWith("phone-auth-harness");
  });

  it("returns an Auth instance obtained from the secondary app", async () => {
    const { getPhoneAuthHarnessAuth } = await import("./phoneAuthHarnessAuth");

    const auth = getPhoneAuthHarnessAuth(REAL_CONFIG);

    expect(getAuth).toHaveBeenCalledWith(mockApp);
    expect(auth).toBe(mockAuth);
  });

  it("never calls connectAuthEmulator — the harness must always hit the genuine SMS route", async () => {
    const { getPhoneAuthHarnessAuth } = await import("./phoneAuthHarnessAuth");

    getPhoneAuthHarnessAuth(REAL_CONFIG);

    expect(connectAuthEmulator).not.toHaveBeenCalled();
  });

  it("refuses to activate when given the emulator demo-project fallback config", async () => {
    const { getPhoneAuthHarnessAuth } = await import("./phoneAuthHarnessAuth");
    const demoConfig: FirebaseClientConfig = { ...REAL_CONFIG, projectId: "demo-11thonus" };

    expect(() => getPhoneAuthHarnessAuth(demoConfig)).toThrow(/real Firebase project/i);
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getAuth).not.toHaveBeenCalled();
  });
});
