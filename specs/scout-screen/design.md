# Design — scout-screen

## Scope

This feature replaces the `ScoutScreen` placeholder at `/` with the primary
scout workflow UI: date range selection, **Run Scout**, live IPC progress log,
per-board status with inline errors, last-run timestamp, and the manual search-bar
fallback dialog (`selector_required`).

**In scope:** renderer components, hooks, `db:query` helpers for `runs`/`settings`/
`boards`, Vitest tests.

**Out of scope:** new main-process IPC channels, scraper/matcher logic changes,
Results/Pipeline screens, Settings screen persistence for `scout.default_date_range`
(read-only fallback here; `settings-screen` will write the key later).

Depends on `navigation-layout` (route + shell), `scraping-engine`
(`scraper:run`, `scraper:provideSelector`, `scraper:progress`), and
`ai-matching` (matching progress events on the same channel).

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `src/renderer/types/scout.ts` | Create | `DateRangeKey`, run/board UI types |
| `src/renderer/lib/runs-db.ts` | Create | `getLastCompletedRun()` via `db:query` |
| `src/renderer/lib/scout-settings.ts` | Create | `loadDefaultDateRange()` from `settings` |
| `src/renderer/lib/scout-progress.ts` | Create | Pure helpers: format events → log lines |
| `src/renderer/hooks/useScraperProgress.ts` | Create | Subscribe/unsubscribe + session state |
| `src/renderer/components/scout/DateRangeSelector.tsx` | Create | Five-option toggle (shadcn `ToggleGroup` or `Select`) |
| `src/renderer/components/scout/ProgressLog.tsx` | Create | Monospace scrollable log |
| `src/renderer/components/scout/BoardStatusList.tsx` | Create | Per-board status + inline errors |
| `src/renderer/components/scout/SelectorRequiredDialog.tsx` | Create | Screenshot + selector input |
| `src/renderer/screens/ScoutScreen.tsx` | Modify | Compose scout UI; orchestrate run |
| `src/renderer/components/ui/toggle-group.tsx` | Add (shadcn) | Date range control (if not present) |
| `src/renderer/components/ui/scroll-area.tsx` | Add (shadcn) | Progress log container |
| `tests/renderer/scout-progress.test.ts` | Create | Event → log line formatting |
| `tests/renderer/runs-db.test.ts` | Create | Last-run SQL helper |
| `tests/renderer/scout-settings.test.ts` | Create | Default date range fallback |
| `tests/renderer/ScoutScreen.test.tsx` | Create | Run flow, log, errors, selector dialog |
| `tests/renderer/AppShell.test.tsx` | Modify | Expect scout heading instead of placeholder text |

No changes to `src/main/` — all automation stays in existing scraper/matcher
modules.

## Component tree

```
<ScoutScreen>                           ← route `/`
  <header> Scout + Last run timestamp
  <DateRangeSelector value onChange disabled={running} />
  <Button Run Scout disabled={running} />
  {globalError && <Alert />}
  <BoardStatusList boards statuses errors />
  <ProgressLog lines autoScroll />
  <SelectorRequiredDialog open board screenshot onSubmit onCancel />
```

State owned by `ScoutScreen` (or `useScraperProgress`):

- `dateRange: DateRangeKey`
- `running: boolean`
- `logLines: LogLine[]`
- `boardStatuses: Map<boardId, BoardRunStatus>`
- `boardErrors: Map<boardId, string>`
- `selectorPrompt: SelectorRequiredState | null`
- `lastRunAt: string | null`
- `globalError: string | null`
- `runSummary: { totalScraped, totalNew, totalMatched } | null`

## Types

```ts
// src/renderer/types/scout.ts
export type DateRangeKey = "24h" | "7d" | "30d" | "60d" | "90d";

export const DATE_RANGE_OPTIONS: readonly DateRangeKey[] = [
  "24h", "7d", "30d", "60d", "90d",
];

export interface CompletedRun {
  id: number;
  started_at: string;
  finished_at: string;
  total_scraped: number;
  total_new: number;
  total_matched: number;
}

export type BoardRunPhase = "idle" | "running" | "done" | "error";

export interface BoardRunStatus {
  boardId: number;
  name: string;
  phase: BoardRunPhase;
  scraped?: number;
  newCount?: number;
}

export interface LogLine {
  id: string;
  timestamp: string;
  text: string;
}

export interface SelectorRequiredState {
  boardId: number;
  boardName: string;
  screenshotBase64: string;
}
```

