import { describe, expect, it } from "vitest";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const modelsDir = dirname(fileURLToPath(import.meta.url));
const domainDir = join(modelsDir, "..");

describe("Commerce Knowledge domain boundary (ENG-P3-001A, Phase P/Q/R/S/22)", () => {
  it("has no repositories/services/commands subfolder yet — no persistence or command layer exists in 001A", () => {
    expect(existsSync(join(domainDir, "repositories"))).toBe(false);
    expect(existsSync(join(domainDir, "services"))).toBe(false);
    expect(existsSync(join(domainDir, "commands"))).toBe(false);
  });

  it("has no seed-data or seed-manifest file — seed dataset belongs to ENG-P3-001B", () => {
    const files = readdirSync(domainDir, { recursive: true }) as string[];
    const seedFiles = files.filter((file) => /seed/i.test(file) && !/\.test\.ts$/.test(file));
    expect(seedFiles).toEqual([]);
  });

  it("no module in this domain imports firebase-admin/firebase-functions (machine-enforced by eslint.config.js as well)", () => {
    const files = readdirSync(modelsDir).filter(
      (file) => file.endsWith(".ts") && file !== "frameworkBoundary.test.ts",
    );
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(join(modelsDir, file), "utf8");
      expect(content).not.toMatch(/from ["']firebase-admin/);
      expect(content).not.toMatch(/from ["']firebase-functions/);
    }
  });
});
