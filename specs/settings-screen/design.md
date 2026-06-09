# Design — settings-screen

## Scope

This feature replaces the `SettingsScreen` placeholder at `/settings` with a
full preferences UI: AI backend configuration (Ollama URL + model list,
Anthropic API key), theme toggle, default scout date range, and active-profile
database path with **Open in Finder**.

**In scope:** renderer screen and components, `settings-db` helpers,
main-process implementations for `ollama:list`, `settings:saveAnthropicKey`,
`settings:anthropicKeyStatus`, `profiles:activeDbPath`, startup `.env` load
from `userData`, Vitest tests.

**Out of scope:** Anthropic model picker (remains `DEFAULT_ANTHROPIC_MODEL` in
code), moving the sidebar theme toggle, profile CRUD, matcher/scraper logic
changes beyond reading existing settings keys.

Depends on `navigation-layout` (route + shell + `useTheme`), `database-schema`
(`settings` table), `ai-matching` (settings keys + `ANTHROPIC_API_KEY`),
`scout-screen` (`scout.default_date_range` consumer — write path added here).

## Settings keys

| Key | Default | Persisted by |
|-----|---------|--------------|
| `ai.backend` | `"ollama"` | Save AI settings |
| `ollama.base_url` | `http://localhost:11434` | Save AI settings |
| `ollama.model` | `llama3.2` | Save AI settings |
| `scout.default_date_range` | `"30d"` | Immediate on selector change |

Anthropic API key is **not** stored in SQLite. It lives in `{userData}/.env` and
`process.env.ANTHROPIC_API_KEY` (existing matcher reads via `loadAiConfig()`).

## New IPC channels

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `ollama:list` | renderer → main | `{ baseUrl: string }` | `{ models: string[] }` or `{ error: string }` |
| `settings:saveAnthropicKey` | renderer → main | `{ apiKey: string }` | `{ ok: true }` or `{ error: string }` |
| `settings:anthropicKeyStatus` | renderer → main | _(none)_ | `{ configured: boolean }` |
| `profiles:activeDbPath` | renderer → main | _(none)_ | `string` (absolute path) |
| `fs:openPath` | renderer → main | `string` | `{ ok: true }` or `{ error: string }` (already implemented) |

Add all new invoke channels to `preload.ts` `ApiChannel` union and
`ipc-handler.ts` `ALLOWED_CHANNELS`. Replace the `ollama:list` stub with a real
handler.

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `src/main/ollama.ts` | Create | `listOllamaModels(baseUrl)` — GET `/api/tags` |
| `src/main/settings-env.ts` | Create | Read/write `{userData}/.env`, `saveAnthropicApiKey`, `isAnthropicKeyConfigured` |
| `src/main/profiles.ts` | Modify | Export `getActiveProfileDbPath()` |
| `src/main/ipc-handler.ts` | Modify | Register new handlers; implement `ollama:list` |
| `src/main/index.ts` | Modify | Load `{userData}/.env` after `dotenv/config` |
| `src/main/preload.ts` | Modify | Extend `ApiChannel` union |
| `src/renderer/types/settings.ts` | Create | `AiBackend`, `AppSettings`, form value types |
| `src/renderer/lib/settings-db.ts` | Create | Load/save settings rows via `db:query` upsert |
| `src/renderer/components/settings/AiSettingsSection.tsx` | Create | Backend toggle, Ollama/Anthropic fields, save actions |
| `src/renderer/components/settings/AppearanceSection.tsx` | Create | Theme toggle via `useTheme` |
| `src/renderer/components/settings/ScoutDefaultsSection.tsx` | Create | Default date range selector |
| `src/renderer/components/settings/DataSection.tsx` | Create | DB path display + Open in Finder |
| `src/renderer/screens/SettingsScreen.tsx` | Modify | Compose sections |
| `docs/architecture.md` | Modify | Document new IPC channels and `.env` location |
| `tests/main/ollama.test.ts` | Create | Tags parsing, HTTP error paths |
| `tests/main/settings-env.test.ts` | Create | `.env` write/update, configured flag |
| `tests/main/ipc-handler.test.ts` | Modify | `validateChannel` accepts new channels |
| `tests/renderer/settings-db.test.ts` | Create | Upsert SQL, load defaults |
| `tests/renderer/SettingsScreen.test.tsx` | Create | Section render, save flows, validation |
| `tests/renderer/AppShell.test.tsx` | Modify | Settings route shows heading not placeholder |

