# Spec Driven Development (SDD)

> This project follows a Kiro-style flow: requirements → design → tasks → code.
> Code is not written until the spec is approved by a human.

## Structure

Every new feature (`"sdd": true` in `feature_list.json`) gets a dedicated
folder as soon as it leaves `pending`:

```
specs/<feature-name>/
├── requirements.md   # WHAT is needed (EARS notation)
├── design.md         # HOW it will be built (technical decisions)
└── tasks.md          # Concrete implementation steps
```

The `feature-name` matches the `name` field in `feature_list.json`.

## Feature states

| State         | Meaning                                                       |
|---------------|---------------------------------------------------------------|
| `pending`     | No spec yet. `spec_author` acts first.                        |
| `spec_ready`  | Spec drafted. Awaiting human approval. Do NOT touch code.     |
| `in_progress` | Spec approved. `implementer` is working.                      |
| `done`        | Green code, `reviewer` approved, session closed.              |
| `blocked`     | Stuck. Reason documented in `progress/current.md`.            |

## Human approval gate

The automated flow stops **once**: when `spec_author` finishes the three
files, marks the feature `spec_ready`, and halts. The human reads
`specs/<feature>/` and says "approved" (or requests changes).

Only then does the `leader` transition `spec_ready → in_progress` and
launch the `implementer`.

```
pending → [spec_author] → spec_ready → ⏸ HUMAN → in_progress → [implementer → reviewer] → done
```

## requirements.md — strict EARS

Requirements are written in **EARS** (Easy Approach to Requirements Syntax).
Each requirement is a numbered paragraph using one of these five patterns:

| Pattern        | Template                                                    |
|----------------|-------------------------------------------------------------|
| **Ubiquitous** | `The system SHALL <action>.`                                |
| **Event**      | `WHEN <trigger>, the system SHALL <action>.`                 |
| **State**      | `WHILE <state>, the system SHALL <action>.`                 |
| **Optional**   | `WHERE <optional feature>, the system SHALL <action>.`      |
| **Unwanted**   | `IF <undesired event> THEN the system SHALL <action>.`       |

Hard rules:

- Each requirement has a stable id: `R1`, `R2`, …
- Each requirement SHALL be verifiable by at least one concrete test.
- Do not combine multiple SHALL statements in one requirement. Split them.
- Do not use weak verbs ("could", "may", "supports"). Only SHALL / SHALL NOT.

Example:

```markdown
## R1
WHEN the renderer invokes `window.api.invoke('profiles:list')`, the system
SHALL return the list of profiles from `profiles.json`.

## R2
IF `deleteProfile` is called on the active profile THEN the system SHALL
throw a `ProfileError` and perform no deletion.
```

## design.md — technical decisions

Capture **before** touching code:

- Which files are created / modified.
- New function, class, and IPC signatures.
- Exceptions reused or added.
- At least one discarded alternative and why.

This is not greenfield architecture — build on `docs/architecture.md` and
`docs/conventions.md`. The `design.md` documents where your feature touches
those boundaries.

## tasks.md — executable checklist

Discrete steps in order, each with a checkbox. Every task references at
least one `R<n>` it covers.

Example:

```markdown
- [ ] T1 — Add `listBoards()` in `src/main/boards.ts`. Covers: R1.
- [ ] T2 — Register `boards:list` IPC handler. Covers: R2.
- [ ] T3 — Add test `listBoards returns empty array for new profile`. Covers: R1.
- [ ] T4 — Add test `createBoard rejects duplicate url`. Covers: R3.
```

The `implementer` marks `[x]` on each task when complete. The `reviewer`
rejects if any `[ ]` remains without documented justification.

## Traceability (hard rule)

- Every test in `tests/` must map to an `R<n>` in its spec.
- Every `R<n>` must have at least one concrete test.
- The `reviewer` checks this mapping explicitly and rejects if coverage is
  missing.

The `implementer` documents the map in `progress/impl_<name>.md`:

```markdown
## Traceability
- R1 → `listBoards returns empty array for new profile`
- R2 → `boards:list IPC returns profile boards`
- R3 → `createBoard rejects duplicate url`
```

## When SDD does not apply

Features with `"sdd": false` or without an `sdd` field have no spec. SDD
applies to new features going forward.
