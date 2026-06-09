# Tasks — scraping-engine

- [x] T1 — Add `playwright` to `package.json` dependencies. Covers: R6.

- [x] T2 — Create `src/main/scraper/types.ts`: `DateRangeKey`, `ScraperRunPayload`, `ScraperRunResult`, `ScraperProvideSelectorPayload`, progress event union, `ScrapedJob`, error classes. Covers: R1, R23, R26.

- [x] T3 — Create `src/main/scraper/url.ts` with exported `sanitizeJobUrl()`. Covers: R20.

- [x] T4 — Write `tests/main/scraper/url.test.ts`: strip utm/ref params, lowercase host, remove trailing slash, reject invalid URLs. Covers: R20.

- [x] T5 — Create `src/main/scraper/dates.ts` with `dateRangeToCutoff()` and `parsePostedDate()`. Covers: R16, R18, R19.

- [x] T6 — Write `tests/main/scraper/dates.test.ts`: all five date ranges; ISO and relative strings; unparseable → null. Covers: R16, R18, R19.

- [x] T7 — Create `tests/fixtures/boards/` HTML files: `with-search-input.html`, `with-heuristic-search.html`, `with-job-cards.html`, `with-pagination.html`, `no-search-input.html`. Covers: R8, R14, R17.

- [x] T8 — Create `src/main/scraper/search-bar.ts`: saved selector first, then six heuristic selectors; returns Playwright `Locator` or null. Covers: R7, R8.

- [x] T9 — Write `tests/main/scraper/search-bar.test.ts`: fixture pages; saved selector wins; cascade finds input; returns null on `no-search-input.html`. Covers: R7, R8.

- [x] T10 — Create `src/main/scraper/job-cards.ts`: card root discovery + per-field extraction; skip cards without title/url. Covers: R14, R15.

- [x] T11 — Write `tests/main/scraper/job-cards.test.ts`: extract all fields from fixture; null optional fields; skip incomplete cards. Covers: R14, R15.

- [x] T12 — Create `src/main/scraper/pagination.ts`: next-page locator cascade + `MAX_PAGES` cap. Covers: R17.

- [x] T13 — Create `src/main/scraper/jobs-db.ts`: `createRun`, `finishRun`, `loadBoards`, `loadActiveKeywords`, `updateBoardSearchSelector`, `urlExists`, `insertJob`. Covers: R2, R3, R4, R11, R21, R22, R24.

- [x] T14 — Write `tests/main/scraper/jobs-db.test.ts` with `:memory:` DB: run row lifecycle; active keywords filter; dedup skip; insert sets status `new` and null score/match_reason. Covers: R2, R4, R21, R22.

- [x] T15 — Create `src/main/scraper/browser.ts`: launch/close Chromium, `goto`, screenshot helper. Covers: R6, R9.

- [x] T16 — Create `src/main/scraper/progress.ts`: typed `emitProgress(webContents, payload)` helpers. Covers: R23, R27.

- [x] T17 — Create `src/main/scraper/run.ts`: orchestrator with busy guard, board×keyword×page loops, search submit + networkidle, selector pause/resume via `provideSelector`, early exit when no boards/keywords. Covers: R1, R5, R6, R9–R13, R17–R19, R23–R25, R28, R29.

- [x] T18 — Write `tests/main/scraper/run.test.ts`: mock browser session; busy error on concurrent run; selector_required pause + provideSelector persist + retry; cancelled selector skips board; pagination stops at cutoff; no-boards/no-keywords early exit. Covers: R5, R9–R12, R17, R18, R28, R29.

- [x] T19 — Export `getMainWindow()` from `src/main/index.ts`; wire progress emitter to window webContents. Covers: R27.

- [x] T20 — Register real handlers in `ipc-handler.ts` for `scraper:run` and `scraper:provideSelector`; remove stub return for `scraper:run`. Covers: R1, R5, R10, R26.

- [x] T21 — Add `scraper:provideSelector` to `ApiChannel` in `preload.ts`. Covers: R26.

- [x] T22 — Update `tests/main/ipc-handler.test.ts`: allowlist includes `scraper:provideSelector`. Covers: R26.

- [x] T23 — Update `docs/architecture.md` IPC table: `scraper:run`, `scraper:provideSelector` implemented; document `scraper:progress` payload types. Covers: R23, R26, R27.

- [x] T24 — Run `npm test` and `npx tsc --noEmit`; both pass. Write traceability map (`R<n>` → test name) to `progress/impl_scraping-engine.md`. Covers: all R.