## Main-process signatures

```ts
// src/main/ollama.ts
export type OllamaListResult =
  | { models: string[] }
  | { error: string };

export async function listOllamaModels(
  baseUrl: string,
  fetchFn?: typeof fetch
): Promise<OllamaListResult>;
```

Parses `GET {normalizedBaseUrl}/api/tags` body `{ models?: Array<{ name?: string }> }`.
Strip trailing slash from `baseUrl` before request. Timeout 10s. Non-OK HTTP →
`{ error: "Ollama HTTP {status}: …" }`.

```ts
// src/main/settings-env.ts
export function getUserEnvPath(): string; // path.join(app.getPath("userData"), ".env")

export function loadUserEnv(): void; // dotenv.config({ path: getUserEnvPath(), override: false })

export function saveAnthropicApiKey(apiKey: string): { ok: true } | { error: string };

export function isAnthropicKeyConfigured(): boolean;
```

`saveAnthropicApiKey` reads existing `.env` lines (if any), replaces or appends
`ANTHROPIC_API_KEY=…`, writes file, sets `process.env.ANTHROPIC_API_KEY`.
Reject empty trimmed key with `{ error: "API key is required" }`.

```ts
// src/main/profiles.ts
export function getActiveProfileDbPath(): string;
```

Returns `getProfileDbPath(readIndex().activeProfileId)` using existing private
helper (export a thin wrapper).

## Renderer data access (`settings-db.ts`)

```ts
export const SETTING_KEYS = {
  aiBackend: "ai.backend",
  ollamaBaseUrl: "ollama.base_url",
  ollamaModel: "ollama.model",
  scoutDefaultDateRange: "scout.default_date_range",
} as const;

export type SettingsDbError = { error: string };

export async function loadSetting(key: string): Promise<string | null>;
export async function saveSetting(key: string, value: string): Promise<void>;
export async function loadAiSettings(): Promise<{
  backend: AiBackend;
  ollamaBaseUrl: string;
  ollamaModel: string;
}>;
```

Upsert SQL:

```sql
INSERT INTO settings (key, value) VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value
```

Reuse `DATE_RANGE_OPTIONS` / `DateRangeKey` from `src/renderer/types/scout.ts`
for R26–R28. Reuse `SCOUT_DEFAULT_DATE_RANGE_KEY` constant from
`scout-settings.ts` (export if currently private) to avoid key drift.

## Component tree

```
<SettingsScreen>                         ← route `/settings`
  <h1> Settings
  <AppearanceSection />                  ← useTheme toggle (R24–R25)
  <ScoutDefaultsSection />               ← date range, immediate save (R26–R29)
  <AiSettingsSection />                  ← backend, ollama/anthropic, saves (R3–R23)
  <DataSection />                        ← db path + Open in Finder (R30–R33)
```

### AiSettingsSection state

- `backend: AiBackend`
- `ollamaBaseUrl: string`
- `ollamaModel: string`
- `models: string[]` (from `ollama:list`)
- `modelsError: string | null`
- `modelsLoading: boolean`
- `anthropicKeyInput: string`
- `anthropicConfigured: boolean`
- `aiSaveError: string | null`
- `keySaveError: string | null`
- `keySaveSuccess: boolean`

On mount: `loadAiSettings()` + `settings:anthropicKeyStatus`. When backend is
`ollama` or URL changes (debounced 300ms on URL blur/change), refetch
`ollama:list`. Model `Select` options = union of fetched models and current
saved model (deduped).

**Save AI settings** validates URL (R15–R16), calls `saveSetting` for three
keys, shows inline success.

**Save API key** only enabled when anthropic backend visible and input
non-empty; calls `settings:saveAnthropicKey`, clears input on success.

### AppearanceSection