Re-export or mirror `ProgressEvent` fields used by the renderer by importing
types from a thin `src/renderer/types/progress.ts` that duplicates the subset
from `src/main/scraper/types.ts` (renderer must not import from `src/main/`).

## Data access (`db:query`)

### Last completed run (`runs-db.ts`)

```ts
export type RunsDbError = { error: string };

export async function getLastCompletedRun(): Promise<CompletedRun | null>;
```

SQL:

```sql
SELECT id, started_at, finished_at, total_scraped, total_new, total_matched
FROM runs
WHERE finished_at IS NOT NULL
ORDER BY finished_at DESC
LIMIT 1
```

### Default date range (`scout-settings.ts`)

```ts
const SETTING_KEY = "scout.default_date_range";

export async function loadDefaultDateRange(): Promise<DateRangeKey>;
```

SQL:

```sql
SELECT value FROM settings WHERE key = ?
```

Params: `[SETTING_KEY]`. Validate against `DATE_RANGE_OPTIONS`; return `"30d"`
when row missing or value invalid (R14–R15). Do not write settings in this
feature.

### Boards list

Reuse `listBoards()` from `src/renderer/lib/boards-db.ts` for R20.

## IPC usage

| Channel | Direction | Used for |
|---------|-----------|----------|
| `scraper:run` | renderer → main | Start session with `{ dateRange }` |
| `scraper:provideSelector` | renderer → main | Resume after `selector_required` |
| `scraper:progress` | main → renderer | Live log + board/matching milestones |
| `db:query` | renderer → main | Last run, default date range, boards |

### Run orchestration (`ScoutScreen`)

```ts
async function handleRun(): Promise<void> {
  clearSessionState();
  setRunning(true);
  setGlobalError(null);
  try {
    const result = await window.api.invoke("scraper:run", { dateRange });
    if (isErrorResult(result)) {
      setGlobalError(result.error);
      return;
    }
    mergeBoardErrors(result.boardErrors);
    await refreshLastRun();
  } catch (err) {
    if (isScraperBusyError(err)) {
      setGlobalError("A scout session is already in progress.");
      return;
    }
    setGlobalError((err as Error).message);
  } finally {
    setRunning(false);
  }
}
```

`running` is also set `true` on run start and cleared on `run_complete`,
`run_error`, or invoke failure. Progress handler may clear `running` before the
invoke promise resolves when `run_complete` / `run_error` fires.

### Progress subscription (`useScraperProgress.ts`)

```ts
export function useScraperProgress(handlers: {
  onLogLine: (line: LogLine) => void;
  onBoardStart: (boardId: number, boardName: string) => void;
  onBoardDone: (boardId: number, scraped: number, newCount: number) => void;
  onSelectorRequired: (state: SelectorRequiredState) => void;
  onRunComplete: (summary: RunSummary) => void;
  onRunError: (message: string) => void;
  onBoardLogError: (boardId: number, message: string) => void;
}): void;
```

On mount: `const unsub = window.api.on("scraper:progress", (event) => …)`.
On unmount: call `unsub()`.

Event mapping (via `scout-progress.ts` pure functions):

| `type` | UI effect |
|--------|-----------|
| `log` | Append line; if `boardId` and message matches board-error pattern, set inline error |
| `board_start` | `phase = "running"` |
| `board_done` | `phase = "done"`, store counts |
| `keyword_start` | Append `"Searching {board}: {keyword}"` |
| `selector_required` | Open `SelectorRequiredDialog` |
| `matching_start` | Append `"AI matching started"` |
| `matching_phase` | Append `"Phase {n}: {status}"` (+ optional detail) |
| `matching_batch` | Append `"Scoring batch {batch}/{totalBatches} ({jobCount} jobs)"` |
| `matching_complete` | Append `"Matching complete: {totalMatched} strong matches"` |
| `run_complete` | Append summary; `running = false` |
| `run_error` | Global error; `running = false` |

