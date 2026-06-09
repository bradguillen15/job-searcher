# Review — feature database-schema

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

- R1: [x] cubierto por `creates all 7 business tables and schema_migrations` (db.test.ts:33)
- R2: [x] cubierto por `skips already-applied migrations on reopen` (db.test.ts:98)
- R3: [x] cubierto por `skips already-applied migrations on reopen` (db.test.ts:98)
- R4: [x] cubierto por `throws MigrationError when a migration SQL is invalid` (db.test.ts:62) — verifica clase, nombre de migración y que no quede en schema_migrations
- R5: [x] cubierto por el mismo test de R4 — la migración inválida no queda registrada, confirmando rollback transaccional
- R6: [x] cubierto por `creates all 7 business tables and schema_migrations` (usa `:memory:`)
- R7: [x] implementado en `resolveDbPath` de `db.ts:35`; no requiere test E2E de Electron
- R8: [x] cubierto por `is idempotent when called twice on the same database file` (usa ruta de temp dir)
- R9–R15: [x] cubiertos por `creates all 7 business tables and schema_migrations` que valida las 7 tablas
- R16: [x] cubierto por `enforces foreign keys when inserting into jobs` (db.test.ts:124)
- R17: [x] cubierto por `returns rows for SELECT statements` (db.test.ts:149)
- R18: [x] cubierto por `returns error object for invalid SQL` (db.test.ts:180)
- R19: [x] cubierto por exportación de `openDatabase` y `db` verificada por todos los tests de db.test.ts
- R20: [x] cubierto por `returns changes and lastInsertRowid for INSERT statements` (db.test.ts:165)
- R21: [x] cubierto por `keeps each profile database isolated` (profiles.test.ts:94)
- R22: [x] cubierto por `creates a default profile on first launch` — verifica estructura de profiles.json
- R23: [x] cubierto por `creates a default profile on first launch` (profiles.test.ts:32)
- R24: [x] cubierto por conjunto de tests en profiles.test.ts que ejercen las 4 funciones CRUD + loadActiveProfile
- R25: [x] cubierto por `creates a second profile and switches to it` — verifica activeProfileId y lastUsedAt
- R26: [x] cubierto por `throws ProfileError when deleting the active profile` (profiles.test.ts:78)
- R27: [x] cubierto por `accepts profiles:list/create/switch/delete` en validateChannel tests (ipc-handler.test.ts)
- R28: [x] cubierto por contenido de `docs/architecture.md` — module map, data flow diagram, profile isolation model presentes
- R29: [x] cubierto por sección **Database** en `docs/conventions.md` — snake_case, ISO-8601, NNN_ prefix, better-sqlite3 sync, aislamiento por perfil

## Tasks completas

- T1: [x]
- T2: [x]
- T3: [x]
- T4: [x]
- T5: [x]
- T6: [x]
- T7: [x]
- T8: [x]
- T9: [x]
- T10: [x]
- T11: [x]
- T12: [x]
- T13: [x]

## Checkpoints (./init.sh)

- Python environment: [x]
- Base harness files present: [x]
- feature_list.json valid: [x]
- Python tests: [x] (0 tests, OK)
- JS/TS tests (npm/vitest + node:test): [x] — 24 tests, 0 failures
- TypeScript noEmit: [x] — 0 errors

## Cambios requeridos

Ninguno.
