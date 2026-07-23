import { deleteApp, getApps } from "firebase-admin/app";
import { afterEach, describe, expect, it } from "vitest";
import { getAdminApp } from "./admin";

// getAdminApp reuses any existing Admin app in the process-wide registry, so
// each test deletes whatever it created — every test then starts from a
// guaranteed-empty registry, independent of test order.
afterEach(async () => {
  await Promise.all(getApps().map((app) => deleteApp(app)));
});

describe("getAdminApp", () => {
  it("initializes exactly one Admin app instance", () => {
    getAdminApp();

    expect(getApps()).toHaveLength(1);
  });

  it("returns the same app instance on repeated calls", () => {
    const first = getAdminApp();
    const second = getAdminApp();

    expect(second).toBe(first);
  });
});
