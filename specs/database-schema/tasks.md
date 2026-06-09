# Tasks — database-schema

- [x] T1 — Install `better-sqlite3` and `@types/better-sqlite3` as project dependencies (update `package.json`). Cubre: R19.

- [x] T2 — Create `src/main/migrations/001_initial.sql` with DDL for `schema_migrations`, `boards`, `keywords`, `runs`, `jobs`, `activities`, `resume`, `settings` in dependency order, with all columns and constraints specified in the BRD. Cubre: R1, R9, R10, R11, R12, R13, R14, R15.

- [x] T3 — Create `src/main/db.ts`: define `MigrationError`, implement `openDatabase(dbPath?: string)` that resolves path (prod vs test), enables `PRAGMA foreign_keys = ON`, ensures `schema_migrations` table exists, applies pending `.sql` files from `src/main/migrations/` in lexicographic order inside individual transactions, and exports the `db` singleton. Cubre: R1, R2, R3, R4, R5, R6, R7, R8, R16, R19.

- [x] T4 — Update `src/main/ipc-handler.ts`: replace the `db:query` stub with a real implementation that calls `runQuery(db, sql, params)`, returning rows for SELECT statements and `{ changes, lastInsertRowid }` for write statements, and `{ error }` on failure. Cubre: R17, R18, R20.

- [x] T5 — Write `tests/db.test.ts`: test that `openDatabase(":memory:")` creates all 7 tables and `schema_migrations`; test idempotency (calling twice does not fail); test `MigrationError` is thrown when a migration SQL is invalid. Cubre: R1, R2, R3, R4, R5, R6, R9, R10, R11, R12, R13, R14, R15.

- [x] T6 — Write tests for `runQuery` in `tests/db.test.ts` or a dedicated `tests/ipc-handler.test.ts`: test SELECT returns rows, INSERT returns `{ changes, lastInsertRowid }`, invalid SQL returns `{ error: string }`. Cubre: R17, R18, R20.

- [x] T7 — Verify `PRAGMA foreign_keys = ON` is enforced: write a test that attempts to insert a row in `jobs` with a non-existent `board_id` and asserts it throws. Cubre: R16.

- [x] T8 — Verify migration runner skips already-applied migrations: open DB, close it, reopen; assert `schema_migrations` has exactly one row per migration and no duplicates. Cubre: R2, R3.

- [x] T9 — Create `src/main/profiles.ts`: define `Profile` type and `ProfileError`; implement `listProfiles()`, `createProfile(name)`, `switchProfile(profileId)`, `deleteProfile(profileId)`, and `loadActiveProfile()` (called at app startup). Store index in `profiles.json` under `app.getPath('userData')`. Cubre: R21, R22, R23, R24, R25, R26.

- [x] T10 — Register IPC handlers `profiles:list`, `profiles:create`, `profiles:switch`, `profiles:delete` in `ipc-handler.ts` delegating to `profiles.ts`. Add the four channel names to the `ALLOWED_CHANNELS` constant in the preload. Cubre: R27.

- [x] T11 — Write `tests/profiles.test.ts` using a temp directory: test default profile created on first launch; create a second profile; switch to it; verify `activeProfileId` updates; attempt to delete the active profile and assert `ProfileError`; verify each profile has its own isolated DB file. Cubre: R21, R22, R23, R24, R25, R26.

- [x] T12 — Update `docs/architecture.md`: add a **Module map** section listing `src/main/` modules with their responsibilities; update the data flow diagram to show `renderer → IPC (contextBridge) → ipc-handler.ts → db.ts → SQLite`; document `better-sqlite3` as the persistence layer; document the profile isolation model (`profiles.ts`, `profiles.json`, per-profile DB file). Cubre: R28.

- [x] T13 — Update `docs/conventions.md`: add a **Database** section documenting table naming (`snake_case`), datetime storage (ISO-8601 UTC), migration file naming convention (`NNN_description.sql`), synchronous `better-sqlite3` API pattern, and profile isolation model. Cubre: R29.
