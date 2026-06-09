# Requirements — keywords-management

## R1
WHEN `BoardsScreen` mounts, the system SHALL load all rows from the `keywords`
table of the active profile database by invoking
`window.api.invoke('db:query', { sql, params })` with a parameterized
`SELECT` ordered by `keyword` ascending.

## R2
WHILE one or more keywords exist, the system SHALL render each keyword showing
its `keyword` text and an active/inactive control reflecting the `active`
column value.

## R3
WHEN no keywords exist for the active profile, the system SHALL render an empty
state with a message prompting the user to add a keyword.

## R4
WHEN the user activates the add-keyword control, the system SHALL open a form
with a single required field for `keyword`.

## R5
WHEN the user submits a new keyword with non-empty trimmed `keyword` text, the
system SHALL insert a row into `keywords` with `active` set to `1` via
`db:query` and refresh the keyword list to include the new row.

## R6
WHEN the user toggles the active/inactive control for a keyword, the system
SHALL update the matching `keywords.active` value via `db:query` and refresh
the list to reflect the new state.

## R7
WHEN the user activates delete on a keyword, the system SHALL show a
confirmation step before executing the deletion.

## R8
WHEN the user confirms deletion of a keyword with no dependent `jobs` rows, the
system SHALL delete the `keywords` row via `db:query` and remove it from the
rendered list.

## R9
IF the user submits a keyword with empty `keyword` text after trimming THEN the
system SHALL display a validation message and SHALL NOT persist the change.

## R10
IF an insert violates the `keywords.keyword` UNIQUE constraint THEN the system
SHALL display a user-visible error and SHALL NOT alter other keywords.

## R11
IF a delete fails because `jobs` rows reference the keyword (foreign-key
constraint) THEN the system SHALL display a user-visible error explaining that
the keyword cannot be deleted while jobs exist, and SHALL leave the keyword
in the list.

## R12
WHEN `db:query` returns `{ error: string }`, the system SHALL surface the
error to the user without crashing the renderer.

## R13
WHILE a keyword's `active` value is `0` (false), the system SHALL render that
row with visually distinct inactive styling (e.g. muted text).

## R14
The system SHALL use only Tailwind CSS and shadcn/ui components for the keywords
UI on `BoardsScreen`; it SHALL NOT introduce CSS Modules or CSS-in-JS.

## R15
The system SHALL use parameterized SQL for every `db:query` call; user-supplied
values SHALL NOT be interpolated into SQL strings.
