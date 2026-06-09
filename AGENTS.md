# AGENTS.md — Navigation map for AI agents

> This file is the **entry point** for any agent working in this repository.
> It is NOT a rulebook: it is a **map**. Read only what you need when you need it (progressive disclosure).

---

## 1. Before starting (mandatory)

1. Run `./init.sh` and verify it finishes without errors. If it fails, **stop**
   and resolve the environment before touching code.
2. Read `progress/current.md` to understand the state of the last session.
3. Read `feature_list.json`. Every new feature (`"sdd": true`) goes through
   **Spec Driven Development** — see `docs/specs.md` and §4 of this file.
4. Read `docs/specs.md` before touching any spec or `sdd: true` feature.

## 2. Repository map

| File / folder                | Contents                                                                    | When to read |
|------------------------------|-----------------------------------------------------------------------------|---------------|
| `feature_list.json`          | Task list with status (`pending` / `spec_ready` / `in_progress` / `done` / `blocked`) | Always, at start |
| `progress/current.md`        | Current session state                                                       | Always, at start |
| `progress/history.md`        | Append-only log of past sessions                                            | If you need historical context |
| `specs/<feature>/`           | `requirements.md` + `design.md` + `tasks.md` (Kiro-style)                  | Before implementing any feature with `"sdd": true` |
| `docs/architecture.md`       | What "doing good work" means in this project                                | Before implementing |
| `docs/conventions.md`        | Style rules, names, structure                                               | Before writing code |
| `docs/specs.md`              | SDD process: EARS notation, the 3 files, human approval gate                | Before drafting or reading a spec |
| `docs/verification.md`       | How to verify your work (includes R<n> traceability)                        | Before declaring a task `done` |
| `CHECKPOINTS.md`             | Objective criteria for "correct final state"                                | For self-evaluation |
| `harness/scripts/`           | Node validation scripts (no Python)                                         | Harness maintenance |
| `.claude/agents/`            | Subagent definitions (`leader`, `spec_author`, `implementer`, `reviewer`)   | If orchestrating work |
| `src/`                       | Application code                                                            | To implement |
| `tests/`                     | Automated tests                                                             | To verify |

## 3. Hard rules (non-negotiable)

- **One feature at a time.** Do not mix changes from multiple tasks in the same session.
- **Do not declare a task `done` without green tests.** Run `./init.sh` and
  ensure the test block passes 100%.
- **Do not skip the spec phase.** Every feature with `"sdd": true` must go
  through `spec_author` and get human approval before touching code.
- **Do not skip the human approval gate.** The leader stops the flow
  at `spec_ready` and waits.
- **Document what you do** in `progress/current.md` while working, not at the end.
- **Leave the repository clean** before closing the session (see §5).
- **If you don't know something, look in `docs/`** before inventing it.

## 4. Workflow (SDD)

```
pending → [spec_author] → spec_ready → ⏸ HUMAN → in_progress → [implementer → reviewer] → done
```

1. The leader detects the first `pending` feature with `"sdd": true`.
2. The leader launches `spec_author`, which creates
   `specs/<name>/{requirements,design,tasks}.md` and marks the status as `spec_ready`.
3. **Pause.** The human reads the spec in `specs/<name>/` and approves (or requests changes).
4. Once approved, the leader changes the status to `in_progress` and launches `implementer`.
5. The implementer executes `tasks.md` one by one, marking them `[x]`.
6. The reviewer verifies `R<n>` ↔ test traceability and that tasks are complete;
   approves or rejects.
7. If approved, the implementer marks `done` and moves the summary to `progress/history.md`.

## 5. Session close (lifecycle)

Before finishing:

1. Run `./init.sh` — all green.
2. If the task is done: mark `status: "done"` in `feature_list.json`.
3. Move the summary from `progress/current.md` to the end of `progress/history.md`.
4. Clear `progress/current.md` leaving only the template.
5. Do not leave temporary files, debug `console.log` calls, or TODOs without context.

## 6. If you get blocked

- Re-read the relevant section of `docs/`.
- If the tool does not do what you expect, **do not invent a workaround**:
  document the block in `progress/current.md` and stop the session.
