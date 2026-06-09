# Implementation — resume-upload

**Feature:** resume-upload  
**Status:** awaiting reviewer (not marked `done` in feature_list.json)  
**Verified:** `./init.sh` green (73 renderer + 38 main tests, tsc clean)

## Summary

Implemented resume upload end-to-end: main-process `resume-extract.ts` (pdf-parse v2 +
mammoth + UTF-8 TXT), `resume.ts` orchestration (native dialog, read, transactional
replace), `resume:upload` IPC, renderer `getResume()` helper, and full `ResumeScreen`
UI with empty state, metadata display, skill-profile placeholder, and replace flow.

## R → test traceability

| Requirement | Test(s) |
|-------------|---------|
| R1 — load resume on mount via parameterized SELECT | `resume-db > getResume > invokes db:query with parameterized SELECT and empty params`; `ResumeScreen > shows empty state when no resume exists` (mount load) |
| R2 — empty state with upload prompt | `ResumeScreen > shows empty state when no resume exists` |
| R3 — upload invokes `resume:upload` | `ResumeScreen > upload button invokes resume:upload`; `ResumeScreen > replace button invokes resume:upload when resume exists` |
| R4 — file dialog filtered to pdf/docx/txt | Covered by `uploadResume()` implementation (`dialog.showOpenDialog` filters); exercised via `resume > uploadResume > persists resume when dialog returns fixture path` |
| R5 — cancel returns `{ cancelled: true }`, no DB change | `resume > uploadResume > returns cancelled when dialog is cancelled`; `ResumeScreen > cancelled upload shows no error` |
| R6 — main-process file read | `resume > readAndExtractFromPath > reads and extracts text from TXT/PDF fixture path`; `resume > uploadResume > persists resume when dialog returns fixture path` |
| R7 — PDF extraction via pdf-parse | `resume-extract > extractTextFromBuffer > extracts text from PDF fixture`; `resume > readAndExtractFromPath > reads and extracts text from PDF fixture path` |
| R8 — DOCX extraction via mammoth | `resume-extract > extractTextFromBuffer > extracts text from DOCX fixture` |
| R9 — TXT read as UTF-8 | `resume-extract > extractTextFromBuffer > extracts text from TXT fixture`; `resume > readAndExtractFromPath > reads and extracts text from TXT fixture path` |
| R10 — empty/whitespace extraction error, no persist | `resume-extract > extractTextFromBuffer > throws ResumeExtractError for empty PDF`; `resume-extract > throws ResumeExtractError for whitespace-only TXT`; `ResumeScreen > shows error banner when resume:upload returns error` |
| R11 — unsupported extension / read failure error | `resume > readAndExtractFromPath > throws ResumeExtractError for unsupported extension` |
| R12 — replace row with NULL fields and ISO `updated_at` | `resume > upsertResumeRow > replaces existing resume row with NULL skill_profile and ISO updated_at`; `resume > uploadResume > persists resume when dialog returns fixture path` |
| R13 — display filename, upload date, skill_profile when set | `ResumeScreen > refreshes and shows filename and upload date after successful upload`; `ResumeScreen > renders skill_profile text when present` |
| R14 — skill_profile NULL placeholder | `ResumeScreen > shows placeholder when skill_profile is null` |
| R15 — refresh after successful upload | `ResumeScreen > refreshes and shows filename and upload date after successful upload` |
| R16 — surface IPC/DB errors without crash | `resume-db > getResume > throws ResumeDbError when db:query returns error`; `ResumeScreen > shows error banner when resume:upload returns error`; `ResumeScreen > shows error when db:query fails on load` |
| R17 — `resume:upload` in allowlist + real handler | `validateChannel > accepts resume:upload`; implementation in `ipc-handler.ts` |
| R18 — renderer does not use fs/path | Covered by design (upload entirely in main process); no renderer fs imports |
| R19 — parameterized SQL for resume reads | `resume-db > getResume > invokes db:query with parameterized SELECT and empty params` |
| R20 — Tailwind + shadcn only | Covered by implementation (`Button`, Tailwind layout); no CSS modules |
| R21 — profile switch reloads resume | Profile switch uses `location.reload()` in `ProfileSwitcher`; `ResumeScreen` refetches on mount |

## Files created/modified

- `package.json` — added `pdf-parse`, `mammoth`, `@types/pdf-parse`; extended test scripts
- `tests/fixtures/resume/sample.pdf`, `empty.pdf`, `sample.docx`, `sample.txt`
- `src/main/resume-extract.ts`
- `src/main/resume.ts`
- `src/main/ipc-handler.ts`
- `src/main/preload.ts`
- `docs/architecture.md`
- `src/renderer/types/resume.ts`
- `src/renderer/lib/resume-db.ts`
- `src/renderer/screens/ResumeScreen.tsx`
- `tests/main/resume-extract.test.ts`
- `tests/main/resume.test.ts`
- `tests/main/ipc-handler.test.ts`
- `tests/renderer/resume-db.test.ts`
- `tests/renderer/ResumeScreen.test.tsx`
- `tests/renderer/AppShell.test.tsx` — resume route expectation updated
- `tests/main/electron-mock.cjs` — added `dialog` mock
- `feature_list.json` — status set to `in_progress` (not `done`)

## Notes

- `pdf-parse` v2 uses `PDFParse` class with `{ data: buffer }` and `getText({ pageJoiner: "" })`
  to avoid page-marker noise in extracted text.
- `raw_text` is stored but not displayed on `ResumeScreen` (reserved for `ai-matching`).
