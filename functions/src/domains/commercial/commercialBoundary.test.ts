/**
 * WP-COM-01 architectural boundary tests.
 *
 * Prove -- by static inspection of the shipped sources and migration -- that
 * the Commercial foundation is NOT integrated into the loyalty
 * admission/verification path and stays inside its own tables
 * (design §4.2/§4.3/§4.4 R8/R9; brief §6/§10).
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const commercialDir = dirname(fileURLToPath(import.meta.url));
const domainsDir = join(commercialDir, "..");
const srcDir = join(domainsDir, "..");
const migrationsDir = join(srcDir, "infrastructure", "postgres", "migrations");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const isTs = (f: string) => f.endsWith(".ts");
const isTest = (f: string) => /\.test\.ts$/.test(f);

const commercialSources = walk(commercialDir).filter((f) => isTs(f) && !isTest(f));
const nonCommercialSources = walk(srcDir).filter(
  (f) => isTs(f) && !f.startsWith(commercialDir + "/") && !f.includes("/__fixtures__/"),
);
const migration0023 = readFileSync(
  join(migrationsDir, "0023_commercial_manual_administration.sql"),
  "utf8",
);
const migration0024 = readFileSync(
  join(migrationsDir, "0024_commercial_settlement_cancellation.sql"),
  "utf8",
);
const migration0022 = readFileSync(join(migrationsDir, "0022_commercial_settlements.sql"), "utf8");
const migration0021 = readFileSync(
  join(migrationsDir, "0021_commercial_domain_foundation.sql"),
  "utf8",
);

// Assembled from parts so this file never contains the literal tokens it forbids elsewhere.
const PENDING = ["pending", "admission"].join("_");

const LOYALTY_TABLES = [
  "verified_units",
  "verified_unit_allocations",
  "verified_unit_allocation_events",
  "loyalty_cycles",
  "loyalty_cycle_streams",
  "rewards",
  "redemptions",
  "purchase_records",
  "purchase_record_events",
  "purchase_outbox",
  "trust_events",
  "notification_intents",
  "reward_programs",
  "reward_program_versions",
  "qualifying_items",
];

function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  for (const m of source.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) specs.push(m[1]);
  return specs;
}

describe("Commercial foundation is a separate, non-integrated domain (WP-COM-01)", () => {
  it("has Commercial sources to inspect", () => {
    expect(commercialSources.length).toBeGreaterThan(6);
  });

  it("no Commercial source imports Purchase, Loyalty, Reward Program, Business, or Permission domains (only the idempotency primitive and the administrator record reader)", () => {
    const allowedCrossDomain = [
      "domains/rewardProgram/repositories/idempotencyRepository",
      "domains/platformAdministration/repositories/platformAdministratorDocument",
      "domains/platformAdministration/repositories/platformAdministratorRepository",
    ];
    for (const file of commercialSources) {
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        if (!spec.startsWith(".")) continue;
        const resolved = join(dirname(file), spec);
        const fromSrc = relative(srcDir, resolved).split("\\").join("/");
        if (!fromSrc.startsWith("domains/") || fromSrc.startsWith("domains/commercial/")) continue;
        expect(
          allowedCrossDomain.some((allowed) => fromSrc === allowed),
          `${relative(srcDir, file)} imports ${fromSrc}`,
        ).toBe(true);
      }
    }
  });

  it("no Commercial source references any Loyalty/Purchase table, and every write targets a commercial_* table", () => {
    for (const file of commercialSources) {
      const source = readFileSync(file, "utf8");
      for (const table of LOYALTY_TABLES) {
        expect(
          new RegExp(`\\b${table}\\b`).test(source),
          `${relative(srcDir, file)} mentions loyalty table ${table}`,
        ).toBe(false);
      }
      for (const m of source.matchAll(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-z_]+)/g)) {
        expect(m[2], `${relative(srcDir, file)}: ${m[0]}`).toMatch(/^commercial_/);
      }
    }
  });

  it("no code outside domains/commercial imports Commercial (loyalty commands, verifyPurchase, confirmRedemption, index.ts are all unwired)", () => {
    for (const file of nonCommercialSources) {
      for (const spec of importSpecifiers(readFileSync(file, "utf8"))) {
        expect(spec, `${relative(srcDir, file)} imports ${spec}`).not.toMatch(
          /(^|\/)commercial(\/|$)/,
        );
      }
    }
  });

  it("verifyPurchase and confirmRedemption carry no Commercial coupling", () => {
    for (const rel of [
      "domains/purchase/services/verifyPurchaseCommand.ts",
      "domains/purchase/services/confirmRedemptionCommand.ts",
    ]) {
      const source = readFileSync(join(srcDir, rel), "utf8");
      // Prose may say "commercial" (e.g. "authoritative commercial Trust Events");
      // what must be absent is any coupling: an import path or a Commercial identifier.
      expect(source, rel).not.toMatch(
        /domains\/commercial|\/commercial\/|Commercial(Account|Ledger|Price|Audit|Admission)|postCommercial|runCommercialCommand/,
      );
      expect(source, rel).not.toContain(PENDING);
    }
  });

  it("no pending-admission lifecycle, capacity gate, consumption projection or earmark exists anywhere in source or migrations", () => {
    const everything = [...commercialSources, ...nonCommercialSources]
      .filter((f) => f !== join(commercialDir, "commercialBoundary.test.ts"))
      .map((f) => readFileSync(f, "utf8"));
    // Migration comments in 0021 legitimately NAME what is deferred; only executable SQL is scanned.
    const migrationFiles = readdirSync(migrationsDir).map((n) =>
      readFileSync(join(migrationsDir, n), "utf8").replace(/--.*$/gm, ""),
    );
    for (const text of [...everything, ...migrationFiles]) {
      expect(text).not.toContain(PENDING);
      expect(text).not.toMatch(
        /commercial_(admissions|admission_blocks|consumption_claims|consumption_events|projection_failures)/,
      );
      expect(text).not.toMatch(/INV-CAP-PROV.*earmark_id/s);
    }
    for (const file of commercialSources) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(srcDir, file)).not.toMatch(
        /evaluateAdmission|admitPurchase|CommercialAdmissionPort|projectConsumption/,
      );
    }
  });

  it("the Commercial repositories expose no update/delete path for ledger, audit, price or standing rows", () => {
    for (const file of commercialSources) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(srcDir, file)).not.toMatch(
        /(UPDATE|DELETE\s+FROM|TRUNCATE)\s+commercial_(ledger_entries|audit_events|price_schedules|standing_events)/,
      );
    }
  });

  it("migration 0021 is purely additive and self-contained", () => {
    const sql = migration0021.replace(/--.*$/gm, "");
    // No FK to any non-commercial table.
    for (const m of sql.matchAll(/REFERENCES\s+([a-z_]+)/g)) {
      expect(m[1]).toMatch(/^commercial_/);
    }
    // Touches no existing object: no ALTER, no DROP outside its own down file, no data seeding.
    expect(sql).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(sql).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(sql).not.toMatch(/\bDROP\b/i);
    for (const table of LOYALTY_TABLES) {
      expect(new RegExp(`\\b${table}\\b`).test(sql), `0021 mentions ${table}`).toBe(false);
    }
    // Creates exactly the five foundation tables.
    const created = [...sql.matchAll(/CREATE\s+TABLE\s+([a-z_]+)/gi)].map((m) => m[1]).sort();
    expect(created).toEqual([
      "commercial_accounts",
      "commercial_audit_events",
      "commercial_ledger_entries",
      "commercial_price_schedules",
      "commercial_standing_events",
    ]);
  });

  it("migration 0021 encodes no subscription tier, trial cap/default, price value or negative-credit limit", () => {
    const sql = migration0021.replace(/--.*$/gm, "");
    expect(sql).not.toMatch(/tier|subscription|\bplan\b/i);
    expect(sql).not.toMatch(/BETWEEN\s+3\s+AND\s+5/i);
    expect(sql).not.toMatch(/trial_(remaining_units|after|grant)[a-z_]*\s*(<=|<)\s*[0-9]/i);
    expect(sql).not.toMatch(/paid_(balance|after)[a-z_]*\s*>=?\s*-?[0-9]/i);
    expect(sql).not.toMatch(/(trial|paid)_[a-z_]*\s+INTEGER\s+NOT NULL\s+DEFAULT\s+[^0\s]/i);
  });
});

describe("WP-COM-02 settlement & pricing boundary", () => {
  const sql0022 = migration0022.replace(/--.*$/gm, "");
  const sourceOf = (rel: string) => readFileSync(join(commercialDir, rel), "utf8");
  const fileNamed = (name: string) => commercialSources.filter((f) => f.endsWith(`/${name}`));

  it("migration 0022 is additive, self-contained and creates exactly one table", () => {
    for (const m of sql0022.matchAll(/REFERENCES\s+([a-z_]+)/g)) {
      expect(m[1]).toMatch(/^commercial_/);
    }
    expect(sql0022).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(sql0022).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(sql0022).not.toMatch(/\bDROP\b/i);
    for (const table of LOYALTY_TABLES) {
      expect(new RegExp(`\\b${table}\\b`).test(sql0022), `0022 mentions ${table}`).toBe(false);
    }
    expect([...sql0022.matchAll(/CREATE\s+TABLE\s+([a-z_]+)/gi)].map((m) => m[1])).toEqual([
      "commercial_settlements",
    ]);
  });

  it("migration 0022 seeds no price, adds no provider/tier/later-WP concept and no FX", () => {
    expect(sql0022).not.toMatch(/tier|subscription|\bplan\b|fx_rate|exchange_rate|provider/i);
    expect(sql0022).not.toMatch(/pending_admission|earmark|admission|consumption/i);
    expect(sql0022).not.toMatch(/local_unit_price_minor\s*=\s*[0-9]/i);
  });

  it("no Commercial source writes account counters outside the canonical ledger posting flow", () => {
    for (const file of commercialSources) {
      const rel = relative(commercialDir, file);
      const src = readFileSync(file, "utf8");
      if (/UPDATE\s+commercial_accounts/.test(src)) {
        expect(rel).toBe("repositories/commercialAccountRepository.ts");
      }
      const body = src.replace(/^import[\s\S]*?;$/gm, "");
      if (/updateAccountCounters\(/.test(body)) {
        expect([
          "services/postCommercialLedgerEntry.ts",
          "repositories/commercialAccountRepository.ts",
        ]).toContain(rel);
      }
    }
  });

  it("commercial_settlements is UPDATEd only by the recorded->confirmed transition, never deleted or truncated", () => {
    for (const file of commercialSources) {
      const rel = relative(commercialDir, file);
      const src = readFileSync(file, "utf8");
      expect(src, rel).not.toMatch(/(DELETE\s+FROM|TRUNCATE)\s+commercial_settlements/);
      if (/UPDATE\s+commercial_settlements/.test(src)) {
        expect(rel).toBe("repositories/commercialSettlementRepository.ts");
      }
    }
    expect(sourceOf("repositories/commercialSettlementRepository.ts")).toMatch(
      /SET status = 'confirmed'[\s\S]*WHERE id = \$1 AND status = 'recorded'/,
    );
  });

  it("the settlement and price commands reuse the WP-COM-01 authority, idempotency and ledger seams", () => {
    const runner = sourceOf("services/commercialAdministratorCommand.ts");
    expect(runner).toContain("authorizeCommercialAdministrator");
    expect(runner).toContain("runCommercialCommand");
    for (const name of ["recordSettlement.ts", "confirmSettlement.ts", "setPriceSchedule.ts"]) {
      const [file] = fileNamed(name);
      expect(file, name).toBeDefined();
      expect(readFileSync(file, "utf8"), name).toContain("runAdministratorCommand");
    }
    expect(sourceOf("services/confirmSettlement.ts")).toContain("postCommercialLedgerEntry");
    expect(sourceOf("services/recordSettlement.ts")).not.toMatch(/postCommercialLedgerEntry/);
  });

  it("introduces no Business-side authority, RBAC, live FX, provider integration or default price", () => {
    for (const file of commercialSources) {
      const rel = relative(commercialDir, file);
      // Executable code only: doc comments legitimately NAME what is excluded.
      const src = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(src, rel).not.toMatch(
        /businessRole|membership|isOwner|isManager|hasPermission|fetch\(|axios|exchangeRate|fxRate|stripe|flutterwave|mtn|lumicash/i,
      );
    }
  });
});

describe("WP-COM-03 manual administration boundary", () => {
  const sql0023 = migration0023.replace(/--.*$/gm, "");
  const codeOf = (file: string) =>
    readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it("migration 0023 is additive and self-contained: two new tables, ALTER only on commercial_settlements, no seed", () => {
    for (const m of sql0023.matchAll(/REFERENCES\s+([a-z_]+)/g)) {
      expect(m[1]).toMatch(/^commercial_/);
    }
    for (const table of LOYALTY_TABLES) {
      expect(new RegExp(`\\b${table}\\b`).test(sql0023), `0023 mentions ${table}`).toBe(false);
    }
    expect([...sql0023.matchAll(/CREATE\s+TABLE\s+([a-z_]+)/gi)].map((m) => m[1])).toEqual([
      "commercial_trial_grants",
      "commercial_manual_adjustments",
    ]);
    for (const m of sql0023.matchAll(/ALTER\s+TABLE\s+([a-z_]+)/gi)) {
      expect(m[1]).toBe("commercial_settlements");
    }
    expect(sql0023).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(sql0023).not.toMatch(/\bDROP\s+TABLE\b/i);
  });

  it("migration 0023 encodes the 3..5 range on a single grant only: no lifetime cap, no default, no ceiling, no tier, no complimentary code", () => {
    expect(sql0023).toMatch(/units INTEGER NOT NULL CHECK \(units BETWEEN 3 AND 5\)/);
    expect(sql0023).not.toMatch(/UNIQUE\s*\(\s*business_id\s*\)/i);
    expect(sql0023).not.toMatch(/units\s+INTEGER\s+NOT NULL\s+DEFAULT/i);
    expect(sql0023).not.toMatch(
      /tier|subscription|\bplan\b|complimentary|pilot|partner|promotional/i,
    );
    expect(sql0023).not.toMatch(/units_delta\s*(<=|>=|<|>)\s*-?[0-9]/);
    expect(sql0023).not.toMatch(/pending_admission|earmark|admission|consumption|scheduler/i);
  });

  it("all WP-COM-03 commands run through the shared administrator runner (authority + idempotency + audit) and the canonical ledger flow", () => {
    for (const name of [
      "openCommercialAccount.ts",
      "grantTrial.ts",
      "adjustTrial.ts",
      "adjustCommercialCredit.ts",
      "activatePaidService.ts",
      "commercialRestriction.ts",
      "voidSettlement.ts",
    ]) {
      const [file] = commercialSources.filter((f) => f.endsWith(`/${name}`));
      expect(file, name).toBeDefined();
      expect(codeOf(file), name).toContain("runAdministratorCommand");
    }
    for (const name of [
      "grantTrial.ts",
      "adjustTrial.ts",
      "adjustCommercialCredit.ts",
      "voidSettlement.ts",
    ]) {
      const [file] = commercialSources.filter((f) => f.endsWith(`/${name}`));
      expect(codeOf(file), name).toContain("postCommercialLedgerEntry");
    }
    for (const name of [
      "openCommercialAccount.ts",
      "activatePaidService.ts",
      "commercialRestriction.ts",
    ]) {
      const [file] = commercialSources.filter((f) => f.endsWith(`/${name}`));
      expect(codeOf(file), name).not.toContain("postCommercialLedgerEntry");
    }
  });

  it("only the account-opening command inserts accounts, and settlements/ledger are only compensated, never edited or deleted", () => {
    for (const file of commercialSources) {
      const rel = relative(commercialDir, file);
      const src = codeOf(file);
      if (/INSERT\s+INTO\s+commercial_accounts/.test(src)) {
        expect(rel).toBe("repositories/commercialAccountRepository.ts");
      }
      expect(src, rel).not.toMatch(/(UPDATE|DELETE\s+FROM|TRUNCATE)\s+commercial_ledger_entries/);
      expect(src, rel).not.toMatch(
        /(DELETE\s+FROM|TRUNCATE)\s+commercial_(settlements|trial_grants|manual_adjustments)/,
      );
    }
    const open = commercialSources.find((f) => f.endsWith("/openCommercialAccount.ts")) ?? "";
    expect(codeOf(open)).toContain("insertCommercialAccount");
  });

  it("no unimplemented later-package concept is introduced: no gate, admission, consumption, provider, scheduler or UI", () => {
    for (const file of commercialSources) {
      const rel = relative(commercialDir, file);
      const src = codeOf(file);
      expect(src, rel).not.toMatch(
        /evaluateAdmission|admitPurchase|projectConsumption|reevaluatePendingAdmissions|availableCapacity\(.*\)\s*[<>]|stripe|flutterwave/i,
      );
    }
  });
});

describe("WP-COM-03A settlement cancellation boundary", () => {
  const sql0024 = migration0024.replace(/--.*$/gm, "");
  const codeOf = (file: string) =>
    readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it("migration 0024 is additive: no new table, ALTER only on commercial_settlements, no seed, no drop, Commercial-only references", () => {
    expect([...sql0024.matchAll(/CREATE\s+TABLE\s+([a-z_]+)/gi)]).toEqual([]);
    for (const m of sql0024.matchAll(/ALTER\s+TABLE\s+([a-z_]+)/gi)) {
      expect(m[1]).toBe("commercial_settlements");
    }
    for (const m of sql0024.matchAll(/REFERENCES\s+([a-z_]+)/g)) {
      expect(m[1]).toMatch(/^commercial_/);
    }
    for (const table of LOYALTY_TABLES) {
      expect(new RegExp(`\\b${table}\\b`).test(sql0024), `0024 mentions ${table}`).toBe(false);
    }
    expect(sql0024).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(sql0024).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(sql0024).not.toMatch(/\b(UPDATE|DELETE\s+FROM|TRUNCATE)\s+commercial_(?!settlements)/i);
  });

  it("the only object attached to another Commercial table is one read-only BEFORE INSERT trigger on the ledger", () => {
    const triggers = [...sql0024.matchAll(/CREATE\s+TRIGGER\s+\w+\s+([\s\S]*?);/gi)].map(
      (m) => m[1],
    );
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toMatch(/BEFORE INSERT ON commercial_ledger_entries/);
    // It reads (locks) the settlement row; it never writes to the ledger or the account.
    expect(sql0024).not.toMatch(/ALTER\s+TABLE\s+commercial_ledger_entries/i);
  });

  it("migration 0024 introduces no later-package schema and no rule change", () => {
    expect(sql0024).not.toMatch(
      new RegExp(`${PENDING}|earmark|admission|consumption|scheduler`, "i"),
    );
    expect(sql0024).not.toMatch(/stripe|flutterwave|refund|provider/i);
    expect(sql0024).not.toMatch(/tier|subscription|complimentary|pilot|partner|promotional/i);
    // The lifecycle CHECK admits exactly the four statuses; the transition guard the three edges.
    expect(sql0024).toMatch(/status IN \('recorded', 'confirmed', 'voided', 'cancelled'\)/);
    expect(sql0024).toMatch(
      /OLD\.status = 'recorded' AND NEW\.status IN \('confirmed', 'cancelled'\)/,
    );
    expect(sql0024).toMatch(/OLD\.status = 'confirmed' AND NEW\.status = 'voided'/);
  });

  it("cancelSettlement runs through the shared administrator runner and has NO ledger, account or price effect", () => {
    const file = commercialSources.find((f) => f.endsWith("/services/cancelSettlement.ts")) ?? "";
    expect(file).not.toBe("");
    const src = codeOf(file);
    expect(src).toContain("runAdministratorCommand");
    expect(src).toContain("appendCommercialAuditEvent");
    expect(src).toContain("markSettlementCancelled");
    expect(src).not.toMatch(/postCommercialLedgerEntry|commercialLedgerRepository|insertLedger/);
    expect(src).not.toMatch(/commercialPriceRepository|setPriceSchedule|adjustCommercialCredit/);
    expect(src).not.toMatch(
      /UPDATE\s+commercial_accounts|INSERT\s+INTO\s+commercial_ledger_entries/i,
    );
  });

  it("the repository cancels only via the guarded recorded -> cancelled UPDATE and never deletes", () => {
    const file =
      commercialSources.find((f) =>
        f.endsWith("/repositories/commercialSettlementRepository.ts"),
      ) ?? "";
    const src = codeOf(file);
    expect(src).toMatch(/SET status = 'cancelled'[\s\S]*?WHERE id = \$1 AND status = 'recorded'/);
    expect(src).not.toMatch(/DELETE\s+FROM|TRUNCATE/i);
  });

  it("cancelSettlement is not reachable from any non-Commercial code (no callable, route or UI is wired)", () => {
    for (const file of nonCommercialSources) {
      expect(codeOf(file), relative(srcDir, file)).not.toMatch(/cancelSettlement/);
    }
  });
});
