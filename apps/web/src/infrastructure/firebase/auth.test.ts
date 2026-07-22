import { describe, expect, it } from "vitest";
import { getFirebaseApp } from "./app";
import { getFirebaseAuth } from "./auth";
import type { FirebaseClientConfig } from "../../config/env";

const testConfig: FirebaseClientConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("getFirebaseAuth", () => {
  it("returns an Auth instance bound to the given app", () => {
    const app = getFirebaseApp(testConfig, `auth-app-${Math.random()}`);

    const auth = getFirebaseAuth(app, false);

    expect(auth.app).toBe(app);
  });

  it("connects to the emulator when useEmulator is true", () => {
    const app = getFirebaseApp(testConfig, `auth-emulator-${Math.random()}`);

    const auth = getFirebaseAuth(app, true);

    expect(auth.emulatorConfig).not.toBeNull();
    expect(auth.emulatorConfig?.host).toBe("127.0.0.1");
    expect(auth.emulatorConfig?.port).toBe(9099);
  });

  it("does not connect to the emulator when useEmulator is false", () => {
    const app = getFirebaseApp(testConfig, `auth-no-emulator-${Math.random()}`);

    const auth = getFirebaseAuth(app, false);

    expect(auth.emulatorConfig).toBeNull();
  });

  it("is idempotent — calling twice for the same app does not throw", () => {
    const app = getFirebaseApp(testConfig, `auth-idempotent-${Math.random()}`);

    expect(() => {
      getFirebaseAuth(app, true);
      getFirebaseAuth(app, true);
    }).not.toThrow();
  });
});
