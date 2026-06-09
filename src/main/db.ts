import Database from "better-sqlite3";
import { app } from "electron";
import fs from "fs";
import path from "path";

export class MigrationError extends Error {
  constructor(
    public migrationName: string,
    cause: Error
  ) {
    super(`Migration failed: ${migrationName} — ${cause.message}`);
    this.name = "MigrationError";
  }
}

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const SCHEMA_MIGRATIONS_DDL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at DATETIME NOT NULL DEFAULT (datetime('now'))
)`;

function resolveDbPath(dbPath?: string): string {
  if (dbPath === ":memory:") {
    return ":memory:";
  }
  if (dbPath) {
    return dbPath;
  }
  if (process.env["NODE_ENV"] === "test") {
    return ":memory:";
  }
  return path.join(app.getPath("userData"), "jobscout.db");
}

function ensureSchemaMigrationsTable(database: Database.Database): void {
  database.exec(SCHEMA_MIGRATIONS_DDL);
}

function getAppliedMigrationNames(database: Database.Database): Set<string> {
  const rows = database
    .prepare("SELECT name FROM schema_migrations")
    .all() as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

export function applyMigrations(database: Database.Database, migrationsDir: string): void {
  ensureSchemaMigrationsTable(database);
  const applied = getAppliedMigrationNames(database);

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const applyMigration = database.transaction(() => {
      database.exec(sql);
      database.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
    });

    try {
      applyMigration();
    } catch (err) {
      throw new MigrationError(file, err as Error);
    }
  }
}

export function openDatabase(dbPath?: string): Database.Database {
  const resolvedPath = resolveDbPath(dbPath);

  if (resolvedPath !== ":memory:") {
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  if (db) {
    db.close();
  }

  const instance = new Database(resolvedPath);
  instance.pragma("foreign_keys = ON");
  applyMigrations(instance, MIGRATIONS_DIR);
  db = instance;
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = undefined as unknown as Database.Database;
  }
}

export let db: Database.Database;
