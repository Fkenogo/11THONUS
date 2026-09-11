import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discoverMigrationFiles } from "./migrationRunner";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "platform-baseline-001-migrations-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("discoverMigrationFiles", () => {
  it("returns an empty list for a nonexistent directory (a package with no migrations of its own is valid)", async () => {
    const files = await discoverMigrationFiles(path.join(dir, "does-not-exist"));
    expect(files).toEqual([]);
  });

  it("returns an empty list for an empty directory", async () => {
    const files = await discoverMigrationFiles(dir);
    expect(files).toEqual([]);
  });

  it("discovers and orders migrations by version, ascending", async () => {
    await writeFile(path.join(dir, "0002_second.sql"), "SELECT 2;");
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");
    await writeFile(path.join(dir, "0010_tenth.sql"), "SELECT 10;");

    const files = await discoverMigrationFiles(dir);
    expect(files.map((f) => f.version)).toEqual(["0001", "0002", "0010"]);
    expect(files.map((f) => f.name)).toEqual(["first", "second", "tenth"]);
  });

  it("pairs a migration with its .down.sql file when present", async () => {
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");
    await writeFile(path.join(dir, "0001_first.down.sql"), "SELECT -1;");

    const files = await discoverMigrationFiles(dir);
    expect(files[0].downPath).not.toBeNull();
    expect(files[0].downPath).toContain("0001_first.down.sql");
  });

  it("reports null downPath when no .down.sql file exists", async () => {
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");

    const files = await discoverMigrationFiles(dir);
    expect(files[0].downPath).toBeNull();
  });

  it("does not misidentify a .down.sql file as its own up migration", async () => {
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");
    await writeFile(path.join(dir, "0001_first.down.sql"), "SELECT -1;");

    const files = await discoverMigrationFiles(dir);
    expect(files).toHaveLength(1);
  });

  it("throws on a file that does not match the NNNN_name.sql convention", async () => {
    await writeFile(path.join(dir, "not-a-migration.sql"), "SELECT 1;");
    await expect(discoverMigrationFiles(dir)).rejects.toThrow(/naming convention/);
  });

  it("throws on a duplicate version across two files", async () => {
    await writeFile(path.join(dir, "0001_first.sql"), "SELECT 1;");
    await writeFile(path.join(dir, "0001_first_duplicate.sql"), "SELECT 1;");
    await expect(discoverMigrationFiles(dir)).rejects.toThrow(/Duplicate migration version/);
  });
});
