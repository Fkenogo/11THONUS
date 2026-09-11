import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { checkPlatformFoundationReadiness } from "./platformFoundationReadiness";
import type { PlatformPostgresPool } from "./postgresPool";

function stubPool(overrides: Partial<PlatformPostgresPool> = {}): PlatformPostgresPool {
  return {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    ...overrides,
  } as unknown as PlatformPostgresPool;
}

const firestoreStub = {} as Firestore;

describe("checkPlatformFoundationReadiness", () => {
  it("reports ready when every check passes and no migrations are pending", async () => {
    const pool = stubPool();
    const result = await checkPlatformFoundationReadiness({
      postgresPool: pool,
      migrationsDir: "/nonexistent-empty-migrations-dir",
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => true,
      checkCommerceKnowledgeBaselineEstablished: async () => true,
    });

    expect(result.ready).toBe(true);
    expect(result.checks.map((c) => c.name)).toEqual([
      "postgres_connectivity",
      "migration_state",
      "platform_administrator_established",
      "commerce_knowledge_baseline_established",
    ]);
    expect(result.checks.every((c) => c.ready)).toBe(true);
  });

  it("reports not-ready with a reason when Postgres connectivity fails", async () => {
    const pool = stubPool({
      query: vi.fn().mockRejectedValue(new Error("connection refused")),
    });
    const result = await checkPlatformFoundationReadiness({
      postgresPool: pool,
      migrationsDir: "/nonexistent-empty-migrations-dir",
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => true,
      checkCommerceKnowledgeBaselineEstablished: async () => true,
    });

    expect(result.ready).toBe(false);
    const connectivity = result.checks.find((c) => c.name === "postgres_connectivity");
    expect(connectivity?.ready).toBe(false);
    expect(connectivity?.reason).toContain("connection refused");
  });

  it("reports not-ready when no Platform Administrator is established", async () => {
    const pool = stubPool();
    const result = await checkPlatformFoundationReadiness({
      postgresPool: pool,
      migrationsDir: "/nonexistent-empty-migrations-dir",
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => false,
      checkCommerceKnowledgeBaselineEstablished: async () => true,
    });

    expect(result.ready).toBe(false);
    expect(result.checks.find((c) => c.name === "platform_administrator_established")?.ready).toBe(
      false,
    );
  });

  it("reports not-ready when the Commerce Knowledge baseline is missing", async () => {
    const pool = stubPool();
    const result = await checkPlatformFoundationReadiness({
      postgresPool: pool,
      migrationsDir: "/nonexistent-empty-migrations-dir",
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => true,
      checkCommerceKnowledgeBaselineEstablished: async () => false,
    });

    expect(result.ready).toBe(false);
    expect(
      result.checks.find((c) => c.name === "commerce_knowledge_baseline_established")?.ready,
    ).toBe(false);
  });

  it("never throws even when an individual check throws unexpectedly", async () => {
    const pool = stubPool();
    const result = await checkPlatformFoundationReadiness({
      postgresPool: pool,
      migrationsDir: "/nonexistent-empty-migrations-dir",
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => {
        throw new Error("boom");
      },
      checkCommerceKnowledgeBaselineEstablished: async () => true,
    });

    expect(result.ready).toBe(false);
    const check = result.checks.find((c) => c.name === "platform_administrator_established");
    expect(check?.reason).toContain("boom");
  });

  it("never issues a write-shaped Postgres query (read-only contract)", async () => {
    const queries: string[] = [];
    const pool = stubPool({
      query: vi.fn().mockImplementation(async (sql: string) => {
        queries.push(sql);
        return { rows: [] };
      }),
    });
    await checkPlatformFoundationReadiness({
      postgresPool: pool,
      migrationsDir: "/nonexistent-empty-migrations-dir",
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => true,
      checkCommerceKnowledgeBaselineEstablished: async () => true,
    });

    for (const sql of queries) {
      expect(sql.trim().toUpperCase()).not.toMatch(/^(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)/);
    }
  });
});

describe("checkPlatformFoundationReadiness — read-only migration foundation", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "platform-baseline-001-readiness-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  function baseDeps(pool: PlatformPostgresPool) {
    return {
      postgresPool: pool,
      migrationsDir: dir,
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => true,
      checkCommerceKnowledgeBaselineEstablished: async () => true,
    };
  }

  it("reports not-ready and performs no CREATE on a fresh database with migrations present", async () => {
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");
    const queries: string[] = [];
    // The `to_regclass` probe returns an empty row set → schema_migrations absent.
    const pool = stubPool({
      query: vi.fn().mockImplementation(async (sql: string) => {
        queries.push(sql);
        return { rows: [] };
      }),
    });

    const result = await checkPlatformFoundationReadiness(baseDeps(pool));

    expect(result.ready).toBe(false);
    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/not established/);

    for (const sql of queries) {
      expect(sql.trim().toUpperCase()).not.toMatch(/^(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)/);
    }
    expect(queries.some((q) => /create table/i.test(q))).toBe(false);
  });

  it("reports not-ready when an applied migration's checksum does not match its file", async () => {
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");
    const pool = stubPool({
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (/to_regclass/.test(sql)) {
          // schema_migrations exists.
          return { rows: [{ t: "schema_migrations" }] };
        }
        if (/FROM schema_migrations/.test(sql)) {
          return {
            rows: [
              {
                version: "0001",
                name: "first",
                checksum: "0000000000000000000000000000000000000000000000000000000000000000",
                applied_at: new Date("2026-09-11T00:00:00.000Z"),
              },
            ],
          };
        }
        return { rows: [] };
      }),
    });

    const result = await checkPlatformFoundationReadiness(baseDeps(pool));

    expect(result.ready).toBe(false);
    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/checksum mismatch/);
  });

  it("reports not-ready when an applied migration's name does not match its file", async () => {
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");
    const pool = stubPool({
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (/to_regclass/.test(sql)) {
          return { rows: [{ t: "schema_migrations" }] };
        }
        if (/FROM schema_migrations/.test(sql)) {
          return {
            rows: [
              {
                version: "0001",
                name: "renamed",
                checksum: "0000000000000000000000000000000000000000000000000000000000000000",
                applied_at: new Date("2026-09-11T00:00:00.000Z"),
              },
            ],
          };
        }
        return { rows: [] };
      }),
    });

    const result = await checkPlatformFoundationReadiness(baseDeps(pool));

    expect(result.ready).toBe(false);
    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/does not match/);
  });
});
