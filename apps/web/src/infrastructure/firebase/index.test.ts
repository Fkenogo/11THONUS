import { describe, expect, it } from "vitest";
import { initializeFirebasePlatform } from "./index";
import type { AppEnv } from "../../config/env";

const testEnv: AppEnv = {
  firebase: {
    apiKey: "test-api-key",
    authDomain: "test.firebaseapp.com",
    projectId: "test-project",
    storageBucket: "test-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
  },
  useEmulator: true,
};

describe("initializeFirebasePlatform", () => {
  it("wires app, auth, firestore, and storage to the same underlying app", () => {
    const platform = initializeFirebasePlatform(testEnv, `platform-${Math.random()}`);

    expect(platform.auth.app).toBe(platform.app);
    expect(platform.firestore.app).toBe(platform.app);
    expect(platform.storage.app).toBe(platform.app);
  });

  it("leaves appCheck undefined when no site key is configured", () => {
    const platform = initializeFirebasePlatform(testEnv, `platform-no-appcheck-${Math.random()}`);

    expect(platform.appCheck).toBeUndefined();
  });

  it("initializes appCheck when a site key is configured", () => {
    const platform = initializeFirebasePlatform(
      { ...testEnv, appCheckSiteKey: "test-site-key" },
      `platform-appcheck-${Math.random()}`,
    );

    expect(platform.appCheck).toBeDefined();
  });
});
