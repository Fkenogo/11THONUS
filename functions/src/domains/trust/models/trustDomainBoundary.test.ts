import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as trustRecordModule from "./trustRecord";
import * as trustLevelModule from "./trustLevel";

const TRUST_DOMAIN_DIR = path.resolve(__dirname, "..");
const IDENTITY_DOMAIN_DIR = path.resolve(__dirname, "../../identity");

function listSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("ITM-A domain boundary (Phase P/Phase T)", () => {
  it("has no regression/downward-transition contract exported from the trust-record module", () => {
    // ITM-A intentionally exports only a construction-time factory
    // (`createTrustRecord`) — no mutation/transition function that could
    // move a trust record's `trustLevel` or `status` downward exists
    // (AD-ITM-3: monotonic non-decreasing; no suspension trigger at MVP).
    const exportedNames = Object.keys(trustRecordModule);
    expect(exportedNames).toEqual(["createTrustRecord"]);
  });

  it("has no derivation/progression function exported from the trust-level module", () => {
    // ITM-C's responsibility (§15), not ITM-A's — this module only
    // validates the closed set and its ordering.
    const exportedNames = Object.keys(trustLevelModule).sort();
    expect(exportedNames).toEqual(
      [
        "TRUST_LEVELS",
        "compareTrustLevels",
        "createTrustLevel",
        "isAtLeastTrustLevel",
        "isTrustLevel",
        "trustLevelRank",
      ].sort(),
    );
  });

  it("contains no firebase-admin/firebase-functions import anywhere in the trust domain", () => {
    const files = listSourceFiles(TRUST_DOMAIN_DIR);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["']firebase-admin/);
      expect(contents).not.toMatch(/from\s+["']firebase-functions/);
      expect(contents).not.toMatch(/require\(\s*["']firebase-admin/);
      expect(contents).not.toMatch(/require\(\s*["']firebase-functions/);
    }
  });

  it("is not imported by the Customer Identity domain (one-directional boundary)", () => {
    // Customer Identity holds only an opaque `trustRecordId` pointer
    // (existing `trustReference.ts`) and must never import trust-domain
    // modules to read trust content (ITM-DESIGN-001 §3.4).
    const identityFiles = listSourceFiles(IDENTITY_DOMAIN_DIR);
    expect(identityFiles.length).toBeGreaterThan(0);

    for (const file of identityFiles) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/trust/);
    }
  });

  it("does not import the identity domain's value objects (customerIdentityId reference stays a plain string)", () => {
    const files = listSourceFiles(TRUST_DOMAIN_DIR);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/identity/);
    }
  });
});
