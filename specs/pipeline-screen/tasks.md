# Tasks — pipeline-screen

- [x] T1 — Add shadcn `card` component if not already present via `pnpm dlx shadcn@latest add card`. Covers: R17.

- [x] T2 — Extend `src/renderer/types/job.ts` with `PIPELINE_STATUSES`, `PipelineJobWithMeta`, and `isPipelineStatus`. Covers: R4, R5.

- [x] T3 — Extend `src/renderer/lib/jobs-db.ts` with `LIST_PIPELINE_JOBS_SQL`, `listPipelineJobsWithMeta`, and `last_activity_at` row mapping per `design.md`. Covers: R2, R3, R16, R18.

- [x] T4 — Create `src/renderer/lib/pipeline-grouping.ts` with `groupPipelineJobs`, `sortJobsInColumn`, and `PipelineColumnMap`. Covers: R5, R6.

- [x] T5 — Create `src/renderer/components/pipeline/PipelineStatusButtons.tsx`: one button per `PIPELINE_STATUSES` value; highlight current status. Covers: R14.

- [x] T6 — Create `src/renderer/components/pipeline/QuickAddActivity.tsx`: **Quick add** toggle, inline textarea, Save/Cancel, empty-trim validation. Covers: R11, R13.

- [x] T7 — Create `src/renderer/components/pipeline/PipelineJobCard.tsx`: title, company, score badge, last activity date or **No activity**, `QuickAddActivity`, `PipelineStatusButtons`. Covers: R7, R8, R11, R14.

- [x] T8 — Create `src/renderer/components/pipeline/PipelineColumn.tsx`: column header with label and count, card list, column empty placeholder. Covers: R4, R10.

- [x] T9 — Rewrite `src/renderer/screens/PipelineScreen.tsx`: load pipeline jobs on mount; render kanban columns; orchestrate quick-add and status mutations with local state patch; global empty and error states; job count summary. Covers: R1, R9, R12, R15, R16.

- [x] T10 — Extend `tests/renderer/jobs-db.test.ts`: verify pipeline list SQL (`WHERE` statuses, `LEFT JOIN` aggregate), `last_activity_at` present/null mapping, error propagation. Covers: R2, R3, R16, R18.

- [x] T11 — Write `tests/renderer/pipeline-grouping.test.ts`: column assignment and per-column sort (dated desc, nulls last). Covers: R5, R6.

- [x] T12 — Write `tests/renderer/PipelineScreen.test.tsx`: route render, six columns, card fields, last activity labels, global/column empty states, quick-add success/validation, status change moves card between columns. Covers: R1, R4, R7, R8, R9, R10, R12, R13, R15, R17.

- [x] T13 — Run `pnpm test` and `npx tsc --noEmit`; both pass with zero errors. Write traceability map (`R<n>` → test name) to `progress/impl_pipeline-screen.md`. Covers: all R.
