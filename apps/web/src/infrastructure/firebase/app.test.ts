import { describe, expect, it } from "vitest";
import type { FirebaseClientConfig } from "../../config/env";
import { getFirebaseApp } from "./app";

const testConfig: FirebaseClientConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

// Firebase keeps a module-level app registry per name; each test uses a
// unique randomized name so no cleanup between tests is needed.
describe("getFirebaseApp", () => {
  it("initializes a Firebase app with the given configuration", () => {
    const app = getFirebaseApp(testConfig, `app-init-${Math.random()}`);

    expect(app.options.projectId).toBe("test-project");
    expect(app.options.apiKey).toBe("test-api-key");
  });

  it("returns the same app instance on repeated calls with the same name", () => {
    const name = `app-singleton-${Math.random()}`;

    const first = getFirebaseApp(testConfig, name);
    const second = getFirebaseApp(testConfig, name);

    expect(second).toBe(first);
  });
});
