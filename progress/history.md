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

---

## 2026-06-08 — resume-upload (done)
- **Agent:** spec_author → implementer → reviewer
- **Changes:** resume.ts main module; resume:upload IPC with pdf-parse + mammoth; ResumeScreen upload UI; DB upsert for resume table.
- **Tests:** resume.test.ts, ResumeScreen tests, IPC tests.
- **Result:** All 14 tasks [x]. Reviewer approved.

---

## 2026-06-08 — scraping-engine (done)
- **Agent:** spec_author → implementer → reviewer (2 rounds)
- **Changes:** Playwright scraper pipeline; scraper:run/provideSelector IPC; scraper:progress events; heuristic search bar + pagination + dedup.
- **Tests:** scraper unit/integration tests (91 main-process tests).
- **Result:** All 24 tasks [x]. Reviewer approved.

---

## 2026-06-08 — ai-matching (done)
- **Agent:** spec_author → implementer → reviewer (2 rounds)
- **Changes:** Three-phase AI pipeline (skill profile, batch scoring, match reasons); Ollama + Anthropic backends; integrated into scraper run.
- **Tests:** matcher unit tests with mocked fetch (126 total).
- **Result:** All 28 tasks [x]. Reviewer approved.

---

## 2026-06-08 — scout-screen (done)
- **Agent:** spec_author → implementer → reviewer (2 rounds)
- **Changes:** ScoutScreen with Run button, date range selector, live progress log, last run timestamp, per-board errors, selector dialog.
- **Tests:** ScoutScreen.test.tsx, useScraperProgress.test.ts.
- **Result:** All 17 tasks [x]. Reviewer approved.

---

## 2026-06-08 — results-screen (done)
- **Agent:** spec_author → implementer → reviewer (2 rounds)
- **Changes:** ResultsScreen with ranked jobs, status tabs, score slider, keyword chips, expandable cards, activity log.
- **Tests:** ResultsScreen, results-styling, jobs-db tests.
- **Result:** All 18 tasks [x]. Reviewer approved.

---

## 2026-06-08 — pipeline-screen (done)
- **Agent:** spec_author → implementer → reviewer
- **Changes:** PipelineScreen kanban view grouped by pipeline status; quick-add activity; last activity date.
- **Tests:** PipelineScreen, pipeline-db tests.
- **Result:** All 13 tasks [x]. Reviewer approved.

---

## 2026-06-08 — settings-screen (done)
- **Agent:** spec_author → implementer → reviewer (2 rounds)
- **Changes:** SettingsScreen with AI backend selector, Ollama URL/models, Anthropic key persistence, theme toggle, default date range, DB path + Open in Finder.
- **Tests:** SettingsScreen, settings-db, settings-env, profiles tests.
- **Result:** All 21 tasks [x]. Reviewer approved.

---

## 2026-06-08 — Autonomous ROADMAP run complete
- **Agent:** leader orchestrating spec_author → implementer → reviewer subagents
- **Repository:** https://github.com/bradguillen15/job-searcher (11 commits: 1 baseline + 10 features)
- **Result:** All 12 features `done`. `./init.sh` green.
