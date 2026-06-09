# Requirements — scraping-engine

## R1
WHEN the renderer invokes `window.api.invoke('scraper:run', payload)`, the system
SHALL execute the scrape pipeline exclusively in the Electron main process.

## R2
WHEN `scraper:run` starts, the system SHALL create a row in the `runs` table
with `started_at` set to the current UTC time as an ISO-8601 string and
`finished_at` set to `NULL`.

## R3
WHEN `scraper:run` starts, the system SHALL load all rows from the `boards`
table of the active profile database.

## R4
WHEN `scraper:run` starts, the system SHALL load only `keywords` rows where
`active` equals `1` from the active profile database.

## R5
IF `scraper:run` is invoked while a scrape run is already in progress THEN the
system SHALL reject the invocation with a named `ScraperBusyError` and SHALL NOT
start a second run.

## R6
WHEN processing a board, the system SHALL launch a Playwright Chromium browser
and navigate to that board's `url`.

## R7
WHEN resolving the search input for a board, the system SHALL try the board's
saved `search_selector` first when that value is non-null.

## R8
WHEN the saved `search_selector` is null or does not match a visible, enabled
search input within 5 seconds, the system SHALL try the six heuristic CSS
selectors defined in `design.md` in order until one matches a visible, enabled
search input.

## R9
IF no search input is found after the saved selector and heuristic cascade THEN
the system SHALL capture a PNG screenshot of the current page, emit a
`scraper:progress` event of type `selector_required` including the screenshot as
a base64-encoded string, and pause the run until the renderer responds.

## R10
WHEN the renderer invokes `window.api.invoke('scraper:provideSelector', payload)`
while the run is paused for `selector_required`, the system SHALL resume the
paused board using the supplied CSS selector.

## R11
WHEN `scraper:provideSelector` receives a non-empty trimmed `selector` string,
the system SHALL persist that value to `boards.search_selector` for the paused
board and retry search-input resolution starting with the saved selector.

## R12
IF `scraper:provideSelector` receives `{ cancelled: true }` for the paused
board THEN the system SHALL emit a `scraper:progress` error event for that
board, skip remaining keywords for that board, and continue with the next board.

## R13
WHEN a search input is resolved, the system SHALL clear the field, type the
active keyword text, submit the search (Enter key or nearest submit control),
and wait until the page reaches `networkidle` state with a timeout of 30
seconds.

## R14
WHEN search results are loaded, the system SHALL extract zero or more job cards
from the current page, collecting for each card: `title`, `company`,
`location`, `posted_date`, `description` (snippet text), and absolute `url`.

## R15
WHEN a scraped job card field cannot be extracted, the system SHALL store
`NULL` for optional fields (`company`, `location`, `posted_date`,
`description`) and SHALL require non-empty `title` and absolute `url` before
persisting the card.

## R16
WHEN `scraper:run` receives a `dateRange` payload of `24h`, `7d`, `30d`, `60d`,
or `90d`, the system SHALL compute a cutoff timestamp equal to the current UTC
time minus that duration.

## R17
WHILE scraped jobs on the current results page have a parseable `posted_date`
on or after the cutoff timestamp, the system SHALL attempt to navigate to the
next results page using the pagination heuristics defined in `design.md`.

## R18
WHEN a scraped job on the current page has a parseable `posted_date` strictly
before the cutoff timestamp, the system SHALL stop paginating for the current
board-and-keyword combination.

## R19
WHEN a scraped job has an unparseable or missing `posted_date`, the system
SHALL include that job in the current page results and SHALL NOT use it alone as
the pagination stop signal.

## R20
BEFORE inserting a scraped job, the system SHALL sanitize its URL using the
`sanitizeJobUrl` rules defined in `design.md`.

## R21
WHEN a sanitized URL already exists in the `jobs.url` column of the active
profile database, the system SHALL skip inserting that job for the current run.

## R22
WHEN a sanitized URL is not yet present in `jobs.url`, the system SHALL insert
a new row with `status` set to `'new'`, `board_id`, `keyword_id`, and `run_id`
set to the current run, `scraped_at` set to the current UTC ISO-8601 string,
and `score` and `match_reason` set to `NULL`.

## R23
WHILE the scrape pipeline executes, the system SHALL emit `scraper:progress`
events on the `scraper:progress` channel for lifecycle milestones defined in
`design.md` (including at minimum `log`, `board_start`, `board_done`,
`keyword_start`, `selector_required`, `run_complete`, and `run_error`).

## R24
WHEN all board-and-keyword combinations finish (or are skipped), the system
SHALL update the current `runs` row with `finished_at`, `total_scraped`, and
`total_new` counts and return a `ScraperRunResult` summary to the renderer.

## R25
IF an unrecoverable error occurs during `scraper:run` THEN the system SHALL
emit a `scraper:progress` event of type `run_error`, set `finished_at` on the
`runs` row when a run was started, and return `{ error: string }` to the
renderer.

## R26
The system SHALL expose `scraper:provideSelector` through the preload
`ApiChannel` allowlist alongside the existing `scraper:run` channel.

## R27
The system SHALL emit `scraper:progress` events to the focused main
`BrowserWindow` webContents without requiring the renderer to poll for status.

## R28
WHEN no boards exist for the active profile, the system SHALL complete the run
with zero scraped jobs, update the `runs` row, and return a successful summary
without launching Playwright.

## R29
WHEN boards exist but no active keywords exist, the system SHALL complete the
run with zero scraped jobs, update the `runs` row, and return a successful
summary without launching Playwright.
