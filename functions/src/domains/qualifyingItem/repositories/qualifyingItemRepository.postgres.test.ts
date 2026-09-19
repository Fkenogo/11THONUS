/**
 * Qualifying Item PostgreSQL repository integration tests
 * (`PLATFORM-BASELINE-013A.2`).
 *
 * Requires only a live PostgreSQL instance (no Firebase emulator -- the
 * repository never touches Firestore). Run via:
 *
 *   PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *     pnpm test:postgres qualifyingItemRepository
 *
 * Proves Business ownership is STRUCTURAL: every read and write is scoped
 * by `business_id` in the SQL itself, so a Business can never observe or
 * mutate another Business's item by supplying its id.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadPostgresConfig } from "../../../infrastructure/postgres/postgresConfig";
import {
  closePostgresPool,
  createPostgresPool,
  type PlatformPostgresPool,
} from "../../../infrastructure/postgres/postgresPool";
import {
  discoverMigrationFiles,
  migrateDown,
  migrateUp,
} from "../../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import * as repository from "./qualifyingItemRepository";
import {
  getQualifyingItem,
  insertQualifyingItem,
  listQualifyingItems,
  retireQualifyingItem,
  updateQualifyingItem,
} from "./qualifyingItemRepository";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "infrastructure",
  "postgres",
  "migrations",
);

let pool: PlatformPostgresPool;

const BIZ_A = "biz_a";
const BIZ_B = "biz_b";
const ACTOR_A = "user_owner_a";
const ACTOR_A2 = "user_manager_a";
const ACTOR_B = "user_owner_b";
const FABRICATED_UUID = "00000000-0000-4000-8000-000000000000";

beforeAll(async () => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error(
      "This test requires a live PostgreSQL instance (PLATFORM_ENV=test / PLATFORM_POSTGRES_URL).",
    );
  }
  pool = createPostgresPool(loadPostgresConfig());
  await migrateUp(pool, migrationsDir);
}, 60_000);

afterAll(async () => {
  // Leave the shared database as this suite found it (no schema), so this
  // file can never be the "previous file" that breaks
  // `platformFoundationReadiness.postgres.test.ts`'s fresh-database
  // assumption (that suite only cleans up AFTER each test).
  const files = await discoverMigrationFiles(migrationsDir);
  await migrateDown(pool, migrationsDir, files.length);
  await pool.query("DROP TABLE IF EXISTS schema_migrations");
  await closePostgresPool(pool);
});

afterEach(async () => {
  await pool.query("DELETE FROM qualifying_items");
});

async function create(params: Partial<Parameters<typeof insertQualifyingItem>[1]> = {}) {
  return withPlatformTransaction(pool, (tx) =>
    insertQualifyingItem(tx, {
      businessId: BIZ_A,
      name: "Black Coffee",
      knowledgeNodeId: null,
      actorId: ACTOR_A,
      ...params,
    }),
  );
}

describe("insertQualifyingItem", () => {
  it("creates an active item with a generated UUID, full audit fields and schemaVersion 1", async () => {
    const item = await create();
    expect(item.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(item).toMatchObject({
      businessId: BIZ_A,
      name: "Black Coffee",
      knowledgeNodeId: null,
      status: "active",
      createdBy: ACTOR_A,
      updatedBy: ACTOR_A,
      schemaVersion: 1,
    });
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });

  it("persists an optional Commerce Knowledge classification when supplied", async () => {
    const item = await create({ name: "Medium Pizza", knowledgeNodeId: "node_pizza" });
    expect(item.knowledgeNodeId).toBe("node_pizza");
  });

  it("an item with no Commerce Knowledge mapping is fully valid (optional classification)", async () => {
    const item = await create({ knowledgeNodeId: null });
    expect(item.knowledgeNodeId).toBeNull();
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.knowledgeNodeId).toBeNull();
  });

  it("two items for one Business coexist with distinct ids; duplicate names are permitted (FQ-2 default)", async () => {
    const first = await create({ name: "Cappuccino" });
    const second = await create({ name: "Cappuccino" });
    expect(first.id).not.toBe(second.id);
    expect(await listQualifyingItems(pool, BIZ_A, "all")).toHaveLength(2);
  });
});

describe("getQualifyingItem — Business-scoped read", () => {
  it("returns the item for its own Business", async () => {
    const item = await create();
    expect(await getQualifyingItem(pool, BIZ_A, item.id)).toMatchObject({
      id: item.id,
      name: "Black Coffee",
    });
  });

  it("returns null when another Business supplies the id (no cross-Business read)", async () => {
    const item = await create();
    expect(await getQualifyingItem(pool, BIZ_B, item.id)).toBeNull();
  });

  it("returns null for a fabricated well-formed UUID", async () => {
    expect(await getQualifyingItem(pool, BIZ_A, FABRICATED_UUID)).toBeNull();
  });

  it("returns null (no driver error) for a malformed id", async () => {
    expect(await getQualifyingItem(pool, BIZ_A, "not-a-uuid")).toBeNull();
    expect(await getQualifyingItem(pool, BIZ_A, "'; DROP TABLE qualifying_items;--")).toBeNull();
    // The table is intact.
    await create();
    expect(await listQualifyingItems(pool, BIZ_A, "all")).toHaveLength(1);
  });
});

describe("listQualifyingItems — Business-scoped, status-filtered", () => {
  it("returns only the requesting Business's items (no leakage across Businesses)", async () => {
    await create({ businessId: BIZ_A, name: "A Coffee", actorId: ACTOR_A });
    await create({ businessId: BIZ_B, name: "B Tea", actorId: ACTOR_B });
    const listA = await listQualifyingItems(pool, BIZ_A, "all");
    const listB = await listQualifyingItems(pool, BIZ_B, "all");
    expect(listA.map((i) => i.name)).toEqual(["A Coffee"]);
    expect(listB.map((i) => i.name)).toEqual(["B Tea"]);
  });

  it("returns an empty list for a Business with no items", async () => {
    expect(await listQualifyingItems(pool, "biz_empty", "all")).toEqual([]);
  });

  it("orders deterministically by name (case-insensitive), then id", async () => {
    await create({ name: "banana" });
    await create({ name: "Apple" });
    await create({ name: "cherry" });
    expect((await listQualifyingItems(pool, BIZ_A, "all")).map((i) => i.name)).toEqual([
      "Apple",
      "banana",
      "cherry",
    ]);
  });

  it("filters by lifecycle status: active, retired, all", async () => {
    const keep = await create({ name: "Keep" });
    const drop = await create({ name: "Drop" });
    await withPlatformTransaction(pool, (tx) =>
      retireQualifyingItem(tx, { businessId: BIZ_A, id: drop.id, actorId: ACTOR_A }),
    );
    expect((await listQualifyingItems(pool, BIZ_A, "active")).map((i) => i.id)).toEqual([keep.id]);
    expect((await listQualifyingItems(pool, BIZ_A, "retired")).map((i) => i.id)).toEqual([drop.id]);
    expect(await listQualifyingItems(pool, BIZ_A, "all")).toHaveLength(2);
  });
});

describe("updateQualifyingItem — rename / classification", () => {
  it("renames the item, preserving id, createdBy and createdAt, and stamping updatedBy/updatedAt", async () => {
    const item = await create({ name: "Old Name", actorId: ACTOR_A });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await withPlatformTransaction(pool, (tx) =>
      updateQualifyingItem(tx, {
        businessId: BIZ_A,
        id: item.id,
        actorId: ACTOR_A2,
        name: "New Name",
      }),
    );
    expect(updated).toMatchObject({
      id: item.id,
      name: "New Name",
      status: "active",
      createdBy: ACTOR_A,
      updatedBy: ACTOR_A2,
    });
    expect(updated?.createdAt.getTime()).toBe(item.createdAt.getTime());
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(item.updatedAt.getTime());
  });

  it("leaves the classification untouched when knowledgeNodeId is not supplied (undefined)", async () => {
    const item = await create({ knowledgeNodeId: "node_1" });
    const updated = await withPlatformTransaction(pool, (tx) =>
      updateQualifyingItem(tx, {
        businessId: BIZ_A,
        id: item.id,
        actorId: ACTOR_A,
        name: "Renamed",
      }),
    );
    expect(updated?.knowledgeNodeId).toBe("node_1");
  });

  it("sets, changes and clears the optional classification", async () => {
    const item = await create({ knowledgeNodeId: null });
    const set = await withPlatformTransaction(pool, (tx) =>
      updateQualifyingItem(tx, {
        businessId: BIZ_A,
        id: item.id,
        actorId: ACTOR_A,
        knowledgeNodeId: "node_x",
      }),
    );
    expect(set?.knowledgeNodeId).toBe("node_x");
    expect(set?.name).toBe("Black Coffee");
    const cleared = await withPlatformTransaction(pool, (tx) =>
      updateQualifyingItem(tx, {
        businessId: BIZ_A,
        id: item.id,
        actorId: ACTOR_A,
        knowledgeNodeId: null,
      }),
    );
    expect(cleared?.knowledgeNodeId).toBeNull();
  });

  it("a Business B actor cannot mutate Business A's item by supplying its id; the item is untouched", async () => {
    const item = await create({ name: "A Only" });
    const result = await withPlatformTransaction(pool, (tx) =>
      updateQualifyingItem(tx, {
        businessId: BIZ_B,
        id: item.id,
        actorId: ACTOR_B,
        name: "Hijacked",
      }),
    );
    expect(result).toBeNull();
    const unchanged = await getQualifyingItem(pool, BIZ_A, item.id);
    expect(unchanged).toMatchObject({ name: "A Only", updatedBy: ACTOR_A });
  });

  it("returns null for a fabricated id", async () => {
    const result = await withPlatformTransaction(pool, (tx) =>
      updateQualifyingItem(tx, {
        businessId: BIZ_A,
        id: FABRICATED_UUID,
        actorId: ACTOR_A,
        name: "X",
      }),
    );
    expect(result).toBeNull();
  });

  it("a retired item can no longer be updated (terminal)", async () => {
    const item = await create({ name: "Frozen" });
    await withPlatformTransaction(pool, (tx) =>
      retireQualifyingItem(tx, { businessId: BIZ_A, id: item.id, actorId: ACTOR_A }),
    );
    const result = await withPlatformTransaction(pool, (tx) =>
      updateQualifyingItem(tx, {
        businessId: BIZ_A,
        id: item.id,
        actorId: ACTOR_A,
        name: "Thawed",
      }),
    );
    expect(result).toBeNull();
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.name).toBe("Frozen");
  });
});

describe("retireQualifyingItem — lifecycle (retire, never delete)", () => {
  it("moves active -> retired, preserving the row, its id, name and audit history", async () => {
    const item = await create({ name: "Seasonal Latte" });
    const retired = await withPlatformTransaction(pool, (tx) =>
      retireQualifyingItem(tx, { businessId: BIZ_A, id: item.id, actorId: ACTOR_A2 }),
    );
    expect(retired).toMatchObject({
      id: item.id,
      name: "Seasonal Latte",
      status: "retired",
      createdBy: ACTOR_A,
      updatedBy: ACTOR_A2,
    });
    // Historical identity survives: still resolvable by id.
    expect(await getQualifyingItem(pool, BIZ_A, item.id)).toMatchObject({ status: "retired" });
    const { rows } = await pool.query(
      "SELECT count(*)::int AS n FROM qualifying_items WHERE id = $1",
      [item.id],
    );
    expect(rows[0].n).toBe(1);
  });

  it("a second retire finds no active row and returns null (terminal, non-destructive)", async () => {
    const item = await create();
    await withPlatformTransaction(pool, (tx) =>
      retireQualifyingItem(tx, { businessId: BIZ_A, id: item.id, actorId: ACTOR_A }),
    );
    const again = await withPlatformTransaction(pool, (tx) =>
      retireQualifyingItem(tx, { businessId: BIZ_A, id: item.id, actorId: ACTOR_A }),
    );
    expect(again).toBeNull();
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.status).toBe("retired");
  });

  it("a Business B actor cannot retire Business A's item; it stays active", async () => {
    const item = await create();
    const result = await withPlatformTransaction(pool, (tx) =>
      retireQualifyingItem(tx, { businessId: BIZ_B, id: item.id, actorId: ACTOR_B }),
    );
    expect(result).toBeNull();
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.status).toBe("active");
  });

  it("returns null for a fabricated and for a malformed id", async () => {
    await withPlatformTransaction(pool, async (tx) => {
      expect(
        await retireQualifyingItem(tx, {
          businessId: BIZ_A,
          id: FABRICATED_UUID,
          actorId: ACTOR_A,
        }),
      ).toBeNull();
      expect(
        await retireQualifyingItem(tx, { businessId: BIZ_A, id: "nope", actorId: ACTOR_A }),
      ).toBeNull();
    });
  });
});

describe("repository surface", () => {
  it("exposes no delete operation (lifecycle is retirement, never hard-delete)", () => {
    expect(Object.keys(repository).filter((name) => /delete|remove|destroy/i.test(name))).toEqual(
      [],
    );
  });
});
