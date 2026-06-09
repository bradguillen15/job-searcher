# Review — feature scraping-engine

**Verdict:** APPROVED

## `./init.sh`

Green (exit 0). Main-process tests: 91/91 pass. Vitest renderer tests pass. TypeScript compiles.

## Requirement ↔ test traceability

- R1: [x] covered by `runScraper orchestrator` suite (`tests/main/scraper/run.test.ts`) + `accepts scraper:run` (`tests/main/ipc-handler.test.ts`)
- R2: [x] covered by `createRun inserts row with NULL finished_at` (`tests/main/scraper/jobs-db.test.ts`)
- R3: [x] covered by `loadBoards returns all boards` (`tests/main/scraper/jobs-db.test.ts`)
- R4: [x] covered by `loadActiveKeywords returns only active keywords` (`tests/main/scraper/jobs-db.test.ts`)
- R5: [x] covered by `throws ScraperBusyError on concurrent run` (`tests/main/scraper/run.test.ts`)
- R6: [x] covered by Playwright fixture tests (`resolveSearchInput > setup browser` + `page.goto` in `tests/main/scraper/search-bar.test.ts`; same pattern in `job-cards.test.ts`)
- R7: [x] covered by `prefers saved selector over heuristics` (`tests/main/scraper/search-bar.test.ts`)
- R8: [x] covered by `falls back to heuristic cascade` and `returns null when no search input exists` (`tests/main/scraper/search-bar.test.ts`)
- R9: [x] covered by `emits selector_required and resumes with provided selector` (`tests/main/scraper/run.test.ts`)
- R10: [x] covered by `emits selector_required and resumes with provided selector` (`tests/main/scraper/run.test.ts`)
- R11: [x] covered by `emits selector_required and resumes with provided selector` (DB `search_selector` assertion in `tests/main/scraper/run.test.ts`)
- R12: [x] covered by `skips board when selector is cancelled` (`tests/main/scraper/run.test.ts`)
- R13: [x] covered by `submitSearch` suite (`clears field, types keyword, presses Enter, and waits for networkidle`; `falls back to submit control when Enter does not reach networkidle quickly`) in `tests/main/scraper/search-bar.test.ts`
- R14: [x] covered by `extracts complete job cards and skips incomplete ones` (`tests/main/scraper/job-cards.test.ts`)
- R15: [x] covered by `extracts complete job cards and skips incomplete ones` (`tests/main/scraper/job-cards.test.ts`)
- R16: [x] covered by `dateRangeToCutoff` five-range tests (`tests/main/scraper/dates.test.ts`)
- R17: [x] covered by `findNextPageLocator finds rel=next control on fixture page` and `goToNextPage clicks next control and waits for updated results` (`tests/main/scraper/pagination.test.ts` using `with-pagination.html`); pagination gate logic via `shouldStopPagination` helpers in `tests/main/scraper/dates.test.ts`
- R18: [x] covered by `shouldStopPagination stops when any parseable date is before cutoff` (`tests/main/scraper/dates.test.ts`)
- R19: [x] covered by `shouldStopPagination ignores unparseable dates` and `returns null for unparseable strings` (`tests/main/scraper/dates.test.ts`)
- R20: [x] covered by `sanitizeJobUrl` suite (6 tests, `tests/main/scraper/url.test.ts`)
- R21: [x] covered by `insertJob skips duplicate URLs` (`tests/main/scraper/jobs-db.test.ts`)
- R22: [x] covered by `insertJob sets status new with null score and match_reason` (`tests/main/scraper/jobs-db.test.ts`)
- R23: [x] covered by `emits lifecycle progress events` (`board_start`, `keyword_start`, `board_done`, `run_complete`); `selector_required` in selector-resume test; `log` in cancel-selector test; `run_error` in unrecoverable-failure test (`tests/main/scraper/run.test.ts`)
- R24: [x] covered by `finishRun sets finished_at and totals` + early-exit run tests (`tests/main/scraper/jobs-db.test.ts`, `run.test.ts`)
- R25: [x] covered by `emits run_error and returns error on unrecoverable failure` (`tests/main/scraper/run.test.ts`) — asserts `run_error` event, `{ error: string }` return, and `finished_at` set on `runs` row
- R26: [x] covered by `accepts scraper:provideSelector` (`tests/main/ipc-handler.test.ts`)
- R27: [x] covered by `emitProgress` + `createProgressEmitter` suite in `tests/main/scraper/progress.test.ts` — asserts `webContents.send("scraper:progress", payload)`; null/destroyed webContents no-op
- R28: [x] covered by `completes with zero jobs when no boards exist` (`tests/main/scraper/run.test.ts`)
- R29: [x] covered by `completes with zero jobs when no active keywords exist` (`tests/main/scraper/run.test.ts`)

**Coverage gap count:** 0 — all R1–R29 have at least one verifying test.

## Tasks complete

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
- T14: [x]
- T15: [x]
- T16: [x]
- T17: [x]
- T18: [x] — all listed scenarios covered; note T18 description mentions “pagination stops at cutoff” as a `run.test.ts` integration case, but R17/R18 cutoff behavior is verified at unit level (`pagination.test.ts` + `dates.test.ts`) rather than end-to-end in the orchestrator mock. Acceptable for approval.
- T19: [x]
- T20: [x]
- T21: [x]
- T22: [x]
- T23: [x]
- T24: [x]

All tasks `[x]` in `specs/scraping-engine/tasks.md`. Traceability table in `progress/impl_scraping-engine.md` matches test suite.

## Architecture & conventions

- Scraper pipeline correctly lives in `src/main/scraper/` (main-process only). IPC handlers wired in `ipc-handler.ts`; preload allowlist updated.
- `playwright` dependency justified in spec T1.
- `docs/architecture.md` IPC table updated for `scraper:run`, `scraper:provideSelector`, `scraper:progress` — good.
- **Minor (non-blocking):** `src/main/scraper/*` modules not listed in the `## Module map (src/main/)` table (only IPC rows added). Worth adding on a future docs pass.

## Checkpoints

- C1: [x] Harness files present; `./init.sh` exits 0
- C2: [x] Single `in_progress` feature (`scraping-engine`); all tests pass
- C3: [x] Code respects layers; `playwright` declared; no stray debug logs observed in scraper modules
- C4: [x] Test files exist for all major scraper modules (`url`, `dates`, `search-bar`, `job-cards`, `pagination`, `jobs-db`, `run`, `progress`); `:memory:` SQLite used in DB tests
- C5: [ ] Session not closed (expected — feature still `in_progress`; leader/implementer close protocol pending)
- C6: [x] Spec folder complete and EARS-compliant; tasks all `[x]`; R1–R29 test coverage verified

## Required changes

None. Prior gaps (R13, R17, R25, R27, R23 partial) resolved in this revision.

## Re-review notes (2026-06-08)

Added test files since prior CHANGES_REQUESTED:

- `tests/main/scraper/search-bar.test.ts` — `submitSearch` describe block (R13)
- `tests/main/scraper/pagination.test.ts` — fixture-driven heuristics (R17)
- `tests/main/scraper/progress.test.ts` — `emitProgress` / `createProgressEmitter` (R27)
- `tests/main/scraper/run.test.ts` — `emits run_error and returns error on unrecoverable failure` (R25); `log` assertion in cancel-selector test (R23)

Test count increased from 79 → 91. `./init.sh` green.
