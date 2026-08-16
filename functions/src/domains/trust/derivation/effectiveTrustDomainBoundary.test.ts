import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as deriveEffectiveTrustModule from "./deriveEffectiveTrust";

const DERIVATION_DIR = path.resolve(__dirname, ".");

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

describe("ITM-C derivation boundary (task Phase O/W)", () => {
  it("contains no firebase-admin/firebase-functions import anywhere in derivation/ (no Firestore access in the pure derivation function)", () => {
    const files = listSourceFiles(DERIVATION_DIR);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["']firebase-admin/);
      expect(contents).not.toMatch(/from\s+["']firebase-functions/);
      expect(contents).not.toMatch(/require\(\s*["']firebase-admin/);
      expect(contents).not.toMatch(/require\(\s*["']firebase-functions/);
    }
  });

  it("contains no domains/identity import anywhere in derivation/ (identity reads are the orchestrator's job, ../services/)", () => {
    const files = listSourceFiles(DERIVATION_DIR);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/identity/);
    }
  });

  it("exports only the pure derivation function — no regression/mutation function, no operator surface", () => {
    expect(Object.keys(deriveEffectiveTrustModule).sort()).toEqual(["deriveEffectiveTrust"]);
  });
});
