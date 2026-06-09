# Requirements — ai-matching

## R1
WHEN a `scraper:run` invocation completes scraping without a fatal error, the
system SHALL execute the three-phase AI matching pipeline in the Electron main
process for that run's `runId`.

## R2
WHILE the matching pipeline executes, the system SHALL emit progress events on
the existing `scraper:progress` channel using the event types defined in
`design.md`.

## R3
WHEN Phase 1 starts, the system SHALL load the resume row for the active profile
(`SELECT` ordered by `updated_at DESC LIMIT 1`).

## R4
IF no resume row exists THEN the system SHALL skip Phases 2 and 3, emit a
`scraper:progress` log event stating that matching was skipped because no resume
is uploaded, and SHALL set `runs.total_matched` to `0` for the current run.

## R5
WHEN a resume row exists and `skill_profile` is non-null, the system SHALL use
the stored `skill_profile` as the cached profile and SHALL NOT call the AI
backend for Phase 1.

## R6
WHEN a resume row exists and `skill_profile` is null, the system SHALL call the
configured AI backend exactly once to generate a skill profile from
`resume.raw_text`, persist the result to `resume.skill_profile`, and use that
text for subsequent phases in the same session.

## R7
IF Phase 1 AI generation fails or returns empty or whitespace-only text THEN the
system SHALL skip Phases 2 and 3, emit a `scraper:progress` log event with the
failure reason, and SHALL set `runs.total_matched` to `0`.

## R8
WHEN Phase 2 starts, the system SHALL load all jobs for the current `runId`
where `score` is `NULL`.

## R9
WHEN Phase 2 processes jobs, the system SHALL send jobs to the AI backend in
batches of exactly five jobs per call, except the final batch which MAY contain
one to five jobs.

## R10
WHEN Phase 2 receives scores for a batch, the system SHALL persist each score
as an integer in the inclusive range 0–100 on the corresponding `jobs.score`
column.

## R11
IF a batch response cannot be parsed into one score per job in the batch THEN
the system SHALL assign score `0` to every job in that batch, emit a
`scraper:progress` log event describing the parse failure, and continue with the
next batch.

## R12
WHEN Phase 3 starts, the system SHALL select jobs from the current `runId` with
`score` greater than or equal to 70, ordered by `score` descending then `id`
ascending.

## R13
WHEN Phase 3 selects jobs, the system SHALL call the AI backend at most once per
selected job and SHALL cap the total number of Phase 3 calls at ten per matching
session.

## R14
WHEN Phase 3 receives a match reason for a job, the system SHALL persist the
non-empty trimmed text to `jobs.match_reason`.

## R15
IF a Phase 3 call fails or returns empty text for a job THEN the system SHALL
leave `jobs.match_reason` as `NULL` for that job, emit a `scraper:progress` log
event, and continue with the next eligible job until the cap is reached.

## R16
WHEN the matching pipeline finishes, the system SHALL set `runs.total_matched` to
the count of jobs in the current `runId` whose `score` is greater than or equal
to 70.

## R17
WHEN the matching pipeline finishes, the system SHALL include `totalMatched` in
the `run_complete` `scraper:progress` payload and in the successful
`ScraperRunResult` returned from `scraper:run`.

## R18
WHERE the active profile's `settings` row `ai.backend` equals `"ollama"` or is
absent, the system SHALL use the Ollama HTTP API as the AI backend.

## R19
WHERE the active profile's `settings` row `ai.backend` equals `"anthropic"`, the
system SHALL use the Anthropic Messages API as the AI backend.

## R20
WHERE the Ollama backend is selected, the system SHALL read `ollama.base_url`
from `settings` defaulting to `http://localhost:11434` and `ollama.model`
defaulting to `llama3.2` when those keys are absent.

## R21
WHERE the Anthropic backend is selected, the system SHALL read the API key from
the `ANTHROPIC_API_KEY` environment variable loaded via `dotenv`.

## R22
IF the configured AI backend is unreachable or returns an HTTP error during Phase
1 THEN the system SHALL skip Phases 2 and 3 and SHALL surface the error through
`scraper:progress` log events without aborting the overall `scraper:run`
response.

## R23
IF the configured AI backend is unreachable or returns an HTTP error during Phase
2 or Phase 3 THEN the system SHALL assign score `0` to unscored jobs in the
failed batch (Phase 2) or skip the failed job's match reason (Phase 3), emit a
`scraper:progress` log event, and continue processing remaining batches or jobs
where possible.

## R24
The system SHALL NOT invoke the renderer or preload layer for AI HTTP requests;
all backend calls SHALL originate in the main process.

## R25
WHEN `resume:upload` replaces a resume row, the system already sets
`skill_profile` to `NULL`; the next matching session SHALL therefore regenerate
the skill profile per R6 without additional cache-invalidation logic.
