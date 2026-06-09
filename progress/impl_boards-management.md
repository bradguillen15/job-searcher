# Implementation — boards-management

**Feature:** boards-management  
**Status:** awaiting reviewer (not marked `done` in feature_list.json)  
**Verified:** `./init.sh` green (42 renderer + 24 main tests, tsc clean)

## Summary

Implemented boards CRUD on `BoardsScreen`: parameterized `db:query` helpers in
`boards-db.ts`, form/list components, shadcn Dialog/AlertDialog UI, and full
test coverage for list/create/update/delete flows plus error handling.

## R → test traceability

| Requirement | Test(s) |
|-------------|---------|
| R1 — load boards on mount via parameterized SELECT | `boards-db > listBoards > invokes db:query with list SQL and empty params`; `BoardsScreen > shows empty state when no boards exist` (implicit mount load) |
| R2 — render name, url, search_selector per row | `BoardsScreen > renders board rows with name, url, and selector`; `BoardsScreen > shows dash placeholder when search_selector is null` |
| R3 — empty state when no boards | `BoardsScreen > shows empty state when no boards exist` |
| R4 — add-board form with name, url, optional selector | `BoardsScreen > add flow inserts and shows new board` |
| R5 — insert on valid submit and refresh list | `boards-db > createBoard > inserts with parameterized SQL and fetches new row`; `BoardsScreen > add flow inserts and shows new board` |
| R6 — edit opens pre-filled form | `BoardsScreen > edit flow updates row` |
| R7 — update on valid submit and refresh list | `boards-db > updateBoard > updates with parameterized SQL`; `BoardsScreen > edit flow updates row` |
| R8 — delete confirmation step | `BoardsScreen > delete confirm removes row` (AlertDialog confirm) |
| R9 — delete row when no dependent jobs | `boards-db > deleteBoard > deletes with parameterized SQL`; `BoardsScreen > delete confirm removes row` |
| R10 — validation blocks empty name/url | `BoardsScreen > validation blocks empty submit` |
| R11 — UNIQUE url error on insert/update | `boards-db > createBoard > maps UNIQUE constraint failure to user message`; `boards-db > updateBoard > maps UNIQUE constraint failure on update`; `BoardsScreen > duplicate URL shows error` |
| R12 — FK error on delete with jobs | `boards-db > deleteBoard > maps FOREIGN KEY constraint failure`; `BoardsScreen > FK delete shows error and keeps board` |
| R13 — blank selector persisted as NULL | `boards-db > normalizeSearchSelector > stores blank selector as null`; `boards-db > createBoard > inserts with parameterized SQL and fetches new row` (null param) |
| R14 — surface db:query errors without crash | `boards-db > listBoards > throws BoardsDbError when db:query returns error`; `BoardsScreen > duplicate URL shows error`; `BoardsScreen > FK delete shows error and keeps board` |
| R15 — Tailwind + shadcn only | Covered by implementation (shadcn input/label/dialog/alert-dialog/button); no CSS modules |
| R16 — font-mono on url and selector | `BoardsScreen > renders url and selector with font-mono` |
| R17 — parameterized SQL only | `boards-db > listBoards > invokes db:query with list SQL and empty params`; `boards-db > createBoard > inserts with parameterized SQL and fetches new row`; `boards-db > updateBoard > updates with parameterized SQL`; `boards-db > deleteBoard > deletes with parameterized SQL` |

## Files created/modified

- `src/renderer/components/ui/input.tsx` (shadcn)
- `src/renderer/components/ui/label.tsx` (shadcn)
- `src/renderer/components/ui/dialog.tsx` (shadcn)
- `src/renderer/components/ui/alert-dialog.tsx` (shadcn)
- `src/renderer/types/board.ts`
- `src/renderer/lib/boards-db.ts`
- `src/renderer/components/boards/BoardForm.tsx`
- `src/renderer/components/boards/BoardList.tsx`
- `src/renderer/screens/BoardsScreen.tsx`
- `tests/renderer/boards-db.test.ts`
- `tests/renderer/BoardsScreen.test.tsx`
- `tests/renderer/AppShell.test.tsx` (boards route expectation updated)
