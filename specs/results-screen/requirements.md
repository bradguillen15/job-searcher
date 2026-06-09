# Requirements — results-screen

## R1
WHEN the user navigates to `/results`, the system SHALL render `ResultsScreen`
as the main content area inside the existing `AppShell` layout.

## R2
WHEN `ResultsScreen` mounts, the system SHALL load all jobs for the active
profile by invoking `window.api.invoke('db:query', …)` with a parameterized
`SELECT` that joins `jobs`, `boards`, and `keywords` and orders rows by
`score` descending with `NULL` scores last, then by `scraped_at` descending.

## R3
WHILE one or more jobs exist after loading, the system SHALL render a ranked
job list in the order returned by the query in R2.

## R4
WHEN no jobs exist for the active profile, the system SHALL render an empty
state with a message directing the user to run Scout first.

## R5
The system SHALL provide status filter tabs with exactly these values: **All**,
**New**, **Applying**, **Applied**, **Interviewing**, **Offer**, **Accepted**,
and **Rejected**, mapping to job `status` values `new`, `applying`, `applied`,
`interviewing`, `offer`, `accepted`, and `rejected` respectively.

## R6
WHEN the user selects the **All** status tab, the system SHALL include every
loaded job in the filtered list regardless of `status`.

## R7
WHEN the user selects a status tab other than **All**, the system SHALL
include only jobs whose `status` equals the selected tab's value.

## R8
WHEN `ResultsScreen` mounts, the system SHALL initialize the active status
tab to **All**.

## R9
The system SHALL provide a score threshold slider with an integer range from
`0` to `100` inclusive.

## R10
WHEN `ResultsScreen` mounts, the system SHALL initialize the score threshold
slider to `0`.

## R11
WHEN the score threshold is greater than `0`, the system SHALL exclude jobs
whose `score` is `NULL` from the filtered list.

## R12
WHEN the score threshold is greater than `0`, the system SHALL include only
jobs whose `score` is greater than or equal to the threshold value.

## R13
WHEN the score threshold is `0`, the system SHALL include jobs regardless of
`score`, including jobs with `NULL` scores.

## R14
WHEN jobs are loaded, the system SHALL render keyword filter chips for each
distinct `keyword` value present among the loaded jobs, sorted alphabetically.

## R15
WHEN no keyword chips are selected, the system SHALL not filter jobs by
keyword.

## R16
WHEN one or more keyword chips are selected, the system SHALL include only
jobs whose `keyword` matches at least one selected chip.

## R17
WHEN status, score threshold, and keyword filters are all active, the system
SHALL apply them together so a job appears only when it satisfies every active
filter.

## R18
WHILE rendering a job in the list, the system SHALL display at minimum the
job `title`, `company`, `location`, `score`, `status`, `keyword`, `board`
name, and `posted_date` formatted in the user's locale when parseable.

## R19
WHEN a job's `score` is a number, the system SHALL render a score badge whose
background color is **green** when `score >= 75`, **yellow** when
`50 <= score <= 74`, and **red** when `score < 50`.

## R20
WHEN a job's `score` is `NULL`, the system SHALL render a muted score badge
displaying **—** instead of a numeric score.

## R21
WHEN the user activates a job card's expand control, the system SHALL reveal
an expanded section for that job without navigating away from `/results`.

## R22
WHILE a job card is expanded, the system SHALL display a description snippet
derived from the job's `description` field truncated to at most `400`
characters with an ellipsis when truncated.

## R23
WHEN a job card is expanded, the system SHALL load that job's activities by
invoking `window.api.invoke('db:query', …)` with a parameterized `SELECT` from
`activities` where `job_id` matches, ordered by `created_at` descending.

## R24
WHILE a job card is expanded, the system SHALL render an activity log listing
each activity's `type`, `notes`, and `created_at` formatted in the user's
locale.

## R25
WHEN no activities exist for an expanded job, the system SHALL display an
empty activity log message.

## R26
WHILE a job card is expanded, the system SHALL render status change controls
for every status value defined in R5 except **All**, with the job's current
`status` visually indicated as selected.

## R27
WHEN the user selects a status change control for an expanded job, the system
SHALL update that job's `status` via `db:query`, insert an `activities` row
with `type` `'status_change'` and `notes` describing the new status, refresh
the job in the list, and refresh the activity log for that job.

## R28
WHILE a job card is expanded, the system SHALL provide a note input and an
**Add note** action.

## R29
WHEN the user submits a non-empty trimmed note for an expanded job, the system
SHALL insert an `activities` row with `type` `'note'` and the trimmed text as
`notes`, clear the note input, and refresh the activity log for that job.

## R30
IF the user submits an empty note after trimming THEN the system SHALL
display a validation message and SHALL NOT insert an activity row.

## R31
WHEN an expanded job has a non-null `match_reason`, the system SHALL display
the `match_reason` text in the expanded section.

## R32
WHEN an expanded job has an external `url`, the system SHALL render a link
that opens the job posting in the system default browser via
`window.api.invoke('fs:openPath', url)` or equivalent external-open behavior
documented in `design.md`.

## R33
WHEN `db:query` returns `{ error: string }`, the system SHALL surface the
error to the user without crashing the renderer.

## R34
The system SHALL use only Tailwind CSS and shadcn/ui components for the
Results UI; it SHALL NOT introduce CSS Modules or CSS-in-JS.

## R35
The system SHALL use parameterized SQL for every `db:query` call; user-supplied
values SHALL NOT be interpolated into SQL strings.

## R36
WHEN the user collapses an expanded job card, the system SHALL hide the
expanded section and SHALL retain the collapsed summary row in the filtered
list order.

## R37
WHEN filter controls change, the system SHALL update the visible job list
without reloading jobs from the database unless a mutation occurred.
