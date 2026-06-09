# Design — pipeline-screen

## Scope

This feature replaces the `PipelineScreen` placeholder at `/pipeline` with a
kanban view of active pipeline jobs: six status columns, job cards showing
title/company/score/last activity date, inline quick-add note, and status
change controls to move cards between columns.

**In scope:** pipeline-specific types and SQL, pure grouping/sort helpers,
kanban UI components, Vitest tests.

**Out of scope:** drag-and-drop between columns, new main-process IPC channels,
pagination/virtualization, bulk actions, scheduled activities (`scheduled_at`),
Settings persistence for default pipeline view, jobs with `status` `'new'` (they
remain on Results only).

Depends on `navigation-layout` (route + shell), `database-schema` (`jobs`,
`activities`), and `results-screen` (`JobStatus`, `JobWithMeta`, `Activity`,
`jobs-db.ts` mutations, score badge tiers, `AddNoteForm` patterns).

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `src/renderer/types/job.ts` | Modify | Add `PIPELINE_STATUSES`, `PipelineJobWithMeta` |
| `src/renderer/lib/jobs-db.ts` | Modify | Add `listPipelineJobsWithMeta` with `last_activity_at` aggregate |
| `src/renderer/lib/pipeline-grouping.ts` | Create | Group jobs into columns; per-column sort by last activity |
| `src/renderer/components/pipeline/PipelineColumn.tsx` | Create | Single status column header + card list + empty placeholder |
| `src/renderer/components/pipeline/PipelineJobCard.tsx` | Create | Card summary, last activity, quick-add, status buttons |
| `src/renderer/components/pipeline/QuickAddActivity.tsx` | Create | Toggle + inline note form (reuse validation pattern from Results) |
| `src/renderer/components/pipeline/PipelineStatusButtons.tsx` | Create | Status picker scoped to `PIPELINE_STATUSES` |
| `src/renderer/screens/PipelineScreen.tsx` | Modify | Load pipeline jobs; compose kanban; orchestrate mutations |
| `tests/renderer/jobs-db.test.ts` | Modify | Pipeline list SQL, `last_activity_at` mapping |
| `tests/renderer/pipeline-grouping.test.ts` | Create | Column grouping and sort order |
| `tests/renderer/PipelineScreen.test.tsx` | Create | End-to-end kanban UI behavior |

Reuse without duplication where possible:

- `getScoreTier`, `scoreBadgeClassName` from `types/job.ts`
- `addActivity`, `updateJobStatus` from `jobs-db.ts`
- shadcn `Button`, `Badge`, `Textarea`, `Card` (add `card` via shadcn if not present)

No changes to `src/main/` unless required by unrelated work; all data access via
existing `db:query`.

## Component tree

```
<PipelineScreen>                          ← route `/pipeline`
  <header> Pipeline + job count summary
  {error && <Alert />}
  {empty ? <EmptyState /> : (
    <div className="flex gap-4 overflow-x-auto">
      {PIPELINE_STATUSES.map(status => (
        <PipelineColumn
          status
          label
          jobs={grouped[status]}
          quickAddJobId
          onQuickAddToggle
          onAddNote
          onStatusChange
        />
      ))}
    </div>
  )}
```

`PipelineJobCard`:

```
<Card>
  <title + company />
  <ScoreBadge score />
  <last activity date | "No activity" />
  <QuickAddActivity expanded onSubmit onCancel />
  <PipelineStatusButtons current onSelect />
</Card>
```

State owned by `PipelineScreen`:

- `jobs: PipelineJobWithMeta[]` — pipeline subset from DB (R2–R3)
- `loading: boolean`
- `error: string | null`
- `quickAddJobId: number | null` — at most one inline quick-add form open

Grouping and per-column sort run in memory via `pipeline-grouping.ts` whenever
`jobs` changes (R5–R6). No re-fetch on grouping alone.

## Types

```ts
// src/renderer/types/job.ts (additions)
export const PIPELINE_STATUSES: readonly JobStatus[] = [
  "applying",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
];

export interface PipelineJobWithMeta extends JobWithMeta {
  last_activity_at: string | null;
}

export function isPipelineStatus(status: JobStatus): boolean;
```

`PIPELINE_STATUSES` order is the canonical left-to-right column order (R4).

## Data access (`db:query`)

### List pipeline jobs with last activity

```ts
export const LIST_PIPELINE_JOBS_SQL = `…`; // see below

export async function listPipelineJobsWithMeta(): Promise<PipelineJobWithMeta[]>;
```

SQL:

```sql
SELECT
  j.id,
  j.board_id,
  j.keyword_id,
  j.run_id,
  j.title,
  j.company,
  j.location,
  j.posted_date,
  j.description,
  j.url,
  j.score,
  j.match_reason,
  j.status,
  j.scraped_at,
  b.name AS board_name,
  k.keyword AS keyword_text,
  la.last_activity_at
FROM jobs j
INNER JOIN boards b ON j.board_id = b.id
INNER JOIN keywords k ON j.keyword_id = k.id
LEFT JOIN (
  SELECT job_id, MAX(created_at) AS last_activity_at
  FROM activities
  GROUP BY job_id
) la ON la.job_id = j.id
WHERE j.status IN (?, ?, ?, ?, ?, ?)
ORDER BY j.status, la.last_activity_at IS NULL, la.last_activity_at DESC, j.title ASC
```

Params: the six `PIPELINE_STATUSES` values in column order.

Map rows with existing `mapJobRow` logic plus `last_activity_at` coercion to
`string | null`. Validate `status` is in `PIPELINE_STATUSES`; skip or coerce
defensively if an unexpected status slips through the `WHERE` clause.

