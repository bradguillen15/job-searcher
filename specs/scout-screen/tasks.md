# Tasks — scout-screen

- [x] T1 — Add shadcn components `toggle-group` and `scroll-area` via `pnpm dlx shadcn@latest add …` (skip if already present). Covers: R13, R27.

- [x] T2 — Create `src/renderer/types/scout.ts` with `DateRangeKey`, `DATE_RANGE_OPTIONS`, `CompletedRun`, `BoardRunStatus`, `LogLine`, `SelectorRequiredState`. Create `src/renderer/types/progress.ts` with renderer-safe `ProgressEvent` union mirroring main scraper event shapes used by this screen. Covers: R6–R12, R22.

- [x] T3 — Create `src/renderer/lib/scout-progress.ts` with pure functions `formatProgressEvent(event): string | null`, `isBoardErrorLog(event): boolean`, and `extractBoardErrorMessage(message): string`. Covers: R6, R9, R10, R11, R21.

- [x] T4 — Create `src/renderer/lib/runs-db.ts` with `getLastCompletedRun()` using parameterized `db:query` and typed error handling. Covers: R16, R17, R18, R19.

- [x] T5 — Create `src/renderer/lib/scout-settings.ts` with `loadDefaultDateRange()` reading `scout.default_date_range` from `settings` with `30d` fallback. Covers: R14, R15.

- [x] T6 — Create `src/renderer/hooks/useScraperProgress.ts`: subscribe on mount, unsubscribe on unmount, delegate to caller-supplied handlers per event type. Covers: R5, R6–R12, R21.

- [x] T7 — Create `src/renderer/components/scout/DateRangeSelector.tsx`: five-option control, disabled prop, accessible labels. Covers: R4, R13.

- [x] T8 — Create `src/renderer/components/scout/ProgressLog.tsx`: monospace `ScrollArea`, timestamped lines, auto-scroll when pinned to bottom. Covers: R6, R27, R28.

- [x] T9 — Create `src/renderer/components/scout/BoardStatusList.tsx`: render boards with phase badge, counts, inline destructive error text. Covers: R7, R8, R20, R21.

- [x] T10 — Create `src/renderer/components/scout/SelectorRequiredDialog.tsx`: screenshot preview, selector input, Submit/Cancel invoking callbacks. Covers: R22, R23, R24.

- [x] T11 — Rewrite `src/renderer/screens/ScoutScreen.tsx`: load boards, default date range, last run on mount; wire **Run Scout** to `scraper:run`; integrate hook + child components; handle `ScraperBusyError`, `{ error }` results, and `boardErrors` merge; clear session state on new run. Covers: R1, R2, R3, R4, R11, R12, R19, R25, R26, R29.

- [x] T12 — Write `tests/renderer/scout-progress.test.ts`: formatter output for `log`, `keyword_start`, matching events, `run_complete`; board-error detection. Covers: R6, R9, R10, R11, R21.

- [x] T13 — Write `tests/renderer/runs-db.test.ts`: mock `window.api.invoke`; verify SQL/params; returns row or null. Covers: R16, R17, R18.

- [x] T14 — Write `tests/renderer/scout-settings.test.ts`: valid setting honored; missing and invalid values fall back to `30d`. Covers: R14, R15.

- [x] T15 — Write `tests/renderer/ScoutScreen.test.tsx`: renders heading and last-run; date range options; run invokes `scraper:run` with selected range; progress events append log and update board status; inline board error; `run_error` and busy handling; selector dialog submit/cancel IPC; log cleared on second run. Covers: R2–R8, R11–R13, R19–R26, R28, R29.

- [x] T16 — Update `tests/renderer/AppShell.test.tsx`: scout route asserts Scout UI (heading) instead of placeholder text `"Scout screen"`. Covers: R1.

- [x] T17 — Run `pnpm test` and `npx tsc --noEmit`; both pass. Write traceability map (`R<n>` → test name) to `progress/impl_scout-screen.md`. Covers: all R.
