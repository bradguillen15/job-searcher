# Implementation — scraping-engine

**Status:** ready for reviewer (reviewer gaps R13/R17/R25/R27 addressed)

**Agent:** implementer  
**Date:** 2026-06-08

## Summary

Implemented the Playwright scraping pipeline in the Electron main process under `src/main/scraper/`. Wired `scraper:run` and `scraper:provideSelector` IPC handlers, `scraper:progress` events via `main-window.ts` + `progress.ts`, and comprehensive unit/integration tests. Added `playwright` dependency. All T1–T24 complete; `./init.sh` green.

## Modules added

| Module | Role |
|--------|------|
| `types.ts` | Payloads, progress union, error classes |
| `url.ts` | `sanitizeJobUrl()` |
| `dates.ts` | `dateRangeToCutoff()`, `parsePostedDate()`, pagination helpers |
| `search-bar.ts` | Saved selector + 6-heuristic cascade, `submitSearch()` |
| `job-cards.ts` | Card discovery + field extraction |
| `pagination.ts` | Next-page heuristics, `MAX_PAGES = 50` |
| `jobs-db.ts` | Run lifecycle, boards/keywords load, dedup insert |
| `browser.ts` | Playwright Chromium launch/teardown |
| `progress.ts` | `webContents.send("scraper:progress", …)` |
| `run.ts` | Orchestrator, busy guard, selector pause/resume |
| `main-window.ts` | `getMainWindow()` (avoids circular import with ipc-handler) |

## Modified

- `ipc-handler.ts` — real scraper handlers
- `preload.ts` — `scraper:provideSelector` in `ApiChannel`
- `index.ts` — re-exports `getMainWindow`, stores window ref
- `package.json` — `playwright`, expanded `test`/`test:main` scripts
- `docs/architecture.md` — IPC table + payload docs

## Traceability (R → test)

| Req | Test(s) |
|-----|---------|
| R1 | `runScraper orchestrator` suite; IPC wired in `ipc-handler.ts` |
| R2 | `createRun inserts row with NULL finished_at` |
| R3 | `loadBoards returns all boards` |
| R4 | `loadActiveKeywords returns only active keywords` |
| R5 | `throws ScraperBusyError on concurrent run` |
| R6 | `browser.ts` + Playwright fixture tests (`search-bar`, `job-cards`) |
| R7 | `prefers saved selector over heuristics` |
| R8 | `falls back to heuristic cascade`; `returns null when no search input exists` |
| R9 | `emits selector_required and resumes with provided selector` |
| R10 | `emits selector_required and resumes with provided selector` |
| R11 | `emits selector_required and resumes with provided selector` (DB `search_selector` persisted) |
| R12 | `skips board when selector is cancelled` |
| R13 | `submitSearch` suite (`clears field…`, `falls back to submit control…`) in `search-bar.test.ts` |
| R14 | `extracts complete job cards and skips incomplete ones` |
| R15 | `extracts complete job cards and skips incomplete ones` |
| R16 | `dateRangeToCutoff` (all five ranges) |
| R17 | `findNextPageLocator finds rel=next…`; `goToNextPage clicks next control…` in `pagination.test.ts`; `shouldStopPagination` in `dates.test.ts` |
| R18 | `isBeforeCutoff returns true when posted date is before cutoff` |
| R19 | `shouldStopPagination ignores unparseable dates`; `returns null for unparseable strings` |
| R20 | `sanitizeJobUrl` suite (6 tests) |
| R21 | `insertJob skips duplicate URLs` |
| R22 | `insertJob sets status new with null score and match_reason` |
| R23 | `emits lifecycle progress events`; `selector_required` + `log` in cancel-selector test |
| R24 | `finishRun sets finished_at and totals`; `completes with zero jobs…` early-exit tests |
| R25 | `emits run_error and returns error on unrecoverable failure` in `run.test.ts` |
| R26 | `accepts scraper:provideSelector` |
| R27 | `emitProgress` + `createProgressEmitter` suite in `progress.test.ts` |
| R28 | `completes with zero jobs when no boards exist` |
| R29 | `completes with zero jobs when no active keywords exist` |

## Notes for reviewer

- Reviewer gaps R13/R17/R25/R27 addressed with dedicated tests (see traceability table).
- `setSelectorTimeoutMs()` exported for fast tests; production default remains 5000 ms.
- `setBrowserFactory()` exported for orchestrator mocks in `run.test.ts`.
- Feature status intentionally left `in_progress` per implementer protocol.
