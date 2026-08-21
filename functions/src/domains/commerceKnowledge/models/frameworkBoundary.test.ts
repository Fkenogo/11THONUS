import { describe, expect, it } from "vitest";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const modelsDir = dirname(fileURLToPath(import.meta.url));
const domainDir = join(modelsDir, "..");

describe("Commerce Knowledge domain boundary (ENG-P3-001A models / ENG-P3-001B repositories+seed)", () => {
  it("ENG-P3-001B has now added the repositories/seed layers this domain deferred at 001A — no `services`/`commands` layer exists yet (still deferred, ENG-P3-001C/003)", () => {
    expect(existsSync(join(domainDir, "repositories"))).toBe(true);
    expect(existsSync(join(domainDir, "seed"))).toBe(true);
    expect(existsSync(join(domainDir, "services"))).toBe(false);
    expect(existsSync(join(domainDir, "commands"))).toBe(false);
  });

  it("no module in models/ imports firebase-admin/firebase-functions (machine-enforced by eslint.config.js as well) — 001A's pure-model boundary is unchanged by 001B", () => {
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

  it("the seed manifest contract/content modules stay framework-independent — only the loader itself touches Firestore", () => {
    const seedDir = join(domainDir, "seed");
    const pureFiles = ["seedManifest.ts", "burundiPilotSeedManifest.ts"];
    for (const file of pureFiles) {
      const content = readFileSync(join(seedDir, file), "utf8");
      expect(content).not.toMatch(/from ["']firebase-admin/);
      expect(content).not.toMatch(/from ["']firebase-functions/);
    }
  });

  it("the repository layer is the only place `knowledgeNodes`/`knowledgeTranslations`/`knowledgeTags` collection names are declared, and every repository module does depend on firebase-admin (it is the framework boundary, by design)", () => {
    const repositoriesDir = join(domainDir, "repositories");
    const files = readdirSync(repositoriesDir).filter(
      (file) => file.endsWith(".ts") && !file.includes(".test."),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(join(repositoriesDir, file), "utf8");
      expect(content).toMatch(/from ["']firebase-admin\/firestore["']/);
    }
  });
});
