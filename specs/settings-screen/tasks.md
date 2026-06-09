# Tasks — settings-screen

- [x] T1 — Add shadcn components `card`, `select`, `radio-group` (if not present) via `pnpm dlx shadcn@latest add …`. Covers: R2, R3, R26.

- [x] T2 — Create `src/main/ollama.ts` with `listOllamaModels(baseUrl)` calling `GET /api/tags`, normalizing names, and returning typed results. Covers: R34, R35.

- [x] T3 — Create `src/main/settings-env.ts` with `getUserEnvPath`, `loadUserEnv`, `saveAnthropicApiKey`, and `isAnthropicKeyConfigured`. Covers: R20, R21, R22, R23.

- [x] T4 — Export `getActiveProfileDbPath()` from `src/main/profiles.ts`. Covers: R36.

- [x] T5 — Update `src/main/index.ts` to call `loadUserEnv()` after `dotenv/config`. Covers: R21.

- [x] T6 — Update `src/main/ipc-handler.ts` and `src/main/preload.ts`: register `ollama:list`, `settings:saveAnthropicKey`, `settings:anthropicKeyStatus`, `profiles:activeDbPath`; remove `ollama:list` stub. Covers: R12, R17, R22, R30, R34, R36.

- [x] T7 — Update `docs/architecture.md` IPC table: mark `ollama:list` implemented, document new settings/profile channels and `{userData}/.env`. Covers: R20, R34.

- [x] T8 — Create `src/renderer/types/settings.ts` with `AiBackend`, settings form types, and constants mirroring matcher defaults. Covers: R4, R5, R9, R11.

- [x] T9 — Create `src/renderer/lib/settings-db.ts` with `loadSetting`, `saveSetting`, `loadAiSettings`, and upsert SQL. Export `SCOUT_DEFAULT_DATE_RANGE_KEY` from `scout-settings.ts` if needed. Covers: R4, R8, R10, R14, R27, R29.

- [x] T10 — Create `src/renderer/components/settings/AppearanceSection.tsx` using `useTheme`. Covers: R24, R25.

- [x] T11 — Create `src/renderer/components/settings/ScoutDefaultsSection.tsx` with five-option date range control and immediate persist. Covers: R26, R27, R28, R29.

- [x] T12 — Create `src/renderer/components/settings/AiSettingsSection.tsx`: backend selector, conditional Ollama/Anthropic fields, `ollama:list` fetch, Save AI settings + Save API key actions, validation and inline errors. Covers: R3, R5, R6, R7, R12, R13, R14, R15, R16, R17, R18, R19.

- [x] T13 — Create `src/renderer/components/settings/DataSection.tsx`: read-only mono path, **Open in Finder** via `fs:openPath`, error display. Covers: R30, R31, R32, R33.

- [x] T14 — Rewrite `src/renderer/screens/SettingsScreen.tsx` to compose all sections with page heading and load-error handling. Covers: R1, R2.

- [x] T15 — Write `tests/main/ollama.test.ts`: successful tags parse, empty models, HTTP error, network failure. Covers: R34, R35.

- [x] T16 — Write `tests/main/settings-env.test.ts`: write new key, update existing key, `isAnthropicKeyConfigured`, reject empty key (use temp userData via env override pattern). Covers: R20, R22, R23.

- [x] T17 — Update `tests/main/ipc-handler.test.ts`: `validateChannel` accepts `settings:saveAnthropicKey`, `settings:anthropicKeyStatus`, `profiles:activeDbPath`. Covers: R17, R22, R30.

- [x] T18 — Write `tests/renderer/settings-db.test.ts`: load defaults, upsert params, date range save. Covers: R4, R8, R10, R14, R27, R29.

- [x] T19 — Write `tests/renderer/SettingsScreen.test.tsx`: section visibility, backend conditional fields, ollama list error, AI save validation, API key save, db path + Finder button, theme toggle. Covers: R1, R3, R6, R7, R12, R13, R15, R16, R17, R18, R19, R24, R30, R32.

- [x] T20 — Update `tests/renderer/AppShell.test.tsx` to expect Settings heading instead of placeholder. Covers: R1, R2.

- [x] T21 — Run `pnpm test` and `npx tsc --noEmit`; both pass with zero errors. Write traceability map (`R<n>` → test name) to `progress/impl_settings-screen.md`. Covers: all R.
