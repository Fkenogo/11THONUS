import { describe, expect, it } from "vitest";
import { getFirebaseApp } from "./app";
import { getFirebaseStorage } from "./storage";
import type { FirebaseClientConfig } from "../../config/env";

const testConfig: FirebaseClientConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("getFirebaseStorage", () => {
  it("returns a Storage instance bound to the given app", () => {
    const app = getFirebaseApp(testConfig, `storage-app-${Math.random()}`);

    const storage = getFirebaseStorage(app, false);

    expect(storage.app).toBe(app);
  });

  it("is idempotent — calling twice with the emulator enabled does not throw", () => {
    const app = getFirebaseApp(testConfig, `storage-idempotent-${Math.random()}`);

    expect(() => {
      getFirebaseStorage(app, true);
      getFirebaseStorage(app, true);
    }).not.toThrow();
  });
});
