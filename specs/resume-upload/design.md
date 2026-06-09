# Design — resume-upload

## Scope

This feature implements **resume file upload, text extraction, and persistence**
on the existing `ResumeScreen` at `/resume` (placeholder from
`navigation-layout`). It adds main-process file I/O and two new npm dependencies
(`pdf-parse`, `mammoth`). It does **not** generate `skill_profile` content —
that belongs to the `ai-matching` feature; uploads store `skill_profile` as
`NULL` and the UI shows a placeholder until AI populates it.

Legacy Word `.doc` files, drag-and-drop upload, editing salary/company fields,
and multi-resume history are **out of scope**.

## Files created or modified

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `pdf-parse`, `mammoth`; dev types if needed |
| `src/main/resume-extract.ts` | Create | Format-specific text extraction from buffers |
| `src/main/resume.ts` | Create | Upsert resume row; orchestrate dialog + extract + persist |
| `src/main/ipc-handler.ts` | Modify | Register `resume:upload` handler |
| `src/main/preload.ts` | Modify | Add `resume:upload` to `ApiChannel` |
| `docs/architecture.md` | Modify | Document `resume:upload` in IPC table |
| `src/renderer/types/resume.ts` | Create | `Resume` record type matching DB columns |
| `src/renderer/lib/resume-db.ts` | Create | Parameterized `db:query` helper to load resume |
| `src/renderer/screens/ResumeScreen.tsx` | Modify | Upload UI, empty state, resume metadata display |
| `tests/main/resume-extract.test.ts` | Create | Unit tests for PDF/DOCX/TXT extraction |
| `tests/main/resume.test.ts` | Create | Upsert + IPC handler tests with `:memory:` DB |
| `tests/renderer/resume-db.test.ts` | Create | Mocked `window.api` tests for load SQL |
| `tests/renderer/ResumeScreen.test.tsx` | Create | UI integration tests |
| `tests/main/ipc-handler.test.ts` | Modify | Assert `resume:upload` is an allowed channel |

## Data model

```ts
// src/renderer/types/resume.ts
export interface Resume {
  id: number;
  filename: string;
  raw_text: string;
  skill_profile: string | null;
  current_company: string | null;
  current_salary: number | null;
  target_salary: number | null;
  search_mode: string | null;
  updated_at: string; // ISO-8601 UTC
}
```

Column mapping matches `001_initial.sql`. The application treats the table as
**single-row per profile** (architecture.md); re-upload replaces the prior row.

## Main-process modules

### `src/main/resume-extract.ts`

Pure extraction helpers (no Electron, no DB). Accept `Buffer` + extension.

```ts
export class ResumeExtractError extends Error {
  constructor(message: string);
}

export function extractTextFromBuffer(
  buffer: Buffer,
  extension: "pdf" | "docx" | "txt"
): string;
```

| Extension | Library | Notes |
|-----------|---------|-------|
| `pdf` | `pdf-parse` | Await promise; trim result |
| `docx` | `mammoth.extractRawText` | Use `value` from result; trim |
| `txt` | `buffer.toString("utf-8")` | Trim |

After extraction, reject if `text.trim().length === 0` with
`ResumeExtractError("No text could be extracted from this file.")`.

Unsupported extension → `ResumeExtractError("Unsupported file type. Use PDF, DOCX, or TXT.")`.

### `src/main/resume.ts`

Orchestrates dialog, filesystem read, extraction, and DB write using the active
`db` singleton from `db.ts`.

```ts
export type ResumeUploadResult =
  | { cancelled: true }
  | { resume: ResumeRow }
  | { error: string };

export interface ResumeRow {
  id: number;
  filename: string;
  raw_text: string;
  skill_profile: string | null;
  current_company: string | null;
  current_salary: number | null;
  target_salary: number | null;
  search_mode: string | null;
  updated_at: string;
}

export async function uploadResume(): Promise<ResumeUploadResult>;
```

**Flow inside `uploadResume()`:**

1. `dialog.showOpenDialog` with `properties: ["openFile"]` and filter
   `{ name: "Resume", extensions: ["pdf", "docx", "txt"] }`.
2. If `canceled` or no `filePaths[0]` → `{ cancelled: true }`.
3. `fs.readFileSync(filePath)` in main process.
4. Derive extension from path (`path.extname`, lowercased, strip dot).
5. Call `extractTextFromBuffer(buffer, extension)`.
6. In a transaction: `DELETE FROM resume`; `INSERT INTO resume (filename, raw_text, skill_profile, current_company, current_salary, target_salary, search_mode, updated_at) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, ?)` with `[basename, rawText, new Date().toISOString()]`.
7. `SELECT` the inserted row by `lastInsertRowid` and return `{ resume }`.
8. Catch `ResumeExtractError` and filesystem errors → `{ error: message }`.

Use `path.basename(filePath)` for `filename` (not full path).

### IPC

| Channel | Direction | Payload | Returns | Handler |
|---------|-----------|---------|---------|---------|
| `resume:upload` | renderer → main | none | `ResumeUploadResult` | `uploadResume()` |

