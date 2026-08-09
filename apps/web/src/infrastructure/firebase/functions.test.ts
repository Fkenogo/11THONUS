import { describe, expect, it } from "vitest";
import { getFirebaseApp } from "./app";
import { FUNCTIONS_REGION, getFirebaseFunctions } from "./functions";
import type { FirebaseClientConfig } from "../../config/env";

const testConfig: FirebaseClientConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("getFirebaseFunctions", () => {
  it("returns a Functions instance bound to the given app", () => {
    const app = getFirebaseApp(testConfig, `functions-app-${Math.random()}`);

    const functions = getFirebaseFunctions(app, false);

    expect(functions.app).toBe(app);
  });

  it("binds the client to the platform region (europe-west1, DEC-TECH-005)", () => {
    const app = getFirebaseApp(testConfig, `functions-region-${Math.random()}`);

    const functions = getFirebaseFunctions(app, false);

    // The callable must reach the region the AUTH-03 function is deployed in.
    expect(FUNCTIONS_REGION).toBe("europe-west1");
    expect(functions.region).toBe("europe-west1");
  });

  it("connects to the emulator when useEmulator is true", () => {
    const app = getFirebaseApp(testConfig, `functions-emulator-${Math.random()}`);

    const functions = getFirebaseFunctions(app, true);

    expect(functions).toBeDefined();
  });

  it("is idempotent — calling twice for the same app does not throw", () => {
    const app = getFirebaseApp(testConfig, `functions-idempotent-${Math.random()}`);

    expect(() => {
      getFirebaseFunctions(app, true);
      getFirebaseFunctions(app, true);
    }).not.toThrow();
  });
});
