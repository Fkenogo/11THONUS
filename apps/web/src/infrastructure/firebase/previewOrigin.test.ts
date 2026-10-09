import { describe, expect, it } from "vitest";
import { getFirebaseApp } from "./app";
import { getFirebaseAuth } from "./auth";
import { getFirebaseFunctions } from "./functions";
import { parsePreviewOrigin, resolvePreviewOrigin } from "./previewOrigin";
import type { FirebaseClientConfig } from "../../config/env";

const testConfig: FirebaseClientConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
const ORIGIN = "https://preview.example.test";

describe("parsePreviewOrigin", () => {
  it("is undefined when unset", () => {
    expect(parsePreviewOrigin(undefined)).toBeUndefined();
    expect(parsePreviewOrigin("")).toBeUndefined();
  });

  it("accepts a bare https origin and normalises it", () => {
    expect(parsePreviewOrigin("https://preview.example.test/")).toBe(ORIGIN);
  });

  it.each([
    "http://preview.example.test",
    "https://preview.example.test/path",
    "https://preview.example.test/?a=1",
    "https://user:pw@preview.example.test",
    "not a url",
  ])("rejects %s", (value) => {
    expect(() => parsePreviewOrigin(value)).toThrow(/VITE_FIREBASE_PREVIEW_ORIGIN/);
  });
});

describe("resolvePreviewOrigin", () => {
  it("fails closed outside emulator mode", () => {
    expect(() => resolvePreviewOrigin(false, ORIGIN)).toThrow(/emulator mode/);
    expect(resolvePreviewOrigin(false, undefined)).toBeUndefined();
    expect(resolvePreviewOrigin(true, ORIGIN)).toBe(ORIGIN);
  });
});

describe("preview transport", () => {
  it("points Auth at the https preview origin", () => {
    const app = getFirebaseApp(testConfig, `preview-auth-${Math.random()}`);
    const auth = getFirebaseAuth(app, true, ORIGIN);
    expect(auth.emulatorConfig).toMatchObject({
      protocol: "https",
      host: "preview.example.test",
      port: null,
    });
  });

  it("keeps the localhost Auth emulator when the override is unset", () => {
    const app = getFirebaseApp(testConfig, `preview-auth-off-${Math.random()}`);
    const auth = getFirebaseAuth(app, true, undefined);
    expect(auth.emulatorConfig).toMatchObject({
      protocol: "http",
      host: "127.0.0.1",
      port: 28101,
    });
  });

  it("routes callables to <origin>/__fn/<name> via the SDK custom-domain overload", () => {
    const app = getFirebaseApp(testConfig, `preview-fn-${Math.random()}`);
    const functions = getFirebaseFunctions(app, true, ORIGIN) as unknown as {
      _url(name: string): string;
      emulatorOrigin: string | null;
    };
    expect(functions._url("recordPurchase")).toBe(`${ORIGIN}/__fn/recordPurchase`);
    expect(functions.emulatorOrigin).toBeNull();
  });

  it("keeps the localhost Functions emulator when the override is unset", () => {
    const app = getFirebaseApp(testConfig, `preview-fn-off-${Math.random()}`);
    const functions = getFirebaseFunctions(app, true, undefined) as unknown as {
      _url(name: string): string;
    };
    expect(functions._url("recordPurchase")).toBe(
      "http://127.0.0.1:28102/test-project/europe-west1/recordPurchase",
    );
  });

  it("never applies to a non-emulator (production) Functions client", () => {
    const app = getFirebaseApp(testConfig, `preview-fn-prod-${Math.random()}`);
    expect(() => getFirebaseFunctions(app, false, ORIGIN)).toThrow(/emulator mode/);
  });
});
