# Requirements — resume-upload

## R1
WHEN `ResumeScreen` mounts at route `/resume`, the system SHALL load the resume
row for the active profile by invoking
`window.api.invoke('db:query', { sql, params })` with a parameterized
`SELECT` that returns at most one row from the `resume` table ordered by
`updated_at` descending with `LIMIT 1`.

## R2
WHEN no resume row exists for the active profile, the system SHALL render an
empty state with a message prompting the user to upload a resume and an upload
control.

## R3
WHEN the user activates the upload control, the system SHALL invoke
`window.api.invoke('resume:upload')` to start the upload flow in the main
process.

## R4
WHEN `resume:upload` is invoked in the main process, the system SHALL open a
native file dialog filtered to extensions `pdf`, `docx`, and `txt` only.

## R5
IF the user cancels the file dialog THEN `resume:upload` SHALL return
`{ cancelled: true }` and SHALL NOT modify the `resume` table.

## R6
WHEN the user selects a file with extension `.pdf`, `.docx`, or `.txt`, the
system SHALL read the file from disk exclusively in the main process (not in
the renderer).

## R7
WHEN the selected file has extension `.pdf`, the system SHALL extract plain
text from the file buffer using the `pdf-parse` library.

## R8
WHEN the selected file has extension `.docx`, the system SHALL extract plain
text from the file buffer using the `mammoth` library (`extractRawText`).

## R9
WHEN the selected file has extension `.txt`, the system SHALL read the file
contents as UTF-8 text without additional parsing libraries.

## R10
IF text extraction produces an empty or whitespace-only string THEN the system
SHALL return a user-visible error to the renderer and SHALL NOT persist a
`resume` row.

## R11
IF the selected file has an unsupported extension or cannot be read THEN the
system SHALL return a user-visible error to the renderer and SHALL NOT persist
a `resume` row.

## R12
WHEN text extraction succeeds, the system SHALL persist exactly one resume row
per active profile by replacing any existing row: delete all rows in `resume`,
then insert a new row with `filename` set to the selected file's basename,
`raw_text` set to the extracted text, `skill_profile` set to `NULL`,
`current_company`, `current_salary`, `target_salary`, and `search_mode` set to
`NULL`, and `updated_at` set to the current UTC time as an ISO-8601 string.

## R13
WHEN a resume row exists for the active profile, the system SHALL display the
stored `filename`, the `updated_at` value formatted as the upload date, and the
`skill_profile` text when it is non-null.

## R14
WHEN a resume row exists and `skill_profile` is `NULL`, the system SHALL
display a placeholder indicating that the skill profile is not yet available
(the `ai-matching` feature generates it later).

## R15
WHEN `resume:upload` completes successfully, the system SHALL refresh the
`ResumeScreen` view to show the newly stored resume metadata without requiring
a full application restart.

## R16
IF `resume:upload` or `db:query` returns `{ error: string }` THEN the system
SHALL surface the error to the user on `ResumeScreen` without crashing the
renderer.

## R17
The system SHALL register `resume:upload` in the preload allowlist
(`ApiChannel`) and implement a real handler in `ipc-handler.ts` (not a stub).

## R18
The renderer SHALL NOT use Node.js `fs`, `path`, or direct filesystem APIs to
read resume files.

## R19
The system SHALL use parameterized SQL for every `db:query` call related to
resume reads; user-supplied values SHALL NOT be interpolated into SQL strings.

## R20
The `ResumeScreen` UI SHALL use only Tailwind CSS and shadcn/ui components;
it SHALL NOT introduce CSS Modules or CSS-in-JS.

## R21
WHEN the user switches profiles while `ResumeScreen` is mounted, the system
SHALL reload the resume row from the newly active profile database (via a
remount, explicit refetch, or equivalent) so resume data never leaks across
profiles.
