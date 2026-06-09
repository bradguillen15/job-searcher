# Implementation — ai-matching

**Status:** ready for reviewer (R22/R24 fixes)

**Agent:** implementer  
**Date:** 2026-06-08

## Summary

Implemented the three-phase AI matching pipeline in the Electron main process under
`src/main/matcher/`. Wired automatic execution at the end of successful
`scraper:run` via `runMatching()`. Ollama and Anthropic backends share an
`AiBackend` interface with injectable `fetchFn` for tests. Extended progress
events and `ScraperRunResult` with `totalMatched`. All T1–T28 complete;
`./init.sh` green (126 tests).

## Reviewer fixes (CHANGES_REQUESTED)

### R22 — orchestrator skip on Phase 1 failure

Extended `skips phases 2 and 3 when phase 1 fails` in `tests/main/matcher/run.test.ts`:

- Seeds an unscored job (`score IS NULL`) for the run.
- Asserts `result.skipped === true` and `result.totalMatched === 0`.
- Asserts `matching_complete` emitted and **no** `matching_batch` events.
- Asserts job `score` and `match_reason` remain `NULL` after orchestrator returns.

### R24 — main-process boundary executable test

Added `tests/main/matcher/backends/boundary.test.ts`:

- `renderer and preload do not import matcher backends` — scans `src/renderer/` and
  `src/main/preload.ts` for forbidden backend import patterns.
- `createAiBackend resolves from main matcher backends` — factory returns a usable
  main-process backend.
- `runMatching uses main-process createAiBackend when factory omitted` — integration
  path with real `createAiBackend` + mock `fetchFn` confirms HTTP originates in main.

Registered in `package.json` `test` and `test:main` scripts.

## Modules added

| Module | Role |
|--------|------|
| `matcher/types.ts` | Constants, config/result types, `AiBackendError` |
| `matcher/settings.ts` | `loadAiConfig()` from `settings` table |
| `matcher/backends/` | Ollama + Anthropic HTTP clients, factory |
| `matcher/prompts.ts` | Phase 1–3 prompt builders |
| `matcher/parse.ts` | Batch score JSON parse + clamp |
| `matcher/matcher-db.ts` | Resume/job DB helpers |
| `matcher/phases/` | skill-profile, batch-score, match-reason |
| `matcher/run.ts` | Orchestrator + `matching_*` progress events |

## Modified

- `scraper/run.ts` — calls `runMatching` before `finishRun`; `setMatchingRunner()` for tests
- `scraper/jobs-db.ts` — `finishRun` persists `total_matched`
- `scraper/types.ts` — matching progress events + `totalMatched` on result
- `docs/architecture.md` — pipeline, settings keys, IPC payloads
- `package.json` — matcher tests in `test` / `test:main`

## Traceability (R → test)

| Req | Test(s) |
|-----|---------|
| R1 | `invokes matching on successful scrape`; `runMatching orchestrator` suite |
| R2 | `matching_start` / `matching_complete` in orchestrator + scraper lifecycle tests |
| R3 | `loadResume returns latest row by updated_at` |
| R4 | `skips matching when no resume exists` |
| R5 | `uses cached skill_profile without calling backend` |
| R6 | `generates and persists skill profile on cache miss` |
| R7 | `returns error on empty backend response`; `returns error when backend throws` |
| R8 | `loadUnscoredJobs returns only null-score jobs for run` |
| R9 | `scores jobs in batches of five` |
| R10 | `parses valid JSON scores`; `clamps out-of-range scores to 0–100` |
| R11 | `assigns zero on parse failure`; `assigns zero for missing ids on parse failure` |
| R12 | `loadJobsForMatchReason orders by score desc then id asc` |
| R13 | `caps Phase 3 calls at ten jobs` |
| R14 | `updateJobScore and updateJobMatchReason persist values`; `generates reasons for jobs scoring at or above 70` |
| R15 | `leaves match_reason null when backend fails` |
| R16 | `countMatchedJobs counts jobs at or above threshold`; `finishRun sets finished_at and totals` |
| R17 | `invokes matching on successful scrape`; `runs happy path scoring and match reasons` |
| R18 | `returns ollama defaults when keys are missing`; `posts to /api/chat with model and messages` |
| R19 | `honors stored ai.backend and ollama keys`; `posts to messages API with required headers` |
| R20 | `returns ollama defaults when keys are missing`; `honors stored ai.backend and ollama keys` |
| R21 | `throws when API key is missing` |
| R22 | `skips phases 2 and 3 when phase 1 fails` (`tests/main/matcher/run.test.ts`) |
| R23 | `assigns zero when backend throws` (batch-score) |
| R24 | `renderer and preload do not import matcher backends`; `runMatching uses main-process createAiBackend when factory omitted` (`tests/main/matcher/backends/boundary.test.ts`) |
| R25 | Covered by resume-upload feature; matcher reads null `skill_profile` per R6 tests |

## Notes for reviewer

- `setMatchingRunner()` exported from `scraper/run.ts` for orchestrator tests.
- `dotenv/config` already imported in `index.ts` (T24 satisfied).
- Feature status intentionally left `in_progress` per implementer protocol.
