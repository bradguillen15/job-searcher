# Tasks — resume-upload

- [x] T1 — Add dependencies: `pdf-parse`, `mammoth` (and `@types/pdf-parse` if needed). Covers: R7, R8.

- [x] T2 — Create `tests/fixtures/resume/` with minimal sample `.pdf`, `.docx`, `.txt`, and an empty-text PDF fixture for extraction tests. Covers: R7–R11.

- [x] T3 — Create `src/main/resume-extract.ts` with `ResumeExtractError` and `extractTextFromBuffer(buffer, extension)` for pdf/docx/txt; reject empty whitespace-only output. Covers: R7, R8, R9, R10, R11.

- [x] T4 — Write `tests/main/resume-extract.test.ts`: assert text extracted from fixtures; empty PDF throws; unsupported extension throws. Covers: R7, R8, R9, R10, R11.

- [x] T5 — Create `src/main/resume.ts` with `uploadResume()` (dialog → read → extract → transactional DELETE+INSERT → return row), plus testable helper for read/extract from path. Covers: R4, R5, R6, R12.

- [x] T6 — Write `tests/main/resume.test.ts`: upsert replaces existing row; stores NULL skill_profile and ISO `updated_at`; path helper works on fixtures; cancelled dialog returns `{ cancelled: true }`. Covers: R5, R6, R12.

- [x] T7 — Register `resume:upload` in `preload.ts` (`ApiChannel`), `ipc-handler.ts` (`ALLOWED_CHANNELS` + real handler); update `tests/main/ipc-handler.test.ts` for allowlist. Covers: R17.

- [x] T8 — Update `docs/architecture.md` IPC table: `resume:upload` implemented, note main-process file read. Covers: R17.

- [x] T9 — Create `src/renderer/types/resume.ts` with `Resume` interface. Covers: R1, R13.

- [x] T10 — Create `src/renderer/lib/resume-db.ts` with `getResume()` using parameterized `db:query`, `ResumeDbError`, and error handling. Covers: R1, R16, R19.

- [x] T11 — Write `tests/renderer/resume-db.test.ts`: mock `window.api.invoke`; verify SELECT SQL/params; empty array → null; db error propagation. Covers: R1, R16, R19.

- [x] T12 — Implement `src/renderer/screens/ResumeScreen.tsx`: load on mount; empty state + upload button; display filename, formatted upload date, skill_profile or placeholder; replace upload; error banner; Tailwind/shadcn only. Covers: R2, R3, R13, R14, R15, R16, R20, R21.

- [x] T13 — Write `tests/renderer/ResumeScreen.test.tsx`: empty state; upload calls `resume:upload`; success refresh shows filename/date; null skill_profile shows placeholder; non-null skill_profile renders text; IPC error shows alert; cancelled upload silent. Covers: R2, R3, R13, R14, R15, R16, R20.

- [x] T14 — Run `npm test` and `npx tsc --noEmit`; both pass with zero errors. Write traceability map (`R<n>` → test name) to `progress/impl_resume-upload.md`. Covers: all R.
