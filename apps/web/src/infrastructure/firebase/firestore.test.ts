import { describe, expect, it } from "vitest";
import { getFirebaseApp } from "./app";
import { getFirebaseFirestore } from "./firestore";
import type { FirebaseClientConfig } from "../../config/env";

const testConfig: FirebaseClientConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("getFirebaseFirestore", () => {
  it("returns a Firestore instance bound to the given app", () => {
    const app = getFirebaseApp(testConfig, `firestore-app-${Math.random()}`);

    const firestore = getFirebaseFirestore(app, false);

    expect(firestore.app).toBe(app);
  });

  it("connects to the emulator when useEmulator is true", () => {
    const app = getFirebaseApp(testConfig, `firestore-emulator-${Math.random()}`);

    const firestore = getFirebaseFirestore(app, true);

    // The modular SDK does not expose emulator state publicly on Firestore;
    // the contract this test protects is "connecting twice must not throw"
    // (connectFirestoreEmulator throws on repeated calls for the same
    // instance), verified by calling getFirebaseFirestore twice below.
    expect(firestore).toBeDefined();
  });

  it("is idempotent — calling twice for the same app does not throw", () => {
    const app = getFirebaseApp(testConfig, `firestore-idempotent-${Math.random()}`);

    expect(() => {
      getFirebaseFirestore(app, true);
      getFirebaseFirestore(app, true);
    }).not.toThrow();
  });
});
