import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const modelsDir = dirname(fileURLToPath(import.meta.url));
const domainDir = join(modelsDir, "..");

function tsFilesIn(dir: string): string[] {
  return readdirSync(dir).filter((file) => file.endsWith(".ts") && !file.includes(".test."));
}

describe("Platform Administration domain boundary (ENG-P3-003A)", () => {
  it("no module in models/ or evaluator/ imports firebase-admin/firebase-functions (machine-enforced by eslint.config.js as well)", () => {
    for (const dir of [join(domainDir, "models"), join(domainDir, "evaluator")]) {
      const files = tsFilesIn(dir);
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        const content = readFileSync(join(dir, file), "utf8");
        expect(content).not.toMatch(/from ["']firebase-admin/);
        expect(content).not.toMatch(/from ["']firebase-functions/);
      }
    }
  });

  it("no module in this domain imports the Business domain or the Business-role permission evaluator, and vice versa — the two authorization worlds stay structurally disjoint (ENG-P3-003-DESIGN-001 §6.4/§13.2)", () => {
    // Matches only actual import/require specifiers (`from "...domains/business..."`),
    // never prose in a comment that merely *mentions* the path — this domain's
    // own header comments deliberately document the boundary by name.
    const importsForbiddenDomain = /from\s+["'][^"']*domains\/(business|permissions)[^"']*["']/;
    const importsPlatformAdministration =
      /from\s+["'][^"']*domains\/platformAdministration[^"']*["']/;

    for (const dir of ["models", "evaluator", "repositories", "services"]) {
      const files = tsFilesIn(join(domainDir, dir));
      for (const file of files) {
        const content = readFileSync(join(domainDir, dir, file), "utf8");
        expect(content).not.toMatch(importsForbiddenDomain);
      }
    }

    const businessDir = join(domainDir, "..", "business");
    const permissionsDir = join(domainDir, "..", "permissions");
    for (const dir of [businessDir, permissionsDir]) {
      const subdirs = readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(dir, entry.name));
      for (const subdir of subdirs) {
        for (const file of tsFilesIn(subdir)) {
          const content = readFileSync(join(subdir, file), "utf8");
          expect(content).not.toMatch(importsPlatformAdministration);
        }
      }
    }
  });

  it("repositories/ is the only place `platformAdministrators`/audit collection names are declared, and every repository module does depend on firebase-admin (it is the framework boundary, by design)", () => {
    const repositoriesDir = join(domainDir, "repositories");
    const files = tsFilesIn(repositoriesDir).filter(
      (file) => file !== "platformAdministratorDocument.ts",
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(join(repositoriesDir, file), "utf8");
      expect(content).toMatch(/from ["']firebase-admin\/firestore["']/);
    }
  });
});
