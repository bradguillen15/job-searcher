# Design — database-schema

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `src/main/db.ts` | Create | Opens SQLite, runs migrations, exports `db` instance |
| `src/main/migrations/001_initial.sql` | Create | DDL for all 7 tables + `schema_migrations` |
| `src/main/ipc-handler.ts` | Modify | Wire `db:query` stub to real `db` instance |
| `tests/db.test.ts` | Create | Unit tests for migration runner and `db:query` handler |

## Key signatures

### `src/main/db.ts`

```ts
import Database from "better-sqlite3";

export class MigrationError extends Error {
  constructor(public migrationName: string, cause: Error) { ... }
}

/**
 * Opens (or creates) the SQLite file at dbPath, applies pending migrations,
 * enables foreign keys, and returns the ready instance.
 * Defaults to app.getPath('userData')/jobscout.db in production,
 * or ':memory:' when NODE_ENV=test and no dbPath is given.
 */
export function openDatabase(dbPath?: string): Database.Database;

/** Singleton instance initialized at module load time. */
export const db: Database.Database;
```

### `src/main/ipc-handler.ts` (updated handler)

```ts
ipcMain.handle("db:query", (_event, { sql, params }: { sql: string; params: unknown[] }) =>
  runQuery(db, sql, params)
);
```

```ts
// Internal helper (not exported)
function runQuery(
  db: Database.Database,
  sql: string,
  params: unknown[]
): unknown[] | { changes: number; lastInsertRowid: number } | { error: string }
```

### Migration runner (internal, inside `db.ts`)

```ts
function applyMigrations(db: Database.Database, migrationsDir: string): void;
```

Reads `.sql` files sorted lexicographically (so `001_` before `002_`), skips those already in `schema_migrations`, wraps each in a transaction.

## `src/main/migrations/001_initial.sql`

Creates `schema_migrations` first, then the 7 business tables in dependency order:

1. `schema_migrations`
2. `boards`
3. `keywords`
4. `runs`
5. `jobs` (FK → boards, keywords, runs)
6. `activities` (FK → jobs)
7. `resume`
8. `settings`

## Profiles module (`src/main/profiles.ts`)

```ts
export interface Profile {
  id: string;          // UUID v4
  name: string;
  createdAt: string;   // ISO-8601
  lastUsedAt: string;  // ISO-8601
}

export interface ProfilesIndex {
  activeProfileId: string;
  profiles: Profile[];
}

export class ProfileError extends Error { ... }

export function listProfiles(): Profile[]
export function createProfile(name: string): Profile
export function switchProfile(profileId: string): void   // closes current db, opens new one
export function deleteProfile(profileId: string): void   // throws ProfileError if active
export function loadActiveProfile(): void                // called at app startup
```

Each profile's DB lives at `<userData>/profiles/<profileId>/jobscout.db`.
The index lives at `<userData>/profiles.json`.

New IPC channels (added to `ALLOWED_CHANNELS` in `preload.ts`):
- `profiles:list` → `listProfiles()`
- `profiles:create` → `createProfile(name)`
- `profiles:switch` → `switchProfile(profileId)`
- `profiles:delete` → `deleteProfile(profileId)`

## Error handling

- `MigrationError` is thrown (and propagates out of `openDatabase`) if any migration SQL fails. The transaction guarantees no partial DDL.
- `db:query` catches all errors and returns `{ error: string }` to the renderer — never propagates to Electron's unhandled rejection handler.

## Discarded alternative: Knex / Prisma ORM

Knex and Prisma both offer typed migrations and query builders. Both were discarded because:

1. `docs/architecture.md` principle 1 forbids extra layers (services, repositories, ORMs) without a concrete documented reason.
2. `better-sqlite3` is already a chosen dependency (listed in the feature description); raw SQL migrations stay explicit and dependency-minimal.
3. Prisma requires a separate codegen step incompatible with the Electron main-process build pipeline without extra Vite configuration.

## Test strategy

Tests use `:memory:` databases exclusively (R6). The migration runner is tested by calling `openDatabase(":memory:")` and asserting tables exist via `SELECT name FROM sqlite_master`. IPC handler tests invoke `runQuery` directly without spinning up an Electron instance.
