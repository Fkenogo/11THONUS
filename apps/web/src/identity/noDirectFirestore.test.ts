import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const identityDir = path.dirname(fileURLToPath(import.meta.url));

function collectSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
      return [fullPath];
    }
    return [];
  });
}

describe("Identity Display Name UI — no direct Firestore access", () => {
  it("never imports firebase/firestore directly from any Identity UI module", () => {
    const offenders = collectSourceFiles(identityDir).filter((file) =>
      fs.readFileSync(file, "utf8").includes("firebase/firestore"),
    );
    expect(offenders).toEqual([]);
  });

  it("never reads or writes a `users` Firestore collection reference directly", () => {
    const offenders = collectSourceFiles(identityDir).filter((file) =>
      /collection\(\s*["'`]users["'`]/.test(fs.readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
