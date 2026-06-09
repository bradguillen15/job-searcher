# Design — scraping-engine

## Scope

This feature implements the **Playwright scraping pipeline in the main process**
and wires the existing IPC stubs (`scraper:run`, `scraper:progress`). It adds
one new invoke channel (`scraper:provideSelector`) for the manual search-bar
fallback.

**In scope:** browser automation, search-bar resolution, job-card extraction,
pagination with date cutoff, URL sanitization, deduplication, `runs`/`jobs`
persistence, progress events.

**Out of scope:** Scout screen UI (`scout-screen`), AI matching (`ai-matching`),
score/match_reason population, renderer progress log component, date-range UI
control (payload is passed into `scraper:run`; UI comes later).

Depends on `boards-management` (`boards` + `search_selector`) and
`keywords-management` (`keywords.active`).

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `playwright` dependency |
| `src/main/scraper/types.ts` | Create | Shared types, progress payloads, errors |
| `src/main/scraper/url.ts` | Create | `sanitizeJobUrl()` pure helper |
| `src/main/scraper/dates.ts` | Create | `dateRangeToCutoff()`, `parsePostedDate()` |
| `src/main/scraper/search-bar.ts` | Create | Saved selector + 6-selector heuristic cascade |
| `src/main/scraper/job-cards.ts` | Create | Card discovery + field extraction heuristics |
| `src/main/scraper/pagination.ts` | Create | Next-page navigation heuristics + safety cap |
| `src/main/scraper/jobs-db.ts` | Create | Run lifecycle + job insert/skip (better-sqlite3) |
| `src/main/scraper/browser.ts` | Create | Playwright launch/teardown wrapper |
| `src/main/scraper/progress.ts` | Create | Emit typed events to main window webContents |
| `src/main/scraper/run.ts` | Create | Orchestrator: boards × keywords × pages |
| `src/main/ipc-handler.ts` | Modify | Real `scraper:run` / `scraper:provideSelector` handlers |
| `src/main/preload.ts` | Modify | Add `scraper:provideSelector` to `ApiChannel` |
| `src/main/index.ts` | Modify | Pass main window reference to scraper progress emitter |
| `docs/architecture.md` | Modify | IPC table: scraper channels implemented |
| `tests/fixtures/boards/*.html` | Create | Static HTML for Playwright unit tests |
| `tests/main/scraper/url.test.ts` | Create | URL sanitization tests |
| `tests/main/scraper/dates.test.ts` | Create | Date range + posted-date parsing tests |
| `tests/main/scraper/search-bar.test.ts` | Create | Heuristic cascade against fixtures |
| `tests/main/scraper/job-cards.test.ts` | Create | Card extraction against fixtures |
| `tests/main/scraper/jobs-db.test.ts` | Create | Run + insert/dedup with `:memory:` DB |
| `tests/main/scraper/run.test.ts` | Create | Orchestrator with mocked browser layer |
| `tests/main/ipc-handler.test.ts` | Modify | Allowlist + busy error for concurrent run |

No renderer files in this feature — `scout-screen` will subscribe to
`scraper:progress` and call `scraper:run` / `scraper:provideSelector`.

## Playwright in main process

Use `playwright` (full package) with `chromium.launch({ headless: true })`.
The scraper runs **outside** Electron's `BrowserWindow` — Playwright controls
its own Chromium instance. This avoids coupling to Electron's embedded browser
and matches ROADMAP step 1–7.

Browser lifecycle per `scraper:run` invocation:

1. Launch Chromium once at run start (skip when R28/R29 early-exit).
2. Reuse the same browser context across boards/keywords.
3. Close browser in a `finally` block when the run ends or errors.

Timeout defaults: navigation 30s, selector wait 5s per heuristic, search
`networkidle` 30s.

## IPC contracts

### `scraper:run`

```ts
export type DateRangeKey = "24h" | "7d" | "30d" | "60d" | "90d";

export interface ScraperRunPayload {
  dateRange: DateRangeKey;
}

export type ScraperRunResult =
  | {
      runId: number;
      totalScraped: number;
      totalNew: number;
      boardErrors: Array<{ boardId: number; message: string }>;
    }
  | { error: string };
```

Handler: `runScraper(payload, emitProgress)` in `src/main/scraper/run.ts`.
Registered in `ipc-handler.ts`; passes `getMainWindow()?.webContents` to
progress emitter.

### `scraper:provideSelector`

```ts
export type ScraperProvideSelectorPayload =
  | { boardId: number; selector: string }
  | { boardId: number; cancelled: true };
```

Resolves an internal `Promise` waited on by `run.ts` when R9 fires. Only
valid while run status is `awaiting_selector` for matching `boardId`; otherwise
throws `ScraperNotWaitingError`.