Board-error detection for R21: treat `log` events with `boardId` where
`message` starts with `"Board error:"` as inline board errors. Also merge
`boardErrors` from the successful `scraper:run` result (covers errors not
re-emitted as progress).

## UI details

### Page layout

- Heading: **Scout** (`text-2xl font-semibold`).
- Subheading row: **Last run:** formatted `finished_at` or **Never**.
- Controls row: `DateRangeSelector` left, **Run Scout** primary `Button` right.
- Two-column body on `md+` breakpoints: left `BoardStatusList` (~40%), right
  `ProgressLog` (~60%); stack vertically on narrow widths.
- Use existing shadcn tokens (`bg-background`, `text-muted-foreground`,
  `border-border`).

### Date range selector

Labels: `24h` → "24 hours", `7d` → "7 days", etc. (short labels in control,
full text in `aria-label`). Implemented as shadcn `ToggleGroup` type `"single"`
or `Select` — prefer `ToggleGroup` for five fixed options.

### Board status list

Each row: board name, status badge (`Idle` / `Running` / `Done` / `Error`),
optional `scraped / new` counts when done, error text in `text-destructive`
below the row when present. Running board gets accent border or pulse per
existing Tailwind patterns in `BoardsScreen`.

### Progress log

`ScrollArea` with `font-mono text-sm`. Each line:
`[HH:mm:ss] message`. `useRef` + `scrollIntoView` on new lines when
`stickToBottom` ref is true (R27). Reset lines on new run (R29).

### Selector required dialog

shadcn `Dialog` modal:

- Title: `Search bar required — {boardName}`
- `<img src={`data:image/png;base64,${screenshotBase64}`} />` with max height
- `Input` for CSS selector (`font-mono`)
- **Submit** calls `scraper:provideSelector` with trimmed selector; disable
  when empty
- **Cancel** calls `{ cancelled: true }`
- Close dialog after invoke; errors from `ScraperNotWaitingError` surface in
  global error area

## Discarded alternative: poll `runs` table for progress

The renderer could `setInterval` + `db:query` the open run row for status.

**Discarded because:**

1. `docs/architecture.md` already emits granular `scraper:progress` events.
2. Polling would miss keyword-level and matching-phase detail.
3. Extra DB load during long Playwright sessions with no UX benefit.

## Discarded alternative: dedicated `runs:last` IPC channel

Add a main-process handler returning the latest completed run.

**Discarded because:**

1. `db:query` is allowlisted and sufficient for a single-row `SELECT`.
2. Avoids expanding the IPC surface for read-only data the renderer already
   accesses elsewhere (boards, keywords pattern).

## Discarded alternative: separate log component per event type

Render `board_start`, `matching_batch`, etc. as structured cards instead of a
single append-only log.

**Discarded because:**

1. ROADMAP explicitly requests a "live progress log".
2. A unified monospace log matches operator-style tooling and is simpler to
   test with snapshot-style line assertions.
3. Board-level structured state is still captured in `BoardStatusList` for
   inline errors without duplicating all events.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `scout-progress.test.ts` | R6, R9, R10, R11 — pure formatters for each event type |
| `runs-db.test.ts` | R16, R17, R18 — SQL/params, null when empty |
| `scout-settings.test.ts` | R14, R15 — valid setting, missing, invalid value |
| `ScoutScreen.test.tsx` | R2–R5, R7–R8, R11–R13, R19, R21–R26, R28–R29 — mock `window.api.invoke` + `window.api.on`, simulate progress events, assert DOM |
| `AppShell.test.tsx` (update) | R1 — scout route shows heading not placeholder |

`ScoutScreen.test.tsx` patterns:

- Mock `api.on` to capture callback; emit synthetic `ProgressEvent` objects.
- Mock `scraper:run` resolving `{ runId, totalScraped, totalNew, totalMatched, boardErrors: [] }`.
- Assert **Run Scout** disabled while `running`.
- Assert board error text appears next to board name.
- Assert `selector_required` opens dialog; submit calls `scraper:provideSelector`.
