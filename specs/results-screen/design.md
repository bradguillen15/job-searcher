# Design — results-screen

## Scope

This feature replaces the `ResultsScreen` placeholder at `/results` with the
primary job triage UI: ranked list, status tabs, score threshold slider,
keyword chips, and expandable job cards with description snippets, activity
log, status controls, and note entry.

**In scope:** renderer types, `db:query` helpers, pure filter/sort helpers,
UI components, Vitest tests.

**Out of scope:** new main-process IPC channels (except using existing
`db:query` and `fs:openPath` stub/open behavior), Pipeline kanban layout
(`pipeline-screen`), Settings persistence for default filters, bulk actions,
pagination/virtualization.

Depends on `navigation-layout` (route + shell), `database-schema` (`jobs`,
`activities`, FK joins), `scout-screen` (jobs populated after scout runs), and
`ai-matching` (`score`, `match_reason` populated on matched jobs).

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `src/renderer/types/job.ts` | Create | `JobStatus`, `JobWithMeta`, `Activity`, score tier helpers |
| `src/renderer/lib/jobs-db.ts` | Create | List jobs, update status, list/create activities |
| `src/renderer/lib/results-filters.ts` | Create | Pure client-side filter/sort/chip helpers |
| `src/renderer/components/results/StatusTabs.tsx` | Create | All + seven status tabs |
| `src/renderer/components/results/ScoreThresholdSlider.tsx` | Create | 0–100 slider with live label |
| `src/renderer/components/results/KeywordFilterChips.tsx` | Create | Toggle chips per distinct keyword |
| `src/renderer/components/results/JobCard.tsx` | Create | Collapsed summary + expandable body |
| `src/renderer/components/results/ActivityLog.tsx` | Create | Activity list for expanded card |
| `src/renderer/components/results/StatusChangeButtons.tsx` | Create | Pipeline status picker |
| `src/renderer/components/results/AddNoteForm.tsx` | Create | Note textarea + submit |
| `src/renderer/screens/ResultsScreen.tsx` | Modify | Compose filters + list; orchestrate load/mutations |
| `src/renderer/components/ui/slider.tsx` | Add (shadcn) | Score threshold control |
| `src/renderer/components/ui/tabs.tsx` | Add (shadcn) | Status filter tabs |
| `src/renderer/components/ui/badge.tsx` | Add (shadcn) | Score badge |
| `src/renderer/components/ui/collapsible.tsx` | Add (shadcn) | Expand/collapse job cards |
| `src/renderer/components/ui/textarea.tsx` | Add (shadcn) | Note input |
| `tests/renderer/jobs-db.test.ts` | Create | SQL helpers, mutations |
| `tests/renderer/results-filters.test.ts` | Create | Filter composition logic |
| `tests/renderer/ResultsScreen.test.tsx` | Create | End-to-end UI behavior |

