import { describe, expect, it, vi } from "vitest";
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
      expect(sql.trim().toUpperCase()).not.toMatch(/^(INSERT|UPDATE|DELETE|DROP|ALTER)/);
    }
  });
});
