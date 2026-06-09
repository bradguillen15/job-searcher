# CHECKPOINTS — Final state evaluation

> In multi-agent systems we evaluate the destination, not the path.
> These are objective checkpoints a judge (human or AI) can use to decide
> whether the project is healthy.

## C1 — Harness is complete

- [ ] The 4 base files exist: `AGENTS.md`, `init.sh`, `feature_list.json`,
      `progress/current.md`.
- [ ] The 3 docs exist: `docs/architecture.md`, `docs/conventions.md`,
      `docs/verification.md`.
- [ ] `./init.sh` exits with code 0.

## C2 — State is coherent

- [ ] At most one feature is `in_progress` in `feature_list.json`.
- [ ] Every `done` feature has associated tests that pass.
- [ ] `progress/current.md` is empty (template only) or describes the active
      session (no leftover content from previous sessions).

## C3 — Code respects the architecture

- [ ] `src/` only contains modules documented in `docs/architecture.md`.
- [ ] New dependencies are listed in `package.json` with a documented reason
      in the feature spec (no undeclared deps).
- [ ] No stray debug `console.log` calls, or TODOs without context.

## C4 — Verification is real

- [ ] `tests/` has at least one test file per major module under `src/`.
- [ ] Tests use real temp directories (`fs.mkdtempSync`) or `:memory:` SQLite —
      not filesystem mocks when a temp dir suffices.
- [ ] `pnpm test` reports > 0 tests and all pass (Vitest for renderer,
      Node test runner + `tsx` for main process).
- [ ] Main-process tests that import Electron modules use
      `--require tests/main/electron-mock.cjs`.

## C5 — Session closed cleanly

- [ ] No suspicious untracked files (`*.tmp`, build artifacts outside
      `.gitignore`).
- [ ] `progress/history.md` has an entry for the last completed session.
- [ ] The last feature worked on reflects the correct status in
      `feature_list.json`.

## C6 — Spec Driven Development

- [ ] Every feature with `"sdd": true` in status `spec_ready`, `in_progress`,
      or `done` has a `specs/<name>/` folder with all 3 files:
      `requirements.md`, `design.md`, `tasks.md`.
- [ ] `requirements.md` uses strict EARS notation (see `docs/specs.md`).
- [ ] Every `done` feature with `"sdd": true` has all tasks marked `[x]` in
      `tasks.md`.
- [ ] Each `R<n>` in `requirements.md` is covered by at least one concrete
      test in `tests/`.

---

**How to use this file:** a reviewer agent (`.claude/agents/reviewer.md`)
walks each checkbox, marks `[x]` or `[ ]`, and rejects session close if any
C1–C6 box is unchecked.
