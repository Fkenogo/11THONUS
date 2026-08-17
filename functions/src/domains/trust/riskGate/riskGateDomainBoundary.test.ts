import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as evaluateRiskGateModule from "./evaluateRiskGate";

const RISK_GATE_DIR = path.resolve(__dirname, ".");

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

describe("ITM-D risk-gate boundary (task Phase K/P/Q/W)", () => {
  it("contains no firebase-admin/firebase-functions import anywhere in riskGate/ (no Firestore access in the pure evaluator)", () => {
    const files = listSourceFiles(RISK_GATE_DIR);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["']firebase-admin/);
      expect(contents).not.toMatch(/from\s+["']firebase-functions/);
      expect(contents).not.toMatch(/require\(\s*["']firebase-admin/);
      expect(contents).not.toMatch(/require\(\s*["']firebase-functions/);
    }
  });

  it("contains no domains/identity import anywhere in riskGate/ (identity reads are ITM-C's/the orchestrator's job)", () => {
    const files = listSourceFiles(RISK_GATE_DIR);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/identity/);
    }
  });

  it("contains no domains/permissions import anywhere in riskGate/ (ENG-P2-004 role/permission authorization is a separate authority, task Phase P)", () => {
    const files = listSourceFiles(RISK_GATE_DIR);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/permissions/);
    }
  });

  it("contains no domains/authentication import anywhere in riskGate/ (ITM-D never verifies tokens, sessions, or credentials, task Phase Q)", () => {
    const files = listSourceFiles(RISK_GATE_DIR);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/authentication/);
    }
  });

  it("exports only the pure evaluator function — no persistence, no caller-supplied threshold API, no operator surface", () => {
    expect(Object.keys(evaluateRiskGateModule).sort()).toEqual(["evaluateRiskGate"]);
  });
});
