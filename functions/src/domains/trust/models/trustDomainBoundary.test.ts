import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as trustRecordModule from "./trustRecord";
import * as trustLevelModule from "./trustLevel";

const TRUST_DOMAIN_DIR = path.resolve(__dirname, "..");
const TRUST_MODELS_DIR = path.resolve(__dirname, ".");
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

  it("contains no firebase-admin/firebase-functions import anywhere in the trust domain's pure model layer", () => {
    // Scoped to `models/` (ITM-A's own layer), not the whole trust domain
    // recursively — CAP-P2-ITM-B adds a `repositories/`/`services/` layer
    // alongside `models/` that legitimately imports `firebase-admin/firestore`
    // (Firestore persistence, ITM-DESIGN-001 §12) — the same
    // pure-model-vs-Firestore-converter split the identity domain already
    // uses (`userDocument.ts` is the "only file permitted to import both").
    // This narrowing is additive: it does not relax any assertion this test
    // previously made about `models/` itself, and does not change any
    // ITM-A export shape or semantics (see the two `exports` assertions
    // above, unchanged).
    const files = listSourceFiles(TRUST_MODELS_DIR);
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
    // Scoped to `models/` for the same reason as the firebase-admin check
    // above: CAP-P2-ITM-B's service layer legitimately calls identity's
    // own read-only lookup contract (`identityLookupRepository.ts`,
    // `ENG-P2-001-09`) to confirm a Customer Identity exists before
    // *creating* a trust record (`ITM-DESIGN-001` §4's no-circularity
    // note — a function call, not a value-object/type-level coupling).
    // The pure `models/` layer itself still never imports `domains/identity`.
    const files = listSourceFiles(TRUST_MODELS_DIR);
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/identity/);
    }
  });

  it("confines any domains/identity import in the trust domain to the ITM-B service layer only (never models/ or repositories/)", () => {
    // The one-directional boundary (§4's no-circularity check): identity
    // is called for a read-only existence check on the trust-record
    // *creation* path only, from `services/trustSignalIngestionService.ts`
    // — never from `models/` (pure contracts) or `repositories/`
    // (Firestore persistence, which only ever handles an already-plain
    // `customerIdentityId` string).
    const files = listSourceFiles(TRUST_DOMAIN_DIR).filter(
      (file) => !file.startsWith(path.join(TRUST_DOMAIN_DIR, "services")),
    );
    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      expect(contents).not.toMatch(/from\s+["'].*domains\/identity/);
    }
  });
});
