import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const STANDARD_PARTICIPATION_FIXTURE_FILE = path.resolve(
  __dirname,
  "touchStandardParticipationFixtureCommand.ts",
);
const FUNCTIONS_SRC_DIR = path.resolve(__dirname, "../../../");
const INDEX_FILE = path.resolve(__dirname, "../../../index.ts");

function listSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "lib") continue;
      files.push(...listSourceFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("ITM-D standard-participation protection (task Phase E/K, ITM-DESIGN-001 §10)", () => {
  it("the non-gated fixture command has zero source-level dependency on the risk gate (checkRiskGateService or riskGate/)", () => {
    const contents = fs.readFileSync(STANDARD_PARTICIPATION_FIXTURE_FILE, "utf8");
    expect(contents).not.toMatch(/checkRiskGateService/);
    expect(contents).not.toMatch(/riskGate\//);
    expect(contents).not.toMatch(/evaluateRiskGate/);
  });

  it("checkRiskGateService is never imported by functions/src/index.ts (no global middleware / no automatic wrapping of commands)", () => {
    const indexContents = fs.readFileSync(INDEX_FILE, "utf8");
    expect(indexContents).not.toMatch(/checkRiskGateService/);
    expect(indexContents).not.toMatch(/riskGate\//);
  });

  it("checkRiskGateService is referenced only by ITM-D's own gated fixture command and this domain's own tests — no production consumer wired in yet", () => {
    const files = listSourceFiles(FUNCTIONS_SRC_DIR).filter(
      (file) =>
        !file.includes(`${path.sep}domains${path.sep}trust${path.sep}`) &&
        !file.endsWith(".test.ts"),
    );
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/checkRiskGateService/);
    }
  });

  it("no source file anywhere contains a global-gate pattern comparing effectiveTrustLevel/trustLevel directly against a caller-invented threshold outside riskGate/services", () => {
    // Structural guard against ITM-DESIGN-001 §10's explicitly disallowed
    // pattern ("if trustLevel < X -> reject everything"): the only files
    // permitted to reference `effectiveTrustLevel` are ITM-C's own
    // derivation/service layer and ITM-D's own riskGate/services layer.
    const files = listSourceFiles(FUNCTIONS_SRC_DIR).filter(
      (file) =>
        !file.endsWith(".test.ts") &&
        !file.includes(`${path.sep}domains${path.sep}trust${path.sep}`),
    );
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/effectiveTrustLevel/);
    }
  });
});
