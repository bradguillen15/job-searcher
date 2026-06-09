# Tasks — ai-matching

- [x] T1 — Create `src/main/matcher/types.ts`: `AiConfig`, `MatchingResult`, `JobForScoring`, `AiBackendError`, exported constants (`BATCH_SIZE`, `MATCH_REASON_THRESHOLD`, `MAX_MATCH_REASON_CALLS`, defaults). Covers: R9, R12, R13.

- [x] T2 — Create `src/main/matcher/settings.ts` with `loadAiConfig()` reading `settings` table keys with defaults from `design.md`. Covers: R18, R20.

- [x] T3 — Write `tests/main/matcher/settings.test.ts`: missing keys → ollama defaults; stored `ai.backend` and ollama keys honored. Covers: R18, R20.

- [x] T4 — Create `src/main/matcher/backends/types.ts` with `AiBackend` interface. Covers: R24.

- [x] T5 — Create `src/main/matcher/backends/ollama.ts` and `anthropic.ts` using injectable `fetchFn`; map HTTP failures to `AiBackendError`. Covers: R18–R21, R22, R23.

- [x] T6 — Create `src/main/matcher/backends/factory.ts` with `createAiBackend(config, fetchFn?)`. Covers: R18, R19.

- [x] T7 — Write `tests/main/matcher/backends/ollama.test.ts` and `anthropic.test.ts`: request URL/body/headers; missing API key throws. Covers: R18–R21.

- [x] T8 — Create `src/main/matcher/prompts.ts`: Phase 1–3 prompt builders; truncate long resume text. Covers: R6, R9, R13.

- [x] T9 — Create `src/main/matcher/parse.ts`: `parseBatchScores(raw, jobIds)` clamps 0–100; malformed → all zeros. Covers: R10, R11.

- [x] T10 — Write `tests/main/matcher/parse.test.ts`: valid JSON, out-of-range clamp, missing ids, invalid JSON. Covers: R10, R11.

- [x] T11 — Create `src/main/matcher/matcher-db.ts`: resume load/save, unscored jobs, score/reason updates, matched count. Covers: R3, R6, R8, R14, R16.

- [x] T12 — Write `tests/main/matcher/matcher-db.test.ts` with `:memory:` DB and migrations. Covers: R8, R12, R14, R16.

- [x] T13 — Create `src/main/matcher/phases/skill-profile.ts`: cache hit (R5), generate+persist (R6), error/empty handling (R7). Covers: R5, R6, R7.

- [x] T14 — Write `tests/main/matcher/phases/skill-profile.test.ts` with mock backend. Covers: R5, R6, R7.

- [x] T15 — Create `src/main/matcher/phases/batch-score.ts`: chunk by 5, call backend, parse, persist. Covers: R9, R10, R11, R23.

- [x] T16 — Write `tests/main/matcher/phases/batch-score.test.ts`: batches of 1/5/6 jobs; parse failure assigns 0. Covers: R9, R10, R11.

- [x] T17 — Create `src/main/matcher/phases/match-reason.ts`: select ≥70, max 10 calls, persist reasons. Covers: R12, R13, R14, R15.

- [x] T18 — Write `tests/main/matcher/phases/match-reason.test.ts`: ordering, cap 10, failed call leaves NULL. Covers: R12, R13, R14, R15.

- [x] T19 — Create `src/main/matcher/run.ts` orchestrator emitting `matching_*` progress events. Covers: R1, R2, R4, R16, R17, R22.

- [x] T20 — Write `tests/main/matcher/run.test.ts`: no resume skip; phase1 fail skip; happy path sets scores/reasons/totalMatched. Covers: R1–R4, R7, R16, R17.

- [x] T21 — Extend `ProgressEvent`, `ScraperRunResult`, and `run_complete` payload in `src/main/scraper/types.ts` with `totalMatched` and matching event types per `design.md`. Covers: R2, R17.

- [x] T22 — Update `finishRun` in `src/main/scraper/jobs-db.ts` to persist `total_matched`. Covers: R16.

- [x] T23 — Integrate `runMatching` into `src/main/scraper/run.ts` before final `finishRun`; pass `totalMatched` through return value and `run_complete`. Covers: R1, R17.

- [x] T24 — Ensure `dotenv.config()` runs in main entry (`src/main/index.ts`) so `ANTHROPIC_API_KEY` is available. Covers: R21.

- [x] T25 — Update `tests/main/scraper/run.test.ts` to assert matching hook is called on successful scrape (mock `runMatching`). Covers: R1.

- [x] T26 — Update `docs/architecture.md`: matching pipeline summary, settings keys, extended progress events, `totalMatched` on `scraper:run` result. Covers: R2, R17.

- [x] T27 — Add new matcher test paths to `package.json` `test` and `test:main` scripts. Covers: all R.

- [x] T28 — Run `npm test` and `npx tsc --noEmit`; both pass. Write traceability map (`R<n>` → test name) to `progress/impl_ai-matching.md`. Covers: all R.