### Mutations (reuse `jobs-db.ts`)

Quick-add note (R12): `addActivity({ jobId, type: "note", notes: trimmed })`.

Status change (R15):

1. `updateJobStatus(jobId, nextStatus)`
2. `addActivity({ jobId, type: "status_change", notes: \`Status set to ${nextStatus}\` })`
3. Patch local `jobs`: update `status` and set `last_activity_at` to the new
   activity's `created_at` (from `addActivity` return value).

No separate re-query after mutation unless `addActivity` fails to return
`created_at`; prefer patching from the insert response for instant UI update.

## Client-side grouping (`pipeline-grouping.ts`)

```ts
export type PipelineColumnMap = Record<
  (typeof PIPELINE_STATUSES)[number],
  PipelineJobWithMeta[]
>;

export function groupPipelineJobs(
  jobs: PipelineJobWithMeta[]
): PipelineColumnMap;

export function sortJobsInColumn(
  jobs: PipelineJobWithMeta[]
): PipelineJobWithMeta[];
```

`groupPipelineJobs`:

- Initialize empty arrays for each `PIPELINE_STATUSES` entry.
- Push each job into `columns[job.status]`.
- Sort each column with `sortJobsInColumn`.

`sortJobsInColumn` (R6):

- Jobs with non-null `last_activity_at` first, descending by timestamp.
- Jobs with `last_activity_at === null` last, stable-sorted by `title` ascending.

## UI details

### Page layout

- Heading: **Pipeline** (`text-2xl font-semibold`).
- Subheading: `{totalCount} active jobs` (pipeline jobs only).
- Kanban row: horizontal scroll on narrow viewports (`overflow-x-auto`).
- Each column: fixed min-width (~240px), `flex-shrink-0`, subtle column
  background (`bg-muted/30`), rounded border.
- Column header: status label + count badge.

### Job card

- Compact card (`Card` + `p-3`): title truncated to one line, company muted.
- Score badge: reuse results-screen tier colors via `getScoreTier` /
  `scoreBadgeClassName`; `NULL` score shows **—**.
- Last activity: `font-mono text-xs` date from `last_activity_at`; **No activity**
  when null (R8).
- **Quick add** button toggles inline `Textarea` + **Save** / **Cancel**; only
  one card's form open at a time (`quickAddJobId`).
- Status buttons: horizontal wrap of shadcn `Button` size `sm`; current status
  uses `variant="default"`.

### Empty states

- No pipeline jobs (R9): icon + "No jobs in your pipeline yet. On Results,
  change a job's status to Applying or beyond to track it here."
- Empty column (R10): muted "No jobs" centered in column body.

### Error handling

Mirror `ResultsScreen`: `Alert` or inline error banner on `JobsDbError`; loading
skeleton or spinner while fetching.

## Discarded alternative: filterable list view (tabs)

Single vertical list with status filter tabs (same pattern as Results) instead of
kanban columns.

**Discarded because:**

1. ROADMAP lists kanban first; sidebar nav already uses a Kanban icon for Pipeline.
2. Grouped columns make pipeline progression visible at a glance without tab switching.
3. Status change controls still move jobs between logical groups when columns update.

## Discarded alternative: drag-and-drop between columns

Use `@dnd-kit/core` or HTML5 DnD to move cards across columns; drop updates status.

**Discarded because:**

1. Adds a new dependency and complex pointer/keyboard test surface.
2. Status button controls (R14–R15) satisfy move-between-columns without DnD.
3. Matches incremental scope of prior screens (no new deps in feature_list).

## Discarded alternative: reload full job list after every mutation

Re-invoke `listPipelineJobsWithMeta()` after each note or status change.

**Discarded because:**

1. Local patch from `addActivity` return is sufficient for `last_activity_at`.
2. Avoids extra IPC round-trips; status change only moves one card between columns.
3. Full reload can be added later if activity aggregation logic grows.

## Discarded alternative: dedicated `jobs:pipeline` IPC channel

Typed main-process handler returning pipeline rows with activity aggregate.

**Discarded because:**

1. `db:query` is the established pattern (`jobs-db.ts`, `boards-db.ts`).
2. Aggregate SQL stays visible in renderer helper; no duplicate handler surface.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `jobs-db.test.ts` (extend) | R2, R3, R16, R18 — pipeline `WHERE`/`LEFT JOIN` SQL, `last_activity_at` mapping, null when no activities |
| `pipeline-grouping.test.ts` | R5, R6 — jobs land in correct column; sort by last activity desc, nulls last |
| `PipelineScreen.test.tsx` | R1, R4, R7, R8, R9, R10, R11, R12, R13, R14, R15, R17 — mock `window.api.invoke`, fixture pipeline jobs, assert column placement, last activity labels, quick-add flow, status move between columns, empty states |

`PipelineScreen.test.tsx` patterns:

- Seed mock `db:query` for `LIST_PIPELINE_JOBS_SQL` substring with mixed statuses.
- Assert six column headers present with correct labels.
- Job in **Applying** column appears only there; not in **Applied**.
- Jobs within column ordered by `last_activity_at` (newer first).
- Null `last_activity_at` → **No activity** text.
- Quick-add: non-empty note → INSERT invoked; card shows updated date; empty → validation, no INSERT.
- Status button click → UPDATE + INSERT; card moves to new column DOM-wise.
- Zero pipeline jobs → global empty state message.
- Column with zero jobs → column empty placeholder.

Pure helpers (`groupPipelineJobs`, `sortJobsInColumn`) tested without jsdom in
`pipeline-grouping.test.ts`.
