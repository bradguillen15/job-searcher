# Implementation — keywords-management

## Status

Implementation complete. All tasks in `specs/keywords-management/tasks.md` marked `[x]`.
`./init.sh` passes (61 renderer + 24 main tests, tsc clean).
Feature **not** marked `done` in `feature_list.json` — awaiting reviewer.

## Files created

| File | Purpose |
|------|---------|
| `src/renderer/components/ui/switch.tsx` | shadcn Switch for active toggle (T1) |
| `src/renderer/types/keyword.ts` | `Keyword` interface (T2) |
| `src/renderer/lib/keywords-db.ts` | Parameterized CRUD helpers (T3) |
| `src/renderer/components/keywords/KeywordForm.tsx` | Add-keyword form (T4) |
| `src/renderer/components/keywords/KeywordList.tsx` | List with Switch + delete (T5) |
| `tests/renderer/keywords-db.test.ts` | Unit tests for db layer (T7) |
| `tests/renderer/setup.ts` | PointerEvent polyfill for jsdom Switch tests |

## Files modified

| File | Change |
|------|--------|
| `src/renderer/screens/BoardsScreen.tsx` | Keywords section below boards (T6) |
| `tests/renderer/BoardsScreen.test.tsx` | Keywords integration tests; board mocks handle keyword list (T8) |
| `vite.config.ts` | Added `setupFiles` for test polyfill |

## Traceability map (R → test)

| Req | Test(s) |
|-----|---------|
| R1 | `keywords-db > listKeywords > invokes db:query with list SQL and empty params`; `BoardsScreen > keywords > shows keywords empty state when no keywords exist` (mount load) |
| R2 | `BoardsScreen > keywords > renders keyword rows with text and active switch` |
| R3 | `BoardsScreen > keywords > shows keywords empty state when no keywords exist` |
| R4 | `BoardsScreen > keywords > add flow inserts and shows new keyword` |
| R5 | `keywords-db > createKeyword > inserts with active default 1 and fetches new row`; `BoardsScreen > keywords > add flow inserts and shows new keyword` |
| R6 | `keywords-db > setKeywordActive > updates active with parameterized SQL when enabling`; `keywords-db > setKeywordActive > updates active with 0 when disabling`; `BoardsScreen > keywords > toggle switches active state` |
| R7 | `BoardsScreen > keywords > delete confirm removes keyword row` |
| R8 | `keywords-db > deleteKeyword > deletes with parameterized SQL`; `BoardsScreen > keywords > delete confirm removes keyword row` |
| R9 | `BoardsScreen > keywords > validation blocks empty keyword submit` |
| R10 | `keywords-db > createKeyword > maps UNIQUE constraint failure to user message`; `BoardsScreen > keywords > duplicate keyword shows error` |
| R11 | `keywords-db > deleteKeyword > maps FOREIGN KEY constraint failure`; `BoardsScreen > keywords > FK delete shows error and keeps keyword` |
| R12 | `keywords-db > listKeywords > throws KeywordsDbError when db:query returns error` |
| R13 | `BoardsScreen > keywords > renders inactive keyword with muted styling` |
| R14 | Switch component from shadcn; keywords UI uses Tailwind + shadcn only (verified by component imports in KeywordForm, KeywordList, BoardsScreen) |
| R15 | `keywords-db > createKeyword > trims keyword before insert`; all db tests assert parameterized `params` arrays |

## Verification

```
./init.sh          → OK (all tests + tsc)
pnpm test:renderer → 61 passed
npx tsc --noEmit   → 0 errors
```
