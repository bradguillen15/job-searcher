# Tasks — boards-management

- [x] T1 — Add shadcn components: `input`, `label`, `dialog`, `alert-dialog` via `pnpm dlx shadcn@latest add …`. Covers: R15.

- [x] T2 — Create `src/renderer/types/board.ts` with the `Board` interface matching DB columns. Covers: R1, R2.

- [x] T3 — Create `src/renderer/lib/boards-db.ts` with `listBoards`, `createBoard`, `updateBoard`, `deleteBoard` using parameterized `db:query` and error mapping for UNIQUE / FK failures. Covers: R1, R5, R7, R9, R11, R12, R14, R17.

- [x] T4 — Create `src/renderer/components/boards/BoardForm.tsx`: controlled fields for `name`, `url`, `search_selector`; client validation for empty name/url after trim; mono font on url and selector; submit/cancel callbacks. Covers: R4, R6, R10, R13, R16.

- [x] T5 — Create `src/renderer/components/boards/BoardList.tsx`: render rows with name, url, selector placeholder; Edit and Delete actions; empty-state message when list is empty. Covers: R2, R3.

- [x] T6 — Rewrite `src/renderer/screens/BoardsScreen.tsx`: heading, Add button, `BoardList`, Dialog for add/edit (`BoardForm`), AlertDialog for delete confirmation, load boards on mount, refresh after mutations, surface errors. Covers: R4, R5, R6, R7, R8, R9, R14, R15.

- [x] T7 — Write `tests/renderer/boards-db.test.ts`: mock `window.api.invoke`; verify list SQL/params; create/update/delete success paths; UNIQUE and FK error messages; blank selector stored as null. Covers: R1, R5, R7, R9, R11, R12, R14, R17.

- [x] T8 — Write `tests/renderer/BoardsScreen.test.tsx`: empty state; list rendering; add flow inserts and shows new board; edit flow updates row; delete confirm removes row; validation blocks empty submit; duplicate URL shows error; FK delete shows error; mono styling on url/selector. Covers: R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R16.

- [x] T9 — Run `pnpm test` and `npx tsc --noEmit`; both pass with zero errors. Write traceability map (`R<n>` → test name) to `progress/impl_boards-management.md`. Covers: all R.