Mirror sidebar labels: Sun/Moon icon, "Light mode" / "Dark mode" text, same
`useTheme()` hook. No DB persistence.

### ScoutDefaultsSection

shadcn `ToggleGroup` or `Select` matching `DateRangeSelector` labels from scout
screen. `onValueChange` → `saveSetting(SCOUT_DEFAULT_DATE_RANGE_KEY, value)`.

### DataSection

Load path once on mount via `profiles:activeDbPath`. Read-only `Input` with
`readOnly` + `font-mono`. Button label **Open in Finder** (ROADMAP; acceptable
on macOS target). Calls `fs:openPath`.

## IPC handler registration (`ipc-handler.ts`)

```ts
ipcMain.handle("ollama:list", async (_e, payload: { baseUrl: string }) =>
  listOllamaModels(payload.baseUrl)
);

ipcMain.handle("settings:saveAnthropicKey", (_e, payload: { apiKey: string }) =>
  saveAnthropicApiKey(payload.apiKey)
);

ipcMain.handle("settings:anthropicKeyStatus", () => ({
  configured: isAnthropicKeyConfigured(),
}));

ipcMain.handle("profiles:activeDbPath", () => getActiveProfileDbPath());
```

Remove `ollama:list` from the generic stub loop.

## Startup `.env` load (`index.ts`)

After `import "dotenv/config"`, call `loadUserEnv()` from `settings-env.ts` so
keys saved to `{userData}/.env` are available to `loadAiConfig()` on restart.
Use `override: false` so an explicit project-root value wins in dev.

## UI layout

- Vertical stack of shadcn `Card` sections with `CardHeader` + `CardContent`.
- Section titles: **Appearance**, **Scout defaults**, **AI matching**, **Data**.
- Use existing tokens (`bg-background`, `text-muted-foreground`, `font-mono` for
  paths/URLs).
- Global load error banner at top if initial settings load fails.

## Discarded alternative: store Anthropic key in `settings` table

SQLite would simplify renderer persistence and avoid a new IPC channel.

**Discarded because:**

1. `ai-matching` already reads `process.env.ANTHROPIC_API_KEY` via `dotenv`.
2. ROADMAP explicitly requires writing `.env`.
3. Keeping secrets out of the per-profile DB avoids copying keys across profiles
   and reduces accidental backup exposure.

## Discarded alternative: `db:query` for active DB path

The renderer could `SELECT` a synthetic setting or compute path from profile id.

**Discarded because:**

1. DB path is a filesystem concern owned by `profiles.ts` + `app.getPath`.
2. Exposing `userData` layout to the renderer couples UI to Electron path rules.
3. A dedicated `profiles:activeDbPath` channel matches existing profile IPC
   patterns (`profiles:list`, `profiles:switch`).

## Discarded alternative: remove sidebar theme toggle

Centralize theme control only on Settings.

**Discarded because:**

1. `navigation-layout` already shipped the sidebar toggle (R8).
2. ROADMAP asks for theme toggle on Settings, not relocation.
3. Duplicating `useTheme` is zero-cost and improves discoverability.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `ollama.test.ts` | R34, R35 — mock `fetch`, parse models, HTTP/network errors |
| `settings-env.test.ts` | R20, R21, R22 — temp userData, write/update key, configured flag |
| `ipc-handler.test.ts` | New channels in `validateChannel` |
| `settings-db.test.ts` | R4, R8, R10, R14, R27, R29 — upsert SQL/params, defaults |
| `SettingsScreen.test.tsx` | R1–R3, R6–R7, R12–R19, R24–R33 — mock `window.api.invoke`, section visibility, save/validation, Finder button |
| `AppShell.test.tsx` (update) | R1, R2 — settings route heading |

`SettingsScreen.test.tsx` patterns:

- Mock `loadAiSettings` path via `db:query` responses.
- Assert Ollama fields hidden when backend is `anthropic`.
- Assert `ollama:list` called with trimmed base URL.
- Assert Save AI settings blocked for invalid URL.
- Assert `settings:saveAnthropicKey` invoked on Save API key.
- Assert `fs:openPath` invoked with mocked db path.
