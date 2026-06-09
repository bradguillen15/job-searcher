# Design — keywords-management

## Scope

This feature implements **keywords CRUD** on the existing `BoardsScreen`
(`/boards`), below the boards section. The sidebar label remains "Boards &
Keywords" (from `navigation-layout`). The boards section is unchanged; this
feature adds a **Keywords** heading, list, add flow, active toggle, and delete
confirmation.

Keyword text editing after creation is **out of scope** — ROADMAP specifies
add, remove, and active/inactive toggle only. "Update" in CRUD is satisfied by
the `active` toggle.

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `src/renderer/types/keyword.ts` | Create | `Keyword` record type matching DB columns |
| `src/renderer/lib/keywords-db.ts` | Create | Parameterized `db:query` helpers for keywords CRUD |
| `src/renderer/components/keywords/KeywordForm.tsx` | Create | Add form (single `keyword` field) |
| `src/renderer/components/keywords/KeywordList.tsx` | Create | List with active Switch and delete action |
| `src/renderer/screens/BoardsScreen.tsx` | Modify | Add keywords section below boards |
| `src/renderer/components/ui/switch.tsx` | Add (shadcn) | Active/inactive toggle |
| `tests/renderer/keywords-db.test.ts` | Create | Unit tests for SQL helpers (mocked `window.api`) |
| `tests/renderer/BoardsScreen.test.tsx` | Modify | Add keywords integration tests |

No changes to `src/main/` — persistence goes through the existing `db:query`
channel on the active profile database opened by `profiles.ts` / `db.ts`.

## Data model

```ts
// src/renderer/types/keyword.ts
export interface Keyword {
  id: number;
  keyword: string;
  active: number; // SQLite BOOLEAN: 0 | 1
  created_at: string;
}
```

Column mapping matches `001_initial.sql`: `id`, `keyword` (UNIQUE), `active`
(default `1`), `created_at` (ISO-8601 UTC string from SQLite).

UI treats `active === 1` as on and `active === 0` as off. Bind toggles with
integer `0` / `1`, not JavaScript booleans, to match SQLite storage.

## `keywords-db.ts` — renderer data access

Thin wrapper around `window.api.invoke('db:query', …)`. Mirrors `boards-db.ts`
patterns: typed results, `KeywordsDbError`, and error mapping from
`{ error: string }` responses.

```ts
export type DbQueryError = { error: string };

export class KeywordsDbError extends Error {
  constructor(message: string);
}

export async function listKeywords(): Promise<Keyword[]>;

export async function createKeyword(input: {
  keyword: string;
}): Promise<Keyword>;

export async function setKeywordActive(
  id: number,
  active: boolean
): Promise<void>;

export async function deleteKeyword(id: number): Promise<void>;

export function mapDbError(error: string): string;
```

### SQL statements (parameterized)

| Operation | SQL | Params |
|-----------|-----|--------|
| List | `SELECT id, keyword, active, created_at FROM keywords ORDER BY keyword ASC` | `[]` |
| Insert | `INSERT INTO keywords (keyword, active) VALUES (?, 1)` | `[keyword]` |
| Toggle active | `UPDATE keywords SET active = ? WHERE id = ?` | `[0 \| 1, id]` |
| Delete | `DELETE FROM keywords WHERE id = ?` | `[id]` |

After insert, fetch the new row with
`SELECT id, keyword, active, created_at FROM keywords WHERE id = ?` using
`lastInsertRowid` from the write response.

`keyword` input is trimmed before binding. Empty-after-trim is rejected in the
UI before IPC (R9); the DB layer may also trim defensively.

### Error mapping

| SQLite message (substring) | User message |
|----------------------------|--------------|
| `UNIQUE constraint failed: keywords.keyword` | "A keyword with this text already exists." |
| `FOREIGN KEY constraint failed` | "Cannot delete this keyword while jobs reference it." |
| Other `{ error }` from `db:query` | Generic "Database error" or sanitized `error` text |

## UI composition

```
BoardsScreen
├── … existing boards section …
└── Keywords section
    ├── heading "Keywords"
    ├── "Add keyword" Button → opens Dialog with KeywordForm
    ├── KeywordList
    │   ├── empty state (R3)
    │   └── per row: keyword text, Switch (active), Delete
    ├── Dialog (add) → KeywordForm
    └── AlertDialog (delete confirm)
```

- **KeywordForm**: single `keyword` field (`Input` + `Label`); client validation
  rejects empty-after-trim; submit/cancel callbacks.
- **KeywordList**: each row shows keyword text; `Switch` bound to `active`;
  inactive rows use muted styling (`text-muted-foreground` or equivalent);
  Delete button opens parent-managed `AlertDialog`.
- **Toggle**: on Switch change, call `setKeywordActive(id, checked)` immediately
  (optimistic UI optional but not required — refresh-after-mutate is sufficient,
  matching boards pattern).
- **Loading / error states**: separate loading/error state for keywords section
  or shared screen-level error banner; disable submit/toggle while pending;
  inline alert for `db:query` failures (`role="alert"`).

Styling: Tailwind utility classes only; shadcn `Button`, `Input`, `Label`,
`Dialog`, `AlertDialog`, `Switch`.

## IPC

| Channel | Payload | Used by |
|---------|---------|---------|
| `db:query` | `{ sql: string, params: unknown[] }` | `keywords-db.ts` |

No new preload channels. Profile isolation is inherited: `db:query` runs against
the active profile DB in the main process.

## Discarded alternative: separate `/keywords` route

A dedicated `KeywordsScreen` and router entry would isolate keywords from boards.

**Discarded because:**

1. ROADMAP and `navigation-layout` define a single nav item "Boards & Keywords"
   at `/boards`.
2. `boards-management` design explicitly reserved keywords for this feature on
   the same screen.
3. Splitting routes adds router complexity without user benefit for two small
   CRUD sections.

## Discarded alternative: dedicated `keywords:*` IPC handlers

Main-process channels (`keywords:list`, `keywords:create`, etc.) would
centralize SQL in the main process.

**Discarded because:** same rationale as `boards-management` — `db:query` is
implemented, allowlisted, and tested; four parameterized statements do not
justify new IPC surface.

## Discarded alternative: edit keyword text dialog

A full edit form to rename an existing keyword would complete literal CRUD on
the `keyword` column.

**Discarded because:** ROADMAP acceptance criteria specify add, remove, and
active toggle only. Renaming is achievable by delete + add and risks UNIQUE
conflicts with existing jobs references; defer until a user story requests it.

## Discarded alternative: React Query / SWR for cache

Client-side cache libraries would simplify refetch-after-mutate.

**Discarded because:** same as boards — manual `listKeywords()` after each
mutation is sufficient at this scale.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `keywords-db.test.ts` | R1, R5, R6, R8, R10, R11, R12, R15 — mock `window.api.invoke`, assert SQL/params, active default `1`, error mapping |
| `BoardsScreen.test.tsx` (extended) | R2–R4, R7, R9, R13, R14 — render keywords section; add flow; toggle active/inactive; delete confirm; validation; duplicate keyword error; FK delete error; inactive styling |

Tests use Vitest + Testing Library (`tests/renderer/`), matching
`boards-db.test.ts` and existing `BoardsScreen.test.tsx` patterns.
