import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";

import {
  MigrationError,
  applyMigrations,
  openDatabase,
} from "../src/main/db.js";
import { runQuery } from "../src/main/ipc-handler.js";

const BUSINESS_TABLES = [
  "boards",
  "keywords",
  "resume",
  "runs",
  "jobs",
  "activities",
  "settings",
];

function listTableNames(database: Database.Database): string[] {
  const rows = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

describe("openDatabase", () => {
  it("creates all 7 business tables and schema_migrations", () => {
    const database = openDatabase(":memory:");
    const tables = listTableNames(database);

    assert.ok(tables.includes("schema_migrations"));
    for (const table of BUSINESS_TABLES) {
      assert.ok(tables.includes(table), `missing table ${table}`);
    }

    database.close();
  });

  it("is idempotent when called twice on the same database file", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobscout-db-"));
    const dbPath = path.join(tempDir, "jobscout.db");

    const first = openDatabase(dbPath);
    first.close();

    const second = openDatabase(dbPath);
    const migrationCount = second
      .prepare("SELECT COUNT(*) AS count FROM schema_migrations")
      .get() as { count: number };

    assert.equal(migrationCount.count, 1);
    second.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("throws MigrationError when a migration SQL is invalid", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobscout-bad-migration-"));
    const migrationsDir = path.join(tempDir, "migrations");
    fs.mkdirSync(migrationsDir);

    fs.writeFileSync(
      path.join(migrationsDir, "001_initial.sql"),
      "CREATE TABLE ok_table (id INTEGER PRIMARY KEY);"
    );
    fs.writeFileSync(
      path.join(migrationsDir, "002_invalid.sql"),
      "THIS IS NOT VALID SQL;"
    );

    const database = new Database(":memory:");
    database.pragma("foreign_keys = ON");

    assert.throws(
      () => applyMigrations(database, migrationsDir),
      (err: unknown) => {
        assert.ok(err instanceof MigrationError);
        assert.equal(err.migrationName, "002_invalid.sql");
        assert.match(err.message, /002_invalid.sql/);
        return true;
      }
    );

    const applied = database
      .prepare("SELECT name FROM schema_migrations WHERE name = ?")
      .get("002_invalid.sql");
    assert.equal(applied, undefined);

    database.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("skips already-applied migrations on reopen", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "jobscout-reopen-"));
    const dbPath = path.join(tempDir, "jobscout.db");

    const first = openDatabase(dbPath);
    first.close();

    const second = openDatabase(dbPath);
    const rows = second
      .prepare("SELECT name FROM schema_migrations ORDER BY name")
      .all() as Array<{ name: string }>;

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.name, "001_initial.sql");

    const duplicateCount = second
      .prepare(
        "SELECT COUNT(*) AS count FROM schema_migrations WHERE name = '001_initial.sql'"
      )
      .get() as { count: number };
    assert.equal(duplicateCount.count, 1);

    second.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("enforces foreign keys when inserting into jobs", () => {
    const database = openDatabase(":memory:");

    assert.throws(
      () => {
        database
          .prepare(
            `INSERT INTO jobs (
              board_id, keyword_id, title, url, run_id
            ) VALUES (?, ?, ?, ?, ?)`
          )
          .run(999, 999, "Engineer", "https://example.com/job", 999);
      },
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.match((err as Error).message, /FOREIGN KEY/i);
        return true;
      }
    );

    database.close();
  });
});

describe("runQuery", () => {
  it("returns rows for SELECT statements", () => {
    const database = openDatabase(":memory:");
    database.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "Example Board",
      "https://example.com/board"
    );

    const result = runQuery(database, "SELECT name FROM boards WHERE url = ?", [
      "https://example.com/board",
    ]);

    assert.ok(Array.isArray(result));
    assert.deepEqual(result, [{ name: "Example Board" }]);
    database.close();
  });

  it("returns changes and lastInsertRowid for INSERT statements", () => {
    const database = openDatabase(":memory:");

    const result = runQuery(
      database,
      "INSERT INTO keywords (keyword) VALUES (?)",
      ["typescript"]
    );

    assert.ok(result && !Array.isArray(result) && !("error" in result));
    assert.equal((result as { changes: number }).changes, 1);
    assert.equal((result as { lastInsertRowid: number }).lastInsertRowid, 1);
    database.close();
  });

  it("returns error object for invalid SQL", () => {
    const database = openDatabase(":memory:");
    const result = runQuery(database, "SELECT * FROM does_not_exist", []);

    assert.ok(result && !Array.isArray(result) && "error" in result);
    assert.match((result as { error: string }).error, /does_not_exist/);
    database.close();
  });
});