### `scraper:progress` events

All payloads include `{ type: string, timestamp: string }` (ISO-8601 UTC).

| `type` | Additional fields | When |
|--------|-------------------|------|
| `log` | `message: string`, optional `boardId`, `keywordId` | General status |
| `board_start` | `boardId`, `boardName` | Before navigating to board |
| `board_done` | `boardId`, `scraped: number`, `new: number` | After board finishes |
| `keyword_start` | `boardId`, `keywordId`, `keyword` | Before search for keyword |
| `selector_required` | `boardId`, `boardName`, `screenshotBase64: string` | R9 pause |
| `run_complete` | `runId`, `totalScraped`, `totalNew` | Successful end |
| `run_error` | `message: string` | Fatal/unrecoverable error |

Emission: `webContents.send("scraper:progress", payload)` from
`src/main/scraper/progress.ts`.

## Search-bar resolution

Order (R7–R8):

1. Board's saved `search_selector` (if non-null).
2. Heuristic cascade — **exactly six** CSS selectors, first visible+enabled match wins:

```ts
export const SEARCH_HEURISTICS: readonly string[] = [
  'input[type="search"]',
  'input[name="q"]',
  'input[name="search"]',
  'input[placeholder*="Search"]',
  'input[aria-label*="search"]',
  '#search',
];
```

Implementation uses Playwright `page.locator(selector).first()` with
`waitFor({ state: "visible", timeout: 5000 })` per selector; catch timeout and
continue cascade.

Manual fallback (R9–R12): `page.screenshot({ type: "png" })` → base64 → emit
`selector_required` → await `provideSelector` promise (no timeout in v1; scout
screen will supply UI). On success, `UPDATE boards SET search_selector = ? WHERE id = ?`.

## Search submit (R13)

1. `locator.fill(keyword)`
2. `locator.press("Enter")`; if no navigation within 2s, click
   `button[type="submit"], input[type="submit"], button:has-text("Search")` (first visible).
3. `page.waitForLoadState("networkidle", { timeout: 30000 })`.

## Job-card extraction (R14–R15)

Discover card roots on the results page (first selector set with ≥1 match):

```ts
export const JOB_CARD_ROOT_SELECTORS: readonly string[] = [
  "article",
  '[class*="job-card"]',
  '[class*="JobCard"]',
  '[data-testid*="job"]',
  "li.result",
];
```

Within each root, extract fields with fallbacks:

| Field | Selectors / logic |
|-------|-------------------|
| `title` | `h2 a`, `h3 a`, `h2`, `h3`, `a[class*="title"]` — first non-empty text |
| `company` | `[class*="company"]`, `[data-testid*="company"]` |
| `location` | `[class*="location"]`, `[data-testid*="location"]` |
| `posted_date` | `time[datetime]`, `time`, `[class*="date"]`, `[class*="posted"]` → `parsePostedDate()` |
| `description` | `[class*="snippet"]`, `[class*="description"]`, `p` (first substantial paragraph) |
| `url` | `h2 a[href]`, `h3 a[href]`, `a[class*="title"][href]` → resolve with `new URL(href, page.url())` |

Skip cards missing title or url. Optional fields default to `null`.

Return type:

```ts
export interface ScrapedJob {
  title: string;
  company: string | null;
  location: string | null;
  postedDate: string | null; // ISO-8601 UTC or null
  description: string | null;
  url: string; // absolute, pre-sanitize
}
```

## Pagination (R17–R19)

After processing cards on a page, if no parseable date on the page is before
cutoff, attempt next page via first visible match:

```ts
export const PAGINATION_SELECTORS: readonly string[] = [
  'a[rel="next"]',
  'a[aria-label="Next"]',
  'button[aria-label="Next"]',
  'a:has-text("Next")',
  'button:has-text("Next")',
];
```

Safety: stop after `MAX_PAGES = 50` per board+keyword. Emit `log` when cap hit.

## URL sanitization (R20)

```ts
export function sanitizeJobUrl(rawUrl: string): string;
```

Rules:

1. Parse with `URL` constructor; throw `ScraperError` on invalid URL.
2. Lowercase `hostname`.
3. Remove hash fragment.
4. Remove query params whose names start with `utm_`, plus `ref`, `source`, `fbclid`, `gclid`.
5. Remove trailing slash from pathname (except root `/`).

Dedup key is the sanitized string stored in `jobs.url`.

## Date helpers

```ts
export function dateRangeToCutoff(dateRange: DateRangeKey, now?: Date): Date;

export function parsePostedDate(raw: string): Date | null;
```

