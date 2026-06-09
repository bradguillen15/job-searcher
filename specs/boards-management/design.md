# Design — boards-management

## Scope

This feature implements **boards CRUD only** on `BoardsScreen` (`/boards`).
The sidebar label remains "Boards & Keywords"; keywords CRUD is deferred to
`keywords-management` (priority 4). `BoardsScreen` SHALL show a boards section
with a heading; no keywords UI in this feature.

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `src/renderer/types/board.ts` | Create | `Board` record type matching DB columns |
| `src/renderer/lib/boards-db.ts` | Create | Parameterized `db:query` helpers for boards CRUD |
| `src/renderer/components/boards/BoardForm.tsx` | Create | Add/edit form (name, url, search_selector) |
| `src/renderer/components/boards/BoardList.tsx` | Create | Table or card list with edit/delete actions |
| `src/renderer/screens/BoardsScreen.tsx` | Modify | Replace placeholder with boards section |
| `src/renderer/components/ui/input.tsx` | Add (shadcn) | Text inputs |
| `src/renderer/components/ui/label.tsx` | Add (shadcn) | Form labels |
| `src/renderer/components/ui/dialog.tsx` | Add (shadcn) | Add/edit modal |
| `src/renderer/components/ui/alert-dialog.tsx` | Add (shadcn) | Delete confirmation |
| `tests/renderer/boards-db.test.ts` | Create | Unit tests for SQL helpers (mocked `window.api`) |
| `tests/renderer/BoardsScreen.test.tsx` | Create | Integration tests for list, CRUD, errors |

No changes to `src/main/` — persistence goes through the existing `db:query`
channel on the active profile database opened by `profiles.ts` / `db.ts`.

## Data model

```ts
// src/renderer/types/board.ts
export interface Board {
  id: number;
  name: string;
  url: string;
  search_selector: string | null;
  created_at: string;
}
```

Column mapping matches `001_initial.sql`: `id`, `name`, `url` (UNIQUE),
`search_selector` (nullable), `created_at` (ISO-8601 UTC string from SQLite).

## `boards-db.ts` — renderer data access

Thin wrapper around `window.api.invoke('db:query', …)`. All functions return
typed results or throw / return a discriminated error type derived from
`{ error: string }` responses.

```ts
export type DbQueryError = { error: string };

export async function listBoards(): Promise<Board[]>;

export async function createBoard(input: {
  name: string;
  url: string;
  searchSelector: string | null;
}): Promise<Board>;

export async function updateBoard(
  id: number,
  input: { name: string; url: string; searchSelector: string | null }
): Promise<void>;

export async function deleteBoard(id: number): Promise<void>;
```

### SQL statements (parameterized)

| Operation | SQL | Params |
|-----------|-----|--------|
| List | `SELECT id, name, url, search_selector, created_at FROM boards ORDER BY name ASC` | `[]` |
| Insert | `INSERT INTO boards (name, url, search_selector) VALUES (?, ?, ?)` | `[name, url, selectorOrNull]` |
| Update | `UPDATE boards SET name = ?, url = ?, search_selector = ? WHERE id = ?` | `[name, url, selectorOrNull, id]` |
| Delete | `DELETE FROM boards WHERE id = ?` | `[id]` |

After insert, fetch the new row with
`SELECT … FROM boards WHERE id = ?` using `lastInsertRowid` from the write
response, or re-list and find by id.

Blank `search_selector` input is normalized to `null` before binding.

### Error mapping

| SQLite message (substring) | User message |
|----------------------------|--------------|
| `UNIQUE constraint failed: boards.url` | "A board with this URL already exists." |
| `FOREIGN KEY constraint failed` | "Cannot delete this board while jobs reference it." |
| Other `{ error }` from `db:query` | Generic "Database error" or sanitized `error` text |

## UI composition

```
BoardsScreen
├── heading "Boards"
├── "Add board" Button → opens Dialog with BoardForm (create mode)
├── BoardList
│   ├── empty state (R3)
│   └── per row: name, url (mono), selector (mono or "—"), Edit, Delete
├── Dialog (add/edit) → BoardForm
└── AlertDialog (delete confirm)
```

- **BoardForm** fields: `name` (Input), `url` (Input, `font-mono`), `search_selector`
  (Input, `font-mono`, optional helper text e.g. "CSS selector for search input").
- **Validation** (client-side before IPC): trim fields; reject empty `name` or `url`.
- **Loading / error states**: disable submit while pending; inline alert for
  `db:query` failures (pattern from `ProfileSwitcher` `role="alert"`).

Styling: Tailwind utility classes only; shadcn `Button`, `Input`, `Label`,
`Dialog`, `AlertDialog`.

## IPC

| Channel | Payload | Used by |
|---------|---------|---------|
| `db:query` | `{ sql: string, params: unknown[] }` | `boards-db.ts` |

No new preload channels. Profile isolation is inherited: `db:query` runs against
the active profile DB in the main process.

## Discarded alternative: dedicated `boards:*` IPC handlers

A main-process module (`src/main/boards.ts`) with channels `boards:list`,
`boards:create`, `boards:update`, `boards:delete` would centralize SQL in the
main process.

**Discarded because:**

1. `db:query` is already implemented, allowlisted, and tested (`database-schema`
   R17–R20).
2. Boards CRUD is four straightforward parameterized statements — no domain
   logic that benefits from a main-process module yet.
3. Adding four IPC channels duplicates the preload allowlist and handler
   surface without reducing renderer complexity meaningfully.
4. `docs/architecture.md` principle 1 discourages extra layers until a concrete
   need exists; scraping-engine may later justify board-specific main-process
   helpers, but not for CRUD UI alone.

## Discarded alternative: React Query / SWR for cache

Client-side cache libraries would simplify refetch-after-mutate.

**Discarded because:** a single-screen CRUD flow with manual `listBoards()` after
each mutation is sufficient; adding a dependency violates minimal-dependencies
principle for no measurable gain at this scale.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `boards-db.test.ts` | R1, R5, R7, R9, R11, R12, R14, R17 — mock `window.api.invoke`, assert SQL/params and error mapping |
| `BoardsScreen.test.tsx` | R2–R4, R6, R8, R10–R16 — render with mocked `boards-db` or `window.api`, user-event for add/edit/delete/validation |

Tests use Vitest + Testing Library (`tests/renderer/`), matching
`ProfileSwitcher.test.tsx` IPC mock pattern.
