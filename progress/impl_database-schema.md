# Implementation — database-schema

## Traceability

- R1 → `creates all 7 business tables and schema_migrations`
- R2 → `skips already-applied migrations on reopen`
- R3 → `skips already-applied migrations on reopen`
- R4 → `throws MigrationError when a migration SQL is invalid`
- R5 → `throws MigrationError when a migration SQL is invalid` (failed migration not recorded)
- R6 → `creates all 7 business tables and schema_migrations` (uses `:memory:`)
- R7 → Implemented in `openDatabase` default path (`app.getPath("userData")/jobscout.db`)
- R8 → Implemented in `openDatabase(dbPath?)` (temp-file idempotency test uses custom path)
- R9 → `creates all 7 business tables and schema_migrations`
- R10 → `creates all 7 business tables and schema_migrations`
- R11 → `creates all 7 business tables and schema_migrations`
- R12 → `creates all 7 business tables and schema_migrations`
- R13 → `creates all 7 business tables and schema_migrations`
- R14 → `creates all 7 business tables and schema_migrations`
- R15 → `creates all 7 business tables and schema_migrations`
- R16 → `enforces foreign keys when inserting into jobs`
- R17 → `returns rows for SELECT statements`
- R18 → `returns error object for invalid SQL`
- R19 → `openDatabase` export + `better-sqlite3` dependency (T1/T3)
- R20 → `returns changes and lastInsertRowid for INSERT statements`
- R21 → `keeps each profile database isolated`
- R22 → `creates a default profile on first launch`
- R23 → `creates a default profile on first launch`
- R24 → `creates a second profile and switches to it`
- R25 → `creates a second profile and switches to it`
- R26 → `throws ProfileError when deleting the active profile`
- R27 → `accepts profiles:list` / `profiles:create` / `profiles:switch` / `profiles:delete` (validateChannel)
- R28 → `docs/architecture.md` updated (module map, data flow, profiles)
- R29 → `docs/conventions.md` updated (Database section)

## Verification

```bash
pnpm run test && npx tsc --noEmit
```

Both pass with zero errors.
