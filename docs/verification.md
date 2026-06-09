# Verification — How to prove the work

> Golden rule: **the agent does not say "it works" — it demonstrates it**.
> Every feature ends with executable evidence, not assertions.

## Level 1 — Unit tests (required)

Every public function in application code has at least one test that:

1. Covers the happy path.
2. Covers at least one error path if the function can fail.

Run tests with the project command:

```bash
pnpm test
```

This runs:

- **Renderer tests** — Vitest (`tests/renderer/`)
- **Main-process tests** — Node test runner via `tsx` with
  `--require tests/main/electron-mock.cjs` (`tests/db.test.ts`,
  `tests/profiles.test.ts`, `tests/main/ipc-handler.test.ts`)

Type-check separately:

```bash
npx tsc --noEmit
```

Or run the full harness check:

```bash
./init.sh
```

## Level 2 — Integration tests (required for UI features)

Features that add renderer screens or user flows are verified with render
tests (Vitest + Testing Library) and, where applicable, real IPC calls
against the main-process handlers.

## Level 3 — Smoke test (optional but recommended)

Before closing a session, run a short end-to-end flow manually or via a
script documented in the feature spec (e.g. `pnpm dev` and exercise the UI).

## Level 4 — Requirements traceability (required for `"sdd": true` features)

Each `R<n>` in `specs/<name>/requirements.md` must map to at least one
concrete test. The reviewer rejects if coverage is missing.

The implementer documents the map in `progress/impl_<name>.md`:

```markdown
## Traceability
- R1 → `creates a default profile on first launch`
- R2 → `throws ProfileError when deleting the active profile`
```

## Anti-patterns (do not do)

- ❌ "I added the handler, it should work." → missing executable test.
- ❌ Test that only checks the function does not throw → must assert concrete output.
- ❌ Mock the filesystem when `fs.mkdtempSync` or `:memory:` works.
- ❌ Mark a feature `done` without passing `./init.sh`.

## Final check before closing

```bash
./init.sh           # must end with [OK] Environment ready
```

If `./init.sh` fails, **do not** mark anything `done`. Note the failure in
`progress/current.md` and set status `blocked` in `feature_list.json`.
