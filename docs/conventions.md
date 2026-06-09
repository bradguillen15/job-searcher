# Code conventions

> Extreme homogeneity. Agents predict better when the repo looks like itself
> everywhere.

## TypeScript

- **Version:** TypeScript strict mode enabled.
- **Format:** Match existing project style; lines max 100 characters.
- **Imports:** External packages first, then local modules.
- **Strings:** Double quotes `"..."` unless the file already uses another style.
- **Types:** Declare types explicitly unless clearly inferable. Avoid `any`.

## Names

| Type              | Convention     | Example              |
|-------------------|----------------|----------------------|
| Files (modules)   | `kebab-case`   | `job-store.ts`       |
| Types / classes   | `PascalCase`   | `JobListing`         |
| Functions / vars  | `camelCase`    | `loadJobs`           |
| Constants         | `UPPER_SNAKE`  | `DEFAULT_OUTPUT_DIR` |
| Private helpers   | prefix `_`     | `_parseDate`         |

## Database

See also the [ER diagram in `docs/architecture.md`](architecture.md#database-schema).

- **Engine:** `better-sqlite3` (synchronous API — no `async`/`await` in `db.ts`
  or profile DB helpers).
- **Table names:** `snake_case` (`boards`, `schema_migrations`, …).
- **Datetimes:** Columns typed `DATETIME` store ISO-8601 UTC strings
  (e.g. `2026-06-08T12:00:00.000Z`). Use `new Date().toISOString()` in
  application code.
- **Migrations:** One file per change in `src/main/migrations/`, named
  `NNN_description.sql` (e.g. `001_initial.sql`). Applied in lexicographic
  order; applied names recorded in `schema_migrations`.
- **Foreign keys:** `PRAGMA foreign_keys = ON` on every connection.
- **Profile isolation:** Each user profile has its own SQLite file under
  `profiles/<profileId>/jobscout.db`. The active profile is tracked in
  `profiles.json`; never query across profile databases.

## Tests

- One test file per module: `tests/<module>.test.ts` or colocated `*.test.tsx`.
- Descriptive test names: `loadJobs returns empty array when file missing`.
- Use real temp directories or in-memory fixtures; avoid mocking the filesystem
  when a temp dir suffices.

**Layout:**

| Location | Runner | Purpose |
|----------|--------|---------|
| `tests/renderer/` | Vitest (jsdom) | React components |
| `tests/*.test.ts` | Node test runner + `tsx` | Main-process modules |
| `tests/main/` | Node test runner + `tsx` | IPC utilities |

Main-process tests that import `electron` must run with:

```bash
npx tsx --require ./tests/main/electron-mock.cjs --test tests/…
```

Profile tests set `JOBSCOUT_TEST_USER_DATA` to a temp directory (see
`tests/profiles.test.ts`).

## Error handling

- Domain errors are named classes or typed error codes.
- Entry points catch domain errors, emit a clear message, and exit or return
  a failure status. Never leak raw stack traces to end users.

## Comments

Default to **none**. Only explain non-obvious *why* (workarounds, subtle
invariants). Names should carry the rest.
