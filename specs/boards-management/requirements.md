# Requirements — boards-management

## R1
WHEN `BoardsScreen` mounts, the system SHALL load all rows from the `boards`
table of the active profile database by invoking
`window.api.invoke('db:query', { sql, params })` with a parameterized
`SELECT` ordered by `name` ascending.

## R2
WHILE one or more boards exist, the system SHALL render each board showing
`name`, `url`, and `search_selector` (displaying a dash or equivalent placeholder
when `search_selector` is `null`).

## R3
WHEN no boards exist for the active profile, the system SHALL render an empty
state with a message prompting the user to add a board.

## R4
WHEN the user activates the add-board control, the system SHALL open a form
with fields for `name` (required), `url` (required), and `search_selector`
(optional).

## R5
WHEN the user submits a new board with non-empty trimmed `name` and `url`,
the system SHALL insert a row into `boards` via `db:query` and refresh the
board list to include the new row.

## R6
WHEN the user activates edit on an existing board, the system SHALL open the
same form pre-filled with that board's current `name`, `url`, and
`search_selector` values.

## R7
WHEN the user submits an edit with non-empty trimmed `name` and `url`, the
system SHALL update the matching `boards` row via `db:query` and refresh the
list to reflect the changes.

## R8
WHEN the user activates delete on a board, the system SHALL show a
confirmation step before executing the deletion.

## R9
WHEN the user confirms deletion of a board with no dependent `jobs` rows, the
system SHALL delete the `boards` row via `db:query` and remove it from the
rendered list.

## R10
IF the user submits a board with an empty `name` or empty `url` after
trimming THEN the system SHALL display a validation message and SHALL NOT
persist the change.

## R11
IF an insert or update violates the `boards.url` UNIQUE constraint THEN the
system SHALL display a user-visible error and SHALL NOT alter other boards.

## R12
IF a delete fails because `jobs` rows reference the board (foreign-key
constraint) THEN the system SHALL display a user-visible error explaining
that the board cannot be deleted while jobs exist, and SHALL leave the board
in the list.

## R13
WHEN `search_selector` is omitted or blank on create or update, the system
SHALL persist `NULL` in the `search_selector` column.

## R14
WHEN `db:query` returns `{ error: string }`, the system SHALL surface the
error to the user without crashing the renderer.

## R15
The system SHALL use only Tailwind CSS and shadcn/ui components for the boards
UI on `BoardsScreen`; it SHALL NOT introduce CSS Modules or CSS-in-JS.

## R16
The system SHALL render `url` and `search_selector` values with the
`font-mono` family (JetBrains Mono via `--font-mono`).

## R17
The system SHALL use parameterized SQL for every `db:query` call; user-supplied
values SHALL NOT be interpolated into SQL strings.
