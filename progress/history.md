# Historical log (append-only)

> Each time a session closes, its summary is appended here.
> Do not edit past entries. Only append.

---

## 2026-06-08 — Harness bootstrap
- **Agent:** human + Cursor leader
- **Changes:** Copied Harness Engineering scaffold from `harness-sdd`
  (`init.sh`, `CLAUDE.md`, `CHECKPOINTS.md`, `docs/`, `.claude/agents/`,
  `progress/`, empty `feature_list.json`).
- **Result:** harness in place. Add features to `feature_list.json` to start SDD.

---

## 2026-06-08 — project-scaffold (done)
- **Agent:** spec_author → implementer → reviewer
- **Changes:** Electron + React 18 + Vite skeleton with TypeScript strict, IPC bridge (contextBridge preload), electron-builder config (dmg/nsis), CSS tokens (dark default), Inter + JetBrains Mono fonts, i18next + react-i18next i18n setup (en locale). init.sh extended with steps 4b (npm test) and 4c (tsc --noEmit).
- **Tests:** ipc-handler (Node test runner), App render (Vitest + jsdom).
- **Result:** All 14 tasks [x]. Reviewer approved. Status → done.

---

## 2026-06-08 — database-schema (done)
- **Agent:** spec_author → Cursor implementer → reviewer
- **Changes:** better-sqlite3 + types installed; 001_initial.sql (8 tables: schema_migrations + 7 BRD tables); db.ts (MigrationError, openDatabase, PRAGMA foreign_keys, transaction-wrapped migrations); profiles.ts (Profile, ProfileError, listProfiles/createProfile/switchProfile/deleteProfile/loadActiveProfile, profiles.json index, per-profile DB isolation); ipc-handler.ts wired db:query + profiles:* channels; preload.ts updated; docs/architecture.md and docs/conventions.md updated with module map, data flow, profile isolation, DB conventions.
- **Tests:** tests/db.test.ts, tests/profiles.test.ts, extended ipc-handler tests.
- **Result:** All 13 tasks [x]. Reviewer approved. Status → done.

---

## 2026-06-08 — navigation-layout (done)
- **Agent:** leader → implementer → reviewer (2 rounds)
- **Changes:** Tailwind CSS + shadcn/ui init; globals.css with shadcn CSS vars; useTheme hook (dark/light on html); createHashRouter with AppShell/Sidebar/NavItem/ProfileSwitcher; 6 placeholder screens; drag region for Electron; profile switcher via profiles IPC.
- **Tests:** useTheme, NavItem, ProfileSwitcher, AppShell, router, Sidebar, globals + extended coverage for R1–R18.
- **Result:** All 14 tasks [x]. Reviewer approved. Committed and pushed to GitHub.

---

## 2026-06-08 — boards-management (done)
- **Agent:** spec_author → implementer → reviewer
- **Changes:** boards-db.ts CRUD via db:query; BoardForm, BoardList, BoardsScreen with shadcn dialog/alert-dialog; CSS selector per board.
- **Tests:** boards-db.test.ts, BoardsScreen.test.tsx (21 new tests).
- **Result:** All 9 tasks [x]. Reviewer approved.

---

## 2026-06-08 — keywords-management (done)
- **Agent:** spec_author → implementer → reviewer
- **Changes:** keywords-db.ts; KeywordForm/KeywordList on BoardsScreen; active/inactive toggle via shadcn Switch.
- **Tests:** keywords-db.test.ts, KeywordsScreen integration tests.
- **Result:** All 9 tasks [x]. Reviewer approved.
