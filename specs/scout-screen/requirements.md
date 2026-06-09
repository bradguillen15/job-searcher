# Requirements — scout-screen

## R1
WHEN the user navigates to `/`, the system SHALL render `ScoutScreen` as the
main content area inside the existing `AppShell` layout.

## R2
WHEN `ScoutScreen` mounts, the system SHALL display a primary **Run Scout**
control that starts a full scout session (scrape plus AI matching) in the main
process.

## R3
WHEN the user activates **Run Scout**, the system SHALL invoke
`window.api.invoke('scraper:run', { dateRange })` with the currently selected
`dateRange` value.

## R4
WHILE a scout session is in progress, the system SHALL disable the **Run Scout**
control and the date range selector.

## R5
WHEN `ScoutScreen` mounts, the system SHALL subscribe to `scraper:progress`
events via `window.api.on('scraper:progress', callback)` and SHALL unsubscribe
when the component unmounts.

## R6
WHEN a `scraper:progress` event of type `log` is received, the system SHALL
append a timestamped line to the live progress log using the event `message`.

## R7
WHEN a `scraper:progress` event of type `board_start` is received, the system
SHALL mark the corresponding board as **running** in the board status list.

## R8
WHEN a `scraper:progress` event of type `board_done` is received, the system
SHALL mark the corresponding board as **done** and SHALL display that board's
`scraped` and `new` counts inline.

## R9
WHEN a `scraper:progress` event of type `keyword_start` is received, the
system SHALL append a progress-log line identifying the board and keyword.

## R10
WHEN a `scraper:progress` event of type `matching_start`, `matching_phase`,
`matching_batch`, or `matching_complete` is received, the system SHALL append
a human-readable line to the live progress log derived from the event fields.

## R11
WHEN a `scraper:progress` event of type `run_complete` is received, the
system SHALL re-enable **Run Scout** and the date range selector and SHALL
display a summary line with `totalScraped`, `totalNew`, and `totalMatched`.

## R12
WHEN a `scraper:progress` event of type `run_error` is received, the system
SHALL re-enable **Run Scout** and the date range selector and SHALL display
the error `message` in a prominent global error area.

## R13
The system SHALL provide a date range selector with exactly five options:
`24h`, `7d`, `30d`, `60d`, and `90d`.

## R14
WHEN `ScoutScreen` mounts, the system SHALL initialize the selected date range
from the active profile `settings` row with key `scout.default_date_range` when
that value is one of the five allowed keys.

## R15
IF the `scout.default_date_range` setting is missing or invalid THEN the system
SHALL default the selected date range to `30d`.

## R16
WHEN `ScoutScreen` mounts, the system SHALL load the most recent completed run
from the `runs` table by invoking `window.api.invoke('db:query', …)` with a
parameterized `SELECT` ordered by `finished_at DESC` where `finished_at IS NOT
NULL`, limited to one row.

## R17
WHEN a completed run row exists, the system SHALL display the **Last run**
timestamp formatted from that row's `finished_at` value in the user's locale.

## R18
WHEN no completed run exists for the active profile, the system SHALL display
**Last run: Never**.

## R19
WHEN `scraper:run` resolves successfully, the system SHALL refresh the **Last
run** display from the database.

## R20
WHEN `ScoutScreen` mounts, the system SHALL load all boards from the active
profile and render a board status list showing each board `name`.

## R21
WHEN a board error is reported for a board — via `ScraperRunResult.boardErrors`
after `scraper:run` resolves, or via a `scraper:progress` `log` event whose
`message` indicates a board error and includes `boardId` — the system SHALL
display the error message inline adjacent to that board in the board status
list.

## R22
WHEN a `scraper:progress` event of type `selector_required` is received, the
system SHALL open a modal dialog showing the board name, the
`screenshotBase64` image, a CSS selector text field, and **Submit** and
**Cancel** actions.

## R23
WHEN the user submits a non-empty trimmed CSS selector in the
`selector_required` dialog, the system SHALL invoke
`window.api.invoke('scraper:provideSelector', { boardId, selector })`.

## R24
WHEN the user cancels the `selector_required` dialog, the system SHALL invoke
`window.api.invoke('scraper:provideSelector', { boardId, cancelled: true })`.

## R25
IF `scraper:run` rejects with `ScraperBusyError` THEN the system SHALL display
an inline message that a scout session is already in progress and SHALL NOT
enter the running state.

## R26
IF `scraper:run` resolves with `{ error: string }` THEN the system SHALL
display that error in the global error area and SHALL re-enable **Run Scout**
and the date range selector.

## R27
The live progress log SHALL render in JetBrains Mono via the `--font-mono` /
`font-mono` convention and SHALL auto-scroll to the newest entry when the user
has not manually scrolled away from the bottom.

## R28
WHEN new progress log lines are appended, the system SHALL preserve prior log
lines for the current session until the user starts a new scout session.

## R29
WHEN the user starts a new scout session, the system SHALL clear the prior
session's progress log lines and per-board error state while retaining board
names in the status list.
