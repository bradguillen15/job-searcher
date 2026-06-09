# Implementation — settings-screen

**Status:** `in_progress` (review fixes applied)  
**Date:** 2026-06-08

## Summary

Replaced the Settings placeholder with a full preferences screen: Appearance (theme),
Scout defaults (date range), AI matching (Ollama/Anthropic), and Data (DB path +
Open in Finder). Added main-process handlers for `ollama:list`, `settings:saveAnthropicKey`,
`settings:anthropicKeyStatus`, `profiles:activeDbPath`; loads `{userData}/.env` at startup.

## Review follow-up (2026-06-08)

Addressed 7 test-coverage gaps from `progress/review_settings-screen.md` (R5, R14, R22,
R23, R26, R27, R36). No production code changes required.

## Verification

- `./init.sh` — green (142 tests pass, TypeScript clean)
- Feature **not** marked `done` in `feature_list.json`

## Traceability (R → test)

| Req | Test |
|-----|------|
| R1 | `SettingsScreen.test.tsx` — renders Settings heading and all sections; `AppShell.test.tsx` — shows screen content for Settings route |
| R2 | `SettingsScreen.test.tsx` — renders Settings heading and all sections; `AppShell.test.tsx` — shows screen content for Settings route |
| R3 | `SettingsScreen.test.tsx` — shows Ollama fields when backend is ollama |
| R4 | `settings-db.test.ts` — loadAiSettings returns stored values |
| R5 | `settings-db.test.ts` — loadAiSettings falls back to ollama when backend value is invalid |
| R6 | `SettingsScreen.test.tsx` — shows Ollama fields when backend is ollama |
| R7 | `SettingsScreen.test.tsx` — hides Ollama fields when backend is anthropic |
| R8 | `settings-db.test.ts` — loadAiSettings returns stored values |
| R9 | `settings-db.test.ts` — loadAiSettings returns defaults when keys are missing |
| R10 | `settings-db.test.ts` — loadAiSettings returns stored values |
| R11 | `settings-db.test.ts` — loadAiSettings returns defaults when keys are missing |
| R12 | `SettingsScreen.test.tsx` — calls ollama:list with trimmed base URL |
| R13 | `SettingsScreen.test.tsx` — shows ollama list error inline |
| R14 | `SettingsScreen.test.tsx` — saves AI settings via db upsert (backend, base URL, model) |
| R15 | `SettingsScreen.test.tsx` — blocks Save AI settings for empty Ollama URL |
| R16 | `SettingsScreen.test.tsx` — blocks Save AI settings for invalid Ollama URL scheme |
| R17 | `SettingsScreen.test.tsx` — invokes settings:saveAnthropicKey on Save API key; `ipc-handler.test.ts` — accepts settings:saveAnthropicKey |
| R18 | `SettingsScreen.test.tsx` — invokes settings:saveAnthropicKey on Save API key |
| R19 | `SettingsScreen.test.tsx` — shows anthropic save error inline |
| R20 | `settings-env.test.ts` — writes a new Anthropic API key to userData .env; updates an existing Anthropic API key |
| R21 | `settings-env.test.ts` — loads userData .env without overriding existing process env |
| R22 | `SettingsScreen.test.tsx` — shows Configured when anthropic key status is configured |
| R23 | `settings-env.test.ts` — saveAnthropicApiKey response excludes api key value; anthropicKeyStatus shape excludes api key value |
| R24 | `SettingsScreen.test.tsx` — toggles theme via Appearance section |
| R25 | `SettingsScreen.test.tsx` — toggles theme via Appearance section |
| R26 | `SettingsScreen.test.tsx` — renders five date range options in Scout defaults |
| R27 | `settings-db.test.ts` — loadDefaultDateRangeSetting returns stored valid value |
| R28 | `settings-db.test.ts` — loadDefaultDateRangeSetting falls back to 30d when invalid |
| R29 | `SettingsScreen.test.tsx` — persists default date range immediately on change; `settings-db.test.ts` — saveDefaultDateRangeSetting persists scout.default_date_range |
| R30 | `SettingsScreen.test.tsx` — displays database path and opens in Finder; `ipc-handler.test.ts` — accepts profiles:activeDbPath |
| R31 | `SettingsScreen.test.tsx` — displays database path and opens in Finder |
| R32 | `SettingsScreen.test.tsx` — displays database path and opens in Finder |
| R33 | `SettingsScreen.test.tsx` — shows fs:openPath error adjacent to database controls |
| R34 | `ollama.test.ts` — parses model names from tags response |
| R35 | `ollama.test.ts` — returns error on non-success HTTP status; returns error on network failure |
| R36 | `profiles.test.ts` — getActiveProfileDbPath returns absolute path to active profile jobscout.db |

## Tests added

| File | Test |
|------|------|
| `tests/renderer/settings-db.test.ts` | loadAiSettings falls back to ollama when backend value is invalid |
| `tests/renderer/settings-db.test.ts` | loadDefaultDateRangeSetting returns stored valid value |
| `tests/renderer/SettingsScreen.test.tsx` | saves AI settings via db upsert — extended ollamaModel upsert assertion |
| `tests/renderer/SettingsScreen.test.tsx` | shows Configured when anthropic key status is configured |
| `tests/renderer/SettingsScreen.test.tsx` | renders five date range options in Scout defaults |
| `tests/main/settings-env.test.ts` | saveAnthropicApiKey response excludes api key value |
| `tests/main/settings-env.test.ts` | anthropicKeyStatus shape excludes api key value |
| `tests/profiles.test.ts` | getActiveProfileDbPath returns absolute path to active profile jobscout.db |
