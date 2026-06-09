# Requirements — database-schema

## R1
El sistema DEBE crear una tabla `schema_migrations` con columnas `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL UNIQUE`, y `applied_at DATETIME NOT NULL DEFAULT (datetime('now'))` si no existe al iniciar el módulo `db.ts`.

## R2
CUANDO el módulo `db.ts` se inicializa, el sistema DEBE aplicar en orden ascendente todos los archivos `.sql` en `src/main/migrations/` cuyos nombres no figuren aún en `schema_migrations`.

## R3
CUANDO una migración se aplica con éxito, el sistema DEBE insertar su nombre en `schema_migrations`.

## R4
SI una migración falla durante su ejecución ENTONCES el sistema DEBE lanzar un error nombrado `MigrationError` que incluya el nombre del archivo y el mensaje de error original, y NO DEBE marcar la migración como aplicada.

## R5
El sistema DEBE ejecutar cada migración dentro de una transacción SQLite, de modo que una migración parcial no deje la base de datos en estado inconsistente.

## R6
CUANDO el entorno de pruebas está activo (variable `NODE_ENV=test` o ruta de DB es `:memory:`), el sistema DEBE abrir la base de datos en memoria en lugar de escribir al sistema de archivos.

## R7
CUANDO el entorno de producción está activo, el sistema DEBE abrir (o crear) el archivo SQLite en `app.getPath('userData')/jobscout.db`.

## R8
El sistema DEBE aceptar una ruta de base de datos configurable a través del parámetro `dbPath` de la función `openDatabase`, usando la ruta por defecto de R7 cuando no se provea.

## R9
El sistema DEBE crear la tabla `boards` con las columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `name TEXT NOT NULL`, `url TEXT NOT NULL UNIQUE`, `search_selector TEXT NULL`, `created_at DATETIME NOT NULL DEFAULT (datetime('now'))`.

## R10
El sistema DEBE crear la tabla `keywords` con las columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `keyword TEXT NOT NULL UNIQUE`, `active BOOLEAN NOT NULL DEFAULT 1`, `created_at DATETIME NOT NULL DEFAULT (datetime('now'))`.

## R11
El sistema DEBE crear la tabla `resume` con las columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `filename TEXT NOT NULL`, `raw_text TEXT NOT NULL`, `skill_profile TEXT NULL`, `current_company TEXT NULL`, `current_salary INTEGER NULL`, `target_salary INTEGER NULL`, `search_mode TEXT NULL`, `updated_at DATETIME NOT NULL DEFAULT (datetime('now'))`.

## R12
El sistema DEBE crear la tabla `runs` con las columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `started_at DATETIME NOT NULL`, `finished_at DATETIME NULL`, `total_scraped INTEGER NOT NULL DEFAULT 0`, `total_new INTEGER NOT NULL DEFAULT 0`, `total_matched INTEGER NOT NULL DEFAULT 0`.

## R13
El sistema DEBE crear la tabla `jobs` con las columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `board_id INTEGER NOT NULL REFERENCES boards(id)`, `keyword_id INTEGER NOT NULL REFERENCES keywords(id)`, `title TEXT NOT NULL`, `company TEXT NULL`, `location TEXT NULL`, `posted_date DATETIME NULL`, `description TEXT NULL`, `url TEXT NOT NULL UNIQUE`, `score INTEGER NULL`, `match_reason TEXT NULL`, `status TEXT NOT NULL DEFAULT 'new'`, `run_id INTEGER NOT NULL REFERENCES runs(id)`, `scraped_at DATETIME NOT NULL DEFAULT (datetime('now'))`.

## R14
El sistema DEBE crear la tabla `activities` con las columnas: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `job_id INTEGER NOT NULL REFERENCES jobs(id)`, `type TEXT NOT NULL`, `notes TEXT NULL`, `scheduled_at DATETIME NULL`, `created_at DATETIME NOT NULL DEFAULT (datetime('now'))`.

## R15
El sistema DEBE crear la tabla `settings` con las columnas: `key TEXT PRIMARY KEY`, `value TEXT NOT NULL`.

## R16
El sistema DEBE habilitar `PRAGMA foreign_keys = ON` cada vez que se abre una conexión a la base de datos.

## R17
CUANDO el IPC handler `db:query` recibe un mensaje con `{ sql: string, params: unknown[] }`, el sistema DEBE ejecutar la sentencia SQL usando la instancia `db` de `better-sqlite3` y devolver las filas resultantes como array serializable.

## R18
SI `db:query` recibe una sentencia SQL inválida o que produce un error en SQLite ENTONCES el sistema DEBE devolver al renderer un objeto `{ error: string }` con el mensaje de error, sin crashear el proceso principal.

## R19
El sistema DEBE exportar desde `db.ts` una función `openDatabase(dbPath?: string): Database` y una constante `db` que es la instancia inicializada con migraciones aplicadas.

## R20
CUANDO `db:query` ejecuta una sentencia que no retorna filas (INSERT, UPDATE, DELETE), el sistema DEBE devolver `{ changes: number, lastInsertRowid: number }` en lugar de un array vacío.

## R21
El sistema DEBE soportar múltiples perfiles de usuario en el mismo PC. Cada perfil tiene su propia base de datos SQLite aislada en `app.getPath('userData')/profiles/<profileId>/jobscout.db`. Los datos de un perfil (resume, jobs, boards, keywords) NUNCA se mezclan con los de otro perfil.

## R22
El sistema DEBE mantener un archivo de índice `app.getPath('userData')/profiles.json` con la lista de perfiles: `id` (UUID), `name` (display name), `createdAt` (ISO-8601), `lastUsedAt` (ISO-8601), y `activeProfileId` (el perfil actualmente seleccionado).

## R23
CUANDO la aplicación arranca, el sistema DEBE leer `profiles.json` y abrir la base de datos del perfil indicado en `activeProfileId`. SI `profiles.json` no existe, el sistema DEBE crear un perfil por defecto llamado `"Default"` y escribir `profiles.json`.

## R24
El sistema DEBE exponer las funciones `listProfiles()`, `createProfile(name: string): Profile`, `switchProfile(profileId: string): void`, y `deleteProfile(profileId: string): void` desde un módulo `src/main/profiles.ts`.

## R25
CUANDO se llama a `switchProfile(profileId)`, el sistema DEBE cerrar la conexión a la base de datos activa, actualizar `activeProfileId` en `profiles.json`, abrir la base de datos del nuevo perfil (aplicando migraciones si es nuevo), y actualizar `lastUsedAt`.

## R26
SI se llama a `deleteProfile(profileId)` en el perfil actualmente activo ENTONCES el sistema DEBE lanzar un `ProfileError` y no realizar ninguna operación.

## R27
El sistema DEBE registrar los canales IPC `profiles:list`, `profiles:create`, `profiles:switch`, y `profiles:delete` en `ipc-handler.ts`, delegando a las funciones de `profiles.ts`.

## R28
El sistema DEBE actualizar `docs/architecture.md` para documentar: la capa de persistencia (módulo `db.ts`, migrations runner, `better-sqlite3`), el flujo de datos real de la aplicación (renderer → IPC → main → SQLite), los módulos de `src/main/` existentes, y el modelo de perfiles.

## R29
El sistema DEBE actualizar `docs/conventions.md` para documentar las convenciones específicas de la base de datos: nombres de tablas en `snake_case`, todas las fechas en columnas `DATETIME` almacenadas como ISO-8601 UTC, migraciones versionadas con prefijo numérico (`001_`, `002_`, …), uso de `better-sqlite3` (síncrono, no async), y el modelo de aislamiento por perfil.
