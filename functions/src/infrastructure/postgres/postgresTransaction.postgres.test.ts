/**
 * Real PostgreSQL transaction-semantics tests (PLATFORM-BASELINE-001).
 *
 * Requires a live PostgreSQL instance reachable via `PLATFORM_POSTGRES_URL`
 * (see `docker-compose.postgres.yml` at the repo root). These tests
 * deliberately do NOT mock PostgreSQL — they prove actual commit/rollback
 * behaviour against a real server, per the task's explicit instruction not
 * to mock away transaction semantics.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./postgresConfig";
import { createPostgresPool, closePostgresPool, type PlatformPostgresPool } from "./postgresPool";
import { withPlatformTransaction } from "./postgresTransaction";

let pool: PlatformPostgresPool;

beforeAll(async () => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error(
      "This test requires a live PostgreSQL instance. Set PLATFORM_ENV=test (and optionally " +
        "PLATFORM_POSTGRES_URL) and run `docker compose -f docker-compose.postgres.yml up -d` first.",
    );
  }
  pool = createPostgresPool(loadPostgresConfig());
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_baseline_001_transaction_smoke_test (
      id SERIAL PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
});

beforeEach(async () => {
  await pool.query("TRUNCATE platform_baseline_001_transaction_smoke_test");
});

afterAll(async () => {
  await pool.query("DROP TABLE IF EXISTS platform_baseline_001_transaction_smoke_test");
  await closePostgresPool(pool);
});

describe("withPlatformTransaction", () => {
  it("commits a successful transaction", async () => {
    await withPlatformTransaction(pool, async (tx) => {
      await tx.query(
        "INSERT INTO platform_baseline_001_transaction_smoke_test (value) VALUES ($1)",
        ["committed-row"],
      );
    });

    const result = await pool.query(
      "SELECT value FROM platform_baseline_001_transaction_smoke_test",
    );
    expect(result.rows).toEqual([{ value: "committed-row" }]);
  });

  it("rolls back on a thrown error, leaving no partial write", async () => {
    await expect(
      withPlatformTransaction(pool, async (tx) => {
        await tx.query(
          "INSERT INTO platform_baseline_001_transaction_smoke_test (value) VALUES ($1)",
          ["should-not-survive"],
        );
        throw new Error("deliberate failure to force rollback");
      }),
    ).rejects.toThrow("deliberate failure to force rollback");

    const result = await pool.query(
      "SELECT value FROM platform_baseline_001_transaction_smoke_test",
    );
    expect(result.rows).toEqual([]);
  });

  it("leaves no partial write when a later statement in the same transaction fails", async () => {
    await expect(
      withPlatformTransaction(pool, async (tx) => {
        await tx.query(
          "INSERT INTO platform_baseline_001_transaction_smoke_test (value) VALUES ($1)",
          ["first-statement-succeeds"],
        );
        // A NOT NULL violation on the second statement — the whole transaction must roll back.
        await tx.query(
          "INSERT INTO platform_baseline_001_transaction_smoke_test (value) VALUES ($1)",
          [null],
        );
      }),
    ).rejects.toThrow();

    const result = await pool.query(
      "SELECT value FROM platform_baseline_001_transaction_smoke_test",
    );
    expect(result.rows).toEqual([]);
  });

  it("releases the client back to the pool after commit", async () => {
    const before = pool.idleCount;
    await withPlatformTransaction(pool, async (tx) => {
      await tx.query("SELECT 1");
    });
    expect(pool.idleCount).toBeGreaterThanOrEqual(before);
    expect(pool.waitingCount).toBe(0);
  });

  it("releases the client back to the pool after rollback", async () => {
    await withPlatformTransaction(pool, async (tx) => {
      await tx.query("SELECT 1");
      throw new Error("force rollback");
    }).catch(() => {});

    // A leaked client would eventually exhaust the pool; a single follow-up
    // transaction succeeding proves the previous client was returned.
    await withPlatformTransaction(pool, async (tx) => {
      await tx.query("SELECT 1");
    });
    expect(pool.waitingCount).toBe(0);
  });

  it("isolates concurrent transactions from each other until each commits", async () => {
    const barrier = (() => {
      let release: () => void = () => {};
      const promise = new Promise<void>((resolve) => {
        release = resolve;
      });
      return { promise, release };
    })();

    const txA = withPlatformTransaction(pool, async (tx) => {
      await tx.query(
        "INSERT INTO platform_baseline_001_transaction_smoke_test (value) VALUES ($1)",
        ["from-a"],
      );
      await barrier.promise; // hold the transaction open until B has had a chance to read
    });

    const txB = (async () => {
      // Give A a moment to insert-but-not-commit.
      await new Promise((resolve) => setTimeout(resolve, 50));
      const duringA = await pool.query(
        "SELECT value FROM platform_baseline_001_transaction_smoke_test",
      );
      // A's uncommitted row must not be visible to B (read-committed isolation).
      expect(duringA.rows).toEqual([]);
      barrier.release();
    })();

    await Promise.all([txA, txB]);

    const after = await pool.query(
      "SELECT value FROM platform_baseline_001_transaction_smoke_test",
    );
    expect(after.rows).toEqual([{ value: "from-a" }]);
  });
});
