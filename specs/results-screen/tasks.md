# Tasks — results-screen

- [x] T1 — Add shadcn components: `slider`, `tabs`, `badge`, `collapsible`, `textarea` via `pnpm dlx shadcn@latest add …`. Covers: R34.

- [x] T2 — Create `src/renderer/types/job.ts` with `JobStatus`, `JOB_STATUSES`, `StatusTabKey`, `JobWithMeta`, `Activity`, `getScoreTier`, `scoreBadgeClassName`, and `truncateDescription`. Covers: R19, R20, R22.

- [x] T3 — Create `src/renderer/lib/jobs-db.ts` with `listJobsWithMeta`, `listActivities`, `addActivity`, `updateJobStatus`, `JobsDbError`, and parameterized SQL per `design.md`. Covers: R2, R23, R27, R29, R33, R35.

- [x] T4 — Create `src/renderer/lib/results-filters.ts` with `distinctKeywords` and `filterJobs` implementing combined status, score, and keyword filtering. Covers: R6, R7, R11, R12, R13, R14, R15, R16, R17, R37.

- [x] T5 — Create `src/renderer/components/results/StatusTabs.tsx`: All + seven status tabs using shadcn `Tabs`. Covers: R5, R6, R7, R8.

- [x] T6 — Create `src/renderer/components/results/ScoreThresholdSlider.tsx`: range 0–100, label **Min score**, show **Any** at 0. Covers: R9, R10.

- [x] T7 — Create `src/renderer/components/results/KeywordFilterChips.tsx`: toggle chips from keyword list; multi-select OR filter. Covers: R14, R15, R16.

- [x] T8 — Create `src/renderer/components/results/ScoreBadge.tsx` (or inline in JobCard): render numeric score or **—** with tier colors from R19–R20. Covers: R19, R20.

- [x] T9 — Create `src/renderer/components/results/ActivityLog.tsx`: list activities with formatted timestamps; empty state message. Covers: R24, R25.

- [x] T10 — Create `src/renderer/components/results/StatusChangeButtons.tsx`: one button per `JobStatus`; highlight current. Covers: R26.

- [x] T11 — Create `src/renderer/components/results/AddNoteForm.tsx`: textarea, **Add note**, empty-trim validation. Covers: R28, R30.

- [x] T12 — Create `src/renderer/components/results/JobCard.tsx`: collapsed summary (R18), expandable body with snippet, match reason (R31), external link (R32), status buttons, activity log, note form; collapsible behavior (R21, R36). Covers: R18, R21, R22, R26, R28, R31, R32, R36.

- [x] T13 — Rewrite `src/renderer/screens/ResultsScreen.tsx`: load jobs on mount; wire filters; render filtered ranked list; lazy-load activities on expand; orchestrate status/note mutations; empty and error states; job count summary. Covers: R1, R3, R4, R17, R27, R29, R33, R37.

- [x] T14 — Wire external job URL open: ensure `fs:openPath` (or documented handler branch) opens `http`/`https` URLs via `shell.openExternal` if not already supported. Covers: R32.

- [x] T15 — Write `tests/renderer/jobs-db.test.ts`: mock `window.api.invoke`; verify list JOIN SQL and sort; activity list/insert; status update params; db error propagation. Covers: R2, R23, R27, R29, R33, R35.

- [x] T16 — Write `tests/renderer/results-filters.test.ts`: status tab, threshold (0 vs >0, null scores), keyword chips, combined filters. Covers: R6, R7, R11, R12, R13, R14, R15, R16, R17, R37.

- [x] T17 — Write `tests/renderer/ResultsScreen.test.tsx`: route render, ranked order, badge colors, filter tabs, slider, chips, expand/collapse, activity log, status change flow, add note validation, empty states, match reason display. Covers: R1, R3, R4, R5, R8, R9, R10, R18, R19, R20, R21, R24, R25, R26, R28, R30, R31, R34, R36.

- [x] T18 — Run `pnpm test` and `npx tsc --noEmit`; both pass with zero errors. Write traceability map (`R<n>` → test name) to `progress/impl_results-screen.md`. Covers: all R.
