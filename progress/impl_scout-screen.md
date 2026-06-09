# Implementation — scout-screen

- **Feature:** scout-screen
- **Status:** `in_progress` (awaiting reviewer; not marked `done`)
- **Agent:** implementer
- **Date:** 2026-06-08

## Summary

Replaced the Scout route placeholder with a full scout workflow UI: date range toggle (24h–90d), **Run Scout** button, live IPC progress log, per-board status with inline errors, last-run timestamp from `runs`, and manual search-bar fallback dialog.

Added shadcn `toggle-group`, `scroll-area`, and `toggle` UI primitives.

## Files created

| File | Purpose |
|------|---------|
| `src/renderer/types/scout.ts` | Scout UI + run result types |
| `src/renderer/types/progress.ts` | Renderer-safe `ProgressEvent` union |
| `src/renderer/lib/scout-progress.ts` | Event → log line formatters |
| `src/renderer/lib/runs-db.ts` | `getLastCompletedRun()` |
| `src/renderer/lib/scout-settings.ts` | `loadDefaultDateRange()` |
| `src/renderer/hooks/useScraperProgress.ts` | `scraper:progress` subscription |
| `src/renderer/components/scout/DateRangeSelector.tsx` | Five-option date range control |
| `src/renderer/components/scout/ProgressLog.tsx` | Monospace auto-scroll log |
| `src/renderer/components/scout/BoardStatusList.tsx` | Board phase badges + errors |
| `src/renderer/components/scout/SelectorRequiredDialog.tsx` | Manual selector modal |
| `tests/renderer/scout-progress.test.ts` | Formatter unit tests |
| `tests/renderer/runs-db.test.ts` | Last-run query tests |
| `tests/renderer/scout-settings.test.ts` | Default date range tests |
| `tests/renderer/useScraperProgress.test.ts` | IPC subscribe/unsubscribe lifecycle |
| `tests/renderer/ScoutScreen.test.tsx` | Integration tests |

## Files modified

| File | Change |
|------|--------|
| `src/renderer/screens/ScoutScreen.tsx` | Full scout orchestration |
| `src/renderer/components/ui/toggle-group.tsx` | shadcn add |
| `src/renderer/components/ui/toggle.tsx` | shadcn add |
| `src/renderer/components/ui/scroll-area.tsx` | shadcn add |
| `tests/renderer/AppShell.test.tsx` | Scout route expects heading + IPC mocks |
| `tests/renderer/App.test.tsx` | Added `window.api.on` mock |
| `tests/renderer/router.test.tsx` | Added `window.api.on` + db mocks |
| `feature_list.json` | `scout-screen` → `in_progress` |
| `specs/scout-screen/tasks.md` | All tasks `[x]` |

## Verification

- `./init.sh` — green (108 renderer + 126 main tests, tsc clean)
- `pnpm test:renderer` — 108/108 pass
- `npx tsc --noEmit` — pass

## Review follow-up (R5, R7, R11)

Addressed reviewer gaps from `progress/review_scout-screen.md`:

1. **R5** — Added `tests/renderer/useScraperProgress.test.ts`: asserts `window.api.on('scraper:progress', …)` on mount and unsubscribe on unmount.
2. **R7** — Extended `ScoutScreen > appends progress log lines…`: after `board_start` only, asserts Indeed row shows **Running** before `board_done`.
3. **R11** — Added `ScoutScreen > shows run_complete summary in log and re-enables controls via IPC`: pending `scraper:run`, emit `run_complete`, assert summary line and re-enabled Run Scout / date range.

## Traceability (R → test)

| Req | Test(s) |
|-----|---------|
| R1 | `AppShell > shows screen content for each route` (Scout heading) |
| R2 | `ScoutScreen > renders Scout heading…`; `ScoutScreen > invokes scraper:run…` |
| R3 | `ScoutScreen > invokes scraper:run with selected date range` |
| R4 | `ScoutScreen > disables Run Scout and date range while running` |
| R5 | `useScraperProgress > subscribes to scraper:progress on mount and unsubscribes on unmount` |
| R6 | `scout-progress > formats log events`; `ScoutScreen > appends progress log lines…` |
| R7 | `ScoutScreen > appends progress log lines…` (Running badge after `board_start`) |
| R8 | `ScoutScreen > appends progress log lines and updates board status from IPC events` |
| R9 | `scout-progress > formats keyword_start events`; `ScoutScreen > appends progress log lines…` |
| R10 | `scout-progress > formats matching_* events` |
| R11 | `scout-progress > formats run_complete summary`; `ScoutScreen > shows run_complete summary in log and re-enables controls via IPC` |
| R12 | `ScoutScreen > shows global error on run_error progress event` |
| R13 | `ScoutScreen > renders five date range options` |
| R14 | `scout-settings > returns valid setting value from database` |
| R15 | `scout-settings > falls back to 30d when setting row is missing`; invalid value test |
| R16 | `runs-db > invokes db:query with parameterized SQL…` |
| R17 | `ScoutScreen > renders Scout heading and last run timestamp from database` |
| R18 | `ScoutScreen > shows Last run: Never when no completed runs exist` |
| R19 | `ScoutScreen > refreshes last run after successful scraper:run` |
| R20 | `ScoutScreen > appends progress log lines…` (board list renders Indeed/LinkedIn) |
| R21 | `scout-progress > isBoardErrorLog`; `ScoutScreen > shows inline board error…` |
| R22 | `ScoutScreen > opens selector dialog and submits provideSelector IPC` |
| R23 | `ScoutScreen > opens selector dialog and submits provideSelector IPC` |
| R24 | `ScoutScreen > cancels selector dialog via provideSelector cancelled IPC` |
| R25 | `ScoutScreen > handles ScraperBusyError without entering running state` |
| R26 | `ScoutScreen > shows error result from scraper:run resolve` |
| R27 | `ProgressLog` uses `font-mono` + scroll-into-view (component; log renders in tests) |
| R28 | `ScoutScreen > appends progress log lines…` (lines accumulate within session) |
| R29 | `ScoutScreen > clears progress log on a new scout session` |

## Next step

Re-request **reviewer** sign-off for scout-screen traceability (R5/R7/R11 gaps closed). Do not mark `done` until reviewer approves.
