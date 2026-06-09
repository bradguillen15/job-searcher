# Tasks — keywords-management

- [x] T1 — Add shadcn component: `switch` via `pnpm dlx shadcn@latest add switch`. Covers: R14.

- [x] T2 — Create `src/renderer/types/keyword.ts` with the `Keyword` interface matching DB columns (`active` as `number` 0 \| 1). Covers: R1, R2.

- [x] T3 — Create `src/renderer/lib/keywords-db.ts` with `listKeywords`, `createKeyword`, `setKeywordActive`, `deleteKeyword` using parameterized `db:query`, `KeywordsDbError`, and error mapping for UNIQUE / FK failures. Covers: R1, R5, R6, R8, R10, R11, R12, R15.

- [x] T4 — Create `src/renderer/components/keywords/KeywordForm.tsx`: controlled `keyword` field; client validation for empty keyword after trim; submit/cancel callbacks. Covers: R4, R9.

- [x] T5 — Create `src/renderer/components/keywords/KeywordList.tsx`: render rows with keyword text, Switch for `active`, muted styling when inactive, Delete action; empty-state message when list is empty. Covers: R2, R3, R13.

- [x] T6 — Extend `src/renderer/screens/BoardsScreen.tsx`: add Keywords section (heading, Add button, `KeywordList`, Dialog for add, AlertDialog for delete), load keywords on mount, refresh after mutations, surface errors. Covers: R4, R5, R6, R7, R8, R12, R14.

- [x] T7 — Write `tests/renderer/keywords-db.test.ts`: mock `window.api.invoke`; verify list/insert/toggle/delete SQL and params; create defaults `active` to 1; UNIQUE and FK error messages; db error propagation. Covers: R1, R5, R6, R8, R10, R11, R12, R15.

- [x] T8 — Extend `tests/renderer/BoardsScreen.test.tsx`: keywords empty state; list rendering; add flow inserts and shows new keyword; toggle switches active state; delete confirm removes row; validation blocks empty submit; duplicate keyword shows error; FK delete shows error; inactive muted styling. Covers: R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R13, R14.

- [x] T9 — Run `pnpm test` and `npx tsc --noEmit`; both pass with zero errors. Write traceability map (`R<n>` → test name) to `progress/impl_keywords-management.md`. Covers: all R.