Add to `ALLOWED_CHANNELS` / `ApiChannel`. Remove `resume:upload` from the
generic stub loop in `registerIpcHandlers()`.

**Load path (renderer):** existing `db:query` — no new read channel.

```ts
// src/renderer/lib/resume-db.ts
export class ResumeDbError extends Error { ... }

export async function getResume(): Promise<Resume | null>;
```

SQL: `SELECT id, filename, raw_text, skill_profile, current_company, current_salary, target_salary, search_mode, updated_at FROM resume ORDER BY updated_at DESC LIMIT 1`

Returns `null` when the result array is empty.

## UI composition

```
ResumeScreen
├── loading state (initial fetch)
├── error banner (role="alert") on IPC/DB failure
├── empty state (R2): message + Upload button
└── resume present (R13–R14)
    ├── filename (heading or labeled row)
    ├── upload date (formatted `updated_at`, e.g. locale date string)
    ├── skill_profile section: text block if non-null; placeholder if null
    └── Upload / Replace button (re-invokes `resume:upload`)
```

- Use shadcn `Button`, `Card` (or equivalent layout primitives already in repo).
- Do **not** display full `raw_text` on screen (may be large); it is stored for
  downstream `ai-matching` only. Optional truncated preview is out of scope.
- After successful upload, call `getResume()` again to refresh (R15).
- Profile switch: rely on React Router remount when navigating away/back, or
  listen for profile changes if `ProfileSwitcher` already triggers reload —
  simplest acceptable approach: refetch on mount and after upload; document in
  implementer notes that switching profile via `ProfileSwitcher` reloads the
  window (`location.reload()` in `ProfileSwitcher`) so R21 is satisfied.

## Error mapping (renderer)

| Source | User message |
|--------|--------------|
| `{ cancelled: true }` | No message (silent) |
| `{ error: "No text could be extracted..." }` | Show as-is |
| `{ error: "Unsupported file type..." }` | Show as-is |
| Other `{ error }` from `resume:upload` | Sanitized error text |
| `{ error }` from `db:query` on load | Generic load failure message |

## Dependencies

Add to `dependencies`:

- `pdf-parse` — PDF text extraction (main process only)
- `mammoth` — DOCX text extraction (main process only)

Add `@types/pdf-parse` to `devDependencies` if the package ships without types.

Both are justified by the feature description in `feature_list.json`; no ORM or
extra layers.

## Discarded alternative: split `fs:pickFile` + `fs:readText` channels

Expose a file-picker IPC that returns a path to the renderer, then a second
channel to read and extract.

**Discarded because:**

1. Violates the architecture boundary — the renderer should never receive
   filesystem paths or perform I/O (R18).
2. Two round-trips and large `raw_text` would cross IPC twice unnecessarily.
3. A single `resume:upload` handler keeps upload atomic (extract + persist).

## Discarded alternative: renderer persists via `db:query` after extract IPC

`resume:extract` returns `{ filename, rawText }`; renderer runs INSERT/DELETE.

**Discarded because:**

1. Sends potentially large resume text to the renderer only to send SQL back to
   main — wasteful and error-prone.
2. Main process already owns `db`; atomic replace belongs in one transaction
   on the main side.
3. Read-only access via `db:query` from renderer remains acceptable (established
   pattern from `boards-management` / `keywords-management`).

## Discarded alternative: repurpose `fs:openPath` stub

`fs:openPath` is listed in architecture as a stub for opening paths in the OS
(e.g. reveal in Finder), not for reading file contents.

**Discarded because:** semantics differ; mixing upload logic into `fs:openPath`
would confuse future settings/DB-path features.

## Discarded alternative: `textract` unified extractor

Single library supporting many formats.

**Discarded because:** pulls native bindings and heavier install footprint;
ROADMAP explicitly names `pdf-parse` + `mammoth`; TXT needs no library.

## Test strategy

| Test file | Covers |
|-----------|--------|
| `resume-extract.test.ts` | R7–R11 — fixture buffers for minimal PDF/DOCX/TXT; empty PDF; unsupported ext |
| `resume.test.ts` | R5, R6, R12 — upsert replaces prior row; cancelled dialog mock; `:memory:` DB |
| `resume-db.test.ts` | R1, R16, R19 — SELECT SQL/params; empty → null; error propagation |
| `ResumeScreen.test.tsx` | R2–R3, R13–R16, R20 — empty state; upload invokes IPC; displays metadata; placeholder for null skill_profile; error banner |
| `ipc-handler.test.ts` | R17 — `validateChannel("resume:upload")` |

Main-process extraction tests use small committed fixtures under
`tests/fixtures/resume/` (minimal valid PDF, DOCX, TXT, and empty PDF). Avoid
mocking `pdf-parse`/`mammoth` when real tiny fixtures suffice.

Dialog and `fs.readFile` in `uploadResume()` are tested by injecting optional
dependencies or extracting `_readAndExtract(filePath: string)` helper tested
directly with fixture paths in temp dirs (deterministic, no Electron dialog in
CI).
