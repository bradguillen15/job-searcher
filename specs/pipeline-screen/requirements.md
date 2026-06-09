# Requirements — pipeline-screen

## R1
WHEN the user navigates to `/pipeline`, the system SHALL render `PipelineScreen`
as the main content area inside the existing `AppShell` layout.

## R2
WHEN `PipelineScreen` mounts, the system SHALL load pipeline jobs by invoking
`window.api.invoke('db:query', …)` with a parameterized `SELECT` that returns
only jobs whose `status` is one of `applying`, `applied`, `interviewing`,
`offer`, `accepted`, or `rejected`.

## R3
WHEN pipeline jobs are loaded, the system SHALL include each job's
`last_activity_at` as the maximum `created_at` among that job's `activities`
rows, or `NULL` when the job has no activities.

## R4
WHILE one or more pipeline jobs exist after loading, the system SHALL render a
kanban board with exactly six columns labeled **Applying**, **Applied**,
**Interviewing**, **Offer**, **Accepted**, and **Rejected**.

## R5
WHEN rendering the kanban board, the system SHALL place each loaded job in the
column whose label matches the job's `status`.

## R6
WHILE rendering jobs within a column, the system SHALL order jobs by
`last_activity_at` descending, with jobs whose `last_activity_at` is `NULL`
after all dated jobs.

## R7
WHILE rendering a pipeline job card, the system SHALL display at minimum the
job `title`, `company`, score badge per results-screen tier rules, and
`last_activity_at` formatted in the user's locale when non-null.

## R8
WHEN a pipeline job's `last_activity_at` is `NULL`, the system SHALL display a
muted **No activity** label on the card.

## R9
WHEN no pipeline jobs exist for the active profile, the system SHALL render an
empty state directing the user to change job statuses on the Results screen to
add jobs to the pipeline.

## R10
WHEN a kanban column contains no jobs, the system SHALL render a
column-specific empty placeholder within that column.

## R11
WHILE rendering a pipeline job card, the system SHALL provide a **Quick add**
control that reveals an inline note input for that job.

## R12
WHEN the user submits a non-empty trimmed note via a job card's quick-add
control, the system SHALL insert an `activities` row with `type` `'note'` and
the trimmed text as `notes`, refresh that job's `last_activity_at` in the UI,
and re-sort the job within its column per R6.

## R13
IF the user submits an empty note after trimming via quick-add THEN the system
SHALL display a validation message and SHALL NOT insert an activity row.

## R14
WHILE rendering a pipeline job card, the system SHALL provide status change
controls for every pipeline status defined in R4.

## R15
WHEN the user selects a status change control for a pipeline job card, the
system SHALL update that job's `status` via `db:query`, insert an `activities`
row with `type` `'status_change'` and `notes` describing the new status, move the
card to the column matching the new status, and refresh that job's
`last_activity_at` in the UI.

## R16
WHEN `db:query` returns `{ error: string }`, the system SHALL surface the
error to the user without crashing the renderer.

## R17
The system SHALL use only Tailwind CSS and shadcn/ui components for the
Pipeline UI; it SHALL NOT introduce CSS Modules or CSS-in-JS.

## R18
The system SHALL use parameterized SQL for every `db:query` call; user-supplied
values SHALL NOT be interpolated into SQL strings.