No changes to `src/main/` unless `fs:openPath` stub must be wired for R32;
see [External URL](#external-url-r32) below.

## Component tree

```
<ResultsScreen>                         ← route `/results`
  <header> Results + job count summary
  <StatusTabs value onChange />
  <ScoreThresholdSlider value onChange />
  <KeywordFilterChips keywords selected onToggle />
  {error && <Alert />}
  {empty ? <EmptyState /> : (
    <ul>
      {filteredJobs.map(job => (
        <JobCard
          job
          expanded={expandedId === job.id}
          onToggleExpand
          onStatusChange
          onAddNote
        />
      ))}
    </ul>
  )}
```

`JobCard` expanded body:

```
<Collapsible>
  <summary row: title, company, score badge, meta, chevron />
  <CollapsibleContent>
    <description snippet />
    {match_reason && <MatchReason />}
    <a Open posting /> 
    <StatusChangeButtons current onSelect />
    <ActivityLog activities loading />
    <AddNoteForm onSubmit />
  </CollapsibleContent>
</Collapsible>
```

State owned by `ResultsScreen`:

- `jobs: JobWithMeta[]` — full list from DB (R2)
- `loading: boolean`
- `error: string | null`
- `statusTab: StatusTabKey` — `"all" | JobStatus` (default `"all"`)
- `scoreThreshold: number` — default `0`
- `selectedKeywords: Set<string>` — empty = no keyword filter
- `expandedJobId: number | null`
- `activitiesByJobId: Map<number, Activity[]>` — cache per expanded job
- `activitiesLoading: number | null` — job id being fetched

Filtering runs in memory via `results-filters.ts` whenever tab, threshold,
chips, or `jobs` change (R17, R37). Sort order is fixed at load time (R2).

## Types

```ts
// src/renderer/types/job.ts
export type JobStatus =
  | "new"
  | "applying"
  | "applied"
  | "interviewing"
  | "offer"
  | "accepted"
  | "rejected";

export const JOB_STATUSES: readonly JobStatus[] = [
  "new",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
];

export type StatusTabKey = "all" | JobStatus;

export interface JobWithMeta {
  id: number;
  board_id: number;
  keyword_id: number;
  run_id: number;
  title: string;
  company: string | null;
  location: string | null;
  posted_date: string | null;
  description: string | null;
  url: string;
  score: number | null;
  match_reason: string | null;
  status: JobStatus;
  scraped_at: string;
  board_name: string;
  keyword_text: string;
}

export interface Activity {
  id: number;
  job_id: number;
  type: string;
  notes: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export type ScoreTier = "high" | "medium" | "low" | "none";

export function getScoreTier(score: number | null): ScoreTier;
export function scoreBadgeClassName(tier: ScoreTier): string;
export function truncateDescription(text: string | null, maxLen?: number): string;
```

Score badge Tailwind classes (R19–R20):

| Tier | Condition | Classes (example) |
|------|-----------|-------------------|
| `high` | `score >= 75` | `bg-emerald-600/20 text-emerald-400 border-emerald-600/40` |
| `medium` | `50–74` | `bg-amber-500/20 text-amber-400 border-amber-500/40` |
| `low` | `< 50` | `bg-red-500/20 text-red-400 border-red-500/40` |
| `none` | `NULL` | `bg-muted text-muted-foreground` label `—` |

Use shadcn `Badge` with variant overridden via `className`.

## Data access (`db:query`)

### List jobs (`jobs-db.ts`)

```ts
export class JobsDbError extends Error { ... }

export async function listJobsWithMeta(): Promise<JobWithMeta[]>;
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
  k.keyword AS keyword_text
FROM jobs j
INNER JOIN boards b ON j.board_id = b.id
INNER JOIN keywords k ON j.keyword_id = k.id
ORDER BY j.score IS NULL, j.score DESC, j.scraped_at DESC
```

Validate `status` against `JOB_STATUSES` when mapping rows; coerce unknown
values to `"new"` defensively.

### Activities

```ts
export async function listActivities(jobId: number): Promise<Activity[]>;

export async function addActivity(input: {
  jobId: number;
  type: "note" | "status_change";
  notes: string;
}): Promise<Activity>;
```

List SQL:

```sql
SELECT id, job_id, type, notes, scheduled_at, created_at
FROM activities
WHERE job_id = ?
ORDER BY created_at DESC
```

Insert SQL:

```sql
INSERT INTO activities (job_id, type, notes)
VALUES (?, ?, ?)
```

Then `SELECT` by `lastInsertRowid` (same pattern as `keywords-db.ts`).

### Update status

```ts
export async function updateJobStatus(
  jobId: number,
  status: JobStatus
): Promise<void>;
```

SQL:

```sql
UPDATE jobs SET status = ? WHERE id = ?
```

`ResultsScreen` orchestration on status change (R27):

1. `updateJobStatus(jobId, nextStatus)`
2. `addActivity({ jobId, type: "status_change", notes: \`Status set to ${nextStatus}\` })`
3. Patch local `jobs` array `status`
4. Reload activities for `jobId`

On note submit (R29): `addActivity({ jobId, type: "note", notes: trimmed })`
then refresh activities cache.

## Client-side filters (`results-filters.ts`)

```ts
export function distinctKeywords(jobs: JobWithMeta[]): string[];

export function filterJobs(
  jobs: JobWithMeta[],
  options: {
    statusTab: StatusTabKey;
    scoreThreshold: number;
    selectedKeywords: ReadonlySet<string>;
  }
): JobWithMeta[];
```

Rules (R6–R17):

- `statusTab === "all"` → no status filter.
- `scoreThreshold === 0` → include null scores.
- `scoreThreshold > 0` → require `score !== null && score >= threshold`.
- Empty `selectedKeywords` → no keyword filter.
- Non-empty → `selectedKeywords.has(job.keyword_text)`.

## External URL (R32)

Preferred: invoke `window.api.invoke("fs:openPath", job.url)` if the existing
stub accepts HTTP URLs via `shell.openExternal` in main. If the stub only
handles file paths, add a minimal main-process branch in `ipc-handler.ts` for
`http:` / `https:` URLs using `shell.openExternal(url)` — document in
implementer tasks; no new channel name.

Fallback for tests: mock `window.api.invoke` and assert the URL argument.

## UI details

### Page layout

- Heading: **Results** (`text-2xl font-semibold`).
- Subheading: `{filteredCount} of {totalCount} jobs` (updates with filters).
- Filter row 1: `StatusTabs` (shadcn `Tabs`, scrollable on narrow widths).
- Filter row 2: `ScoreThresholdSlider` label **Min score: {n}**; show **Any**
  when `n === 0`.
- Filter row 3: `KeywordFilterChips` — shadcn `Badge` or `Toggle`-style chips;
  omit row when `distinctKeywords` is empty.
- Job list: vertical stack with `border-border` dividers.

### Empty states

- No jobs at all (R4): icon + "No jobs yet. Run Scout to discover listings."
- Jobs exist but filters hide all: "No jobs match the current filters."

### Expand/collapse

Only one expanded card at a time (`expandedJobId`). Clicking another card
collapses the previous. Clicking the active card collapses it (R36).

Activities load lazily on first expand (R23); cache in `activitiesByJobId`.

### Status change buttons

Horizontal wrap of shadcn `Button` size `sm`, variant `outline`; current status
uses `variant="default"`. Labels title-case: New, Applying, Applied, etc.

### Activity log

`font-mono text-sm` timestamps optional; primary text from `notes`. Map
`type === "status_change"` to prefix **Status:** for scanability.

## Discarded alternative: SQL-side filtering per control change

Re-query with dynamic `WHERE status = ? AND score >= ? AND keyword IN (…)` on
every slider/tab/chip change.

**Discarded because:**

1. Profile DB is local; typical job counts are small enough to load once.
2. Instant slider/chip feedback avoids IPC latency and simplifies tests.
3. Matches interactive filter UX described in ROADMAP without new IPC.

## Discarded alternative: dedicated `jobs:list` IPC channel

Add a typed main-process handler returning joined job rows.

**Discarded because:**

1. `db:query` is allowlisted and used consistently (`boards-db`, `keywords-db`,
   `runs-db`).
2. Join SQL stays visible in renderer helper; no duplicate handler surface.

## Discarded alternative: Accordion allowing multiple open cards

Use shadcn `Accordion` type `"multiple"`.

**Discarded because:**

1. Activity log + note form per card is heavy; one expanded card keeps focus.
2. Single `expandedJobId` simplifies lazy activity loading and test assertions.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `jobs-db.test.ts` | R2, R23, R27, R29, R33, R35 — list SQL/order, activity CRUD, status update, error propagation |
| `results-filters.test.ts` | R6–R7, R11–R17, R37 — tab, threshold, keyword, combined filters |
| `ResultsScreen.test.tsx` | R1, R3–R5, R8–R10, R18–R22, R24–R26, R28–R31, R34, R36 — mock `window.api.invoke`, fixture jobs, assert DOM/badge classes, expand flow, status change, note validation, empty states |

`ResultsScreen.test.tsx` patterns:

- Seed mock `db:query` responses for list + activities by SQL substring.
- Assert green/yellow/red/muted badge classes for scores 80, 60, 40, null.
- Assert jobs render in score-desc order in DOM.
- Change slider to 70 → jobs below 70 hidden; null scores hidden.
- Toggle keyword chip → only matching jobs visible.
- Expand card → description truncated at 400 chars.
- Status button click → UPDATE + INSERT invoked; list reflects new status.
- Empty note → validation message, no INSERT.

Pure helpers (`getScoreTier`, `truncateDescription`, `filterJobs`) stay
unit-tested without jsdom where possible in `results-filters.test.ts`.