`dateRangeToCutoff` maps: `24h`→24h, `7d`→168h, `30d`→720h, `60d`→1440h,
`90d`→2160h.

`parsePostedDate` supports:

- ISO-8601 strings (`Date.parse`)
- Relative English: `"today"`, `"yesterday"`, `"N days ago"`, `"N hours ago"`
- Fallback `null` (R19)

## Database access (`jobs-db.ts`)

Uses synchronous `better-sqlite3` via the active `db` singleton from `db.ts`.

```ts
export function createRun(): number; // INSERT runs, return id

export function finishRun(
  runId: number,
  totals: { totalScraped: number; totalNew: number }
): void;

export function loadBoards(): BoardRow[];

export function loadActiveKeywords(): KeywordRow[];

export function updateBoardSearchSelector(boardId: number, selector: string): void;

export function urlExists(sanitizedUrl: string): boolean;

export function insertJob(input: {
  boardId: number;
  keywordId: number;
  runId: number;
  title: string;
  company: string | null;
  location: string | null;
  postedDate: string | null;
  description: string | null;
  url: string;
}): "inserted" | "skipped";
```

`insertJob` uses parameterized `INSERT`; treat UNIQUE violation on `jobs.url` as
`skipped` (defensive; R21 pre-check via `urlExists`).

Run counters: increment `totalScraped` for every card extracted; increment
`totalNew` only on successful insert.

## Orchestrator (`run.ts`)

```ts
export class ScraperBusyError extends Error {}
export class ScraperNotWaitingError extends Error {}
export class ScraperError extends Error {}

let runState: "idle" | "running" | "awaiting_selector" = "idle";
let selectorWaiter: {
  boardId: number;
  resolve: (payload: ScraperProvideSelectorPayload) => void;
} | null = null;

export async function runScraper(
  payload: ScraperRunPayload,
  emit: ProgressEmitter
): Promise<ScraperRunResult>;

export function provideSelector(
  payload: ScraperProvideSelectorPayload
): void;
```

Nested loops: `for board → for keyword → while pages`. On selector pause, set
`runState = "awaiting_selector"`, emit event, await promise, then continue or
skip board per R11–R12.

## Main window reference

`src/main/index.ts` stores the created `BrowserWindow` in a module-level
variable exported as `getMainWindow()`. `progress.ts` uses it to send events;
if window is destroyed, events are silently dropped (no throw).

## Discarded alternative: Playwright inside Electron `BrowserWindow`

Driving the visible Electron window with Playwright or `webContents.debugger`
would show live scraping to the user.

**Discarded because:**

1. ROADMAP specifies a main-process pipeline decoupled from the Scout UI.
2. Electron's Chromium version and Playwright's bundled Chromium diverge;
   attaching Playwright to Electron is fragile and poorly supported.
3. Headless scraping keeps the UI responsive during long runs.

## Discarded alternative: Renderer-side scraping via hidden `<webview>`

The renderer could load board URLs in a sandboxed webview and scrape DOM via
preload scripts.

**Discarded because:**

1. `docs/architecture.md` — main process owns I/O and automation; renderer never
   touches external URLs directly.
2. Cross-origin DOM access from React would require per-board preload hacks.
3. Playwright in main is the ROADMAP-mandated approach.

## Discarded alternative: Per-board adapter plugins

Separate TypeScript modules per job site (LinkedIn, Indeed, etc.) with bespoke
selectors.

**Discarded because:**

1. ROADMAP specifies a generic heuristic cascade + saved CSS selector fallback.
2. Adapter maintenance is out of scope until generic heuristics prove
   insufficient; `search_selector` column already supports site-specific overrides.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `url.test.ts` | R20 — tracking param strip, hostname lowercasing, trailing slash |
| `dates.test.ts` | R16, R18, R19 — cutoff math, relative/ISO date parsing |
| `search-bar.test.ts` | R7, R8 — fixture HTML, saved selector priority, cascade order |
| `job-cards.test.ts` | R14, R15 — field extraction, skip incomplete cards |
| `jobs-db.test.ts` | R2, R21, R22, R24 — run lifecycle, dedup, insert columns |
| `run.test.ts` | R5, R9–R12, R17–R18, R23, R28, R29 — mocked page/browser, pause/resume |
| `ipc-handler.test.ts` | R1, R5, R26 — channel allowlist, stub replaced |

Playwright fixture tests load `tests/fixtures/boards/*.html` via
`page.goto(\`file://${path}\`)` — no network to real job boards in CI.

`run.test.ts` injects a fake `BrowserSession` interface so orchestration logic
is testable without launching Chromium in every assertion (one smoke test may
launch browser optionally or be marked `@slow` — prefer mock for default `npm test`).
