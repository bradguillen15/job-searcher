# Implementation — pipeline-screen

**Status:** `in_progress` (awaiting reviewer)

**Agent:** implementer  
**Date:** 2026-06-08

## Summary

Implemented the Pipeline kanban view at `/pipeline`: six status columns (Applying through Rejected), job cards with title/company/score badge/last activity date, inline quick-add notes, and status change controls that move cards between columns with local state patching. Pipeline jobs load via parameterized `LIST_PIPELINE_JOBS_SQL` with `last_activity_at` aggregate.

## Verification

- `./init.sh` — green (all tests + tsc)

## Traceability (R → test)

| Req | Test |
|-----|------|
| R1 | `PipelineScreen > renders Pipeline heading and active job count`; `AppShell > shows screen content for each route` |
| R2 | `jobs-db > listPipelineJobsWithMeta > invokes db:query with pipeline WHERE and LEFT JOIN aggregate SQL` |
| R3 | `jobs-db > listPipelineJobsWithMeta > maps last_activity_at when present and null when absent` |
| R4 | `PipelineScreen > renders six kanban columns with correct labels` |
| R5 | `pipeline-grouping > groupPipelineJobs > places each job in the column matching its status`; `PipelineScreen > places jobs only in their status column` |
| R6 | `pipeline-grouping > sortJobsInColumn > orders dated jobs by last_activity_at descending with nulls last`; `PipelineScreen > orders jobs within column by last_activity_at descending` |
| R7 | `PipelineScreen > displays score badge and last activity date on cards` |
| R8 | `PipelineScreen > shows No activity when last_activity_at is null` |
| R9 | `PipelineScreen > shows global empty state when no pipeline jobs exist` |
| R10 | `PipelineScreen > shows column empty placeholder when column has no jobs` |
| R11 | `PipelineScreen > quick-add inserts note and updates last activity date` |
| R12 | `PipelineScreen > quick-add inserts note and updates last activity date` |
| R13 | `PipelineScreen > shows validation for empty quick-add note` |
| R14 | `PipelineScreen > renders status change buttons for each pipeline status` |
| R15 | `PipelineScreen > moves card to new column on status change` |
| R16 | `jobs-db > listPipelineJobsWithMeta > throws JobsDbError when db:query returns error`; `PipelineScreen > surfaces database errors without crashing` |
| R17 | `results-styling > uses Tailwind and shadcn only; no CSS Modules or CSS-in-JS` (pipeline paths included) |
| R18 | `jobs-db > listPipelineJobsWithMeta > invokes db:query with pipeline WHERE…` (params `[...PIPELINE_STATUSES]`); `jobs-db > updateJobStatus` (existing parameterized pattern) |

## Files touched

- `src/renderer/types/job.ts`
- `src/renderer/lib/jobs-db.ts`
- `src/renderer/lib/pipeline-grouping.ts`
- `src/renderer/components/pipeline/*.tsx` (4 components)
- `src/renderer/components/ui/card.tsx` (shadcn)
- `src/renderer/screens/PipelineScreen.tsx`
- `tests/renderer/jobs-db.test.ts`
- `tests/renderer/pipeline-grouping.test.ts`
- `tests/renderer/PipelineScreen.test.tsx`
- `tests/renderer/AppShell.test.tsx` (Pipeline route assertion)
- `tests/renderer/results-styling.test.ts` (pipeline paths for R17)
- `feature_list.json` (status → `in_progress`)
- `specs/pipeline-screen/tasks.md` (all `[x]`)

## Notes

- Local state patch after note/status mutations avoids full re-fetch; `last_activity_at` updated from `addActivity` return value.
- Only one quick-add form open at a time via `quickAddJobId` state in `PipelineScreen`.
