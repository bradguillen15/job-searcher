# JobScout

Electron + React desktop app for automated job search, scraping, and pipeline
tracking. Uses agent-driven development with Spec Driven Development (SDD).

## Prerequisites

- Node.js 20+
- pnpm

Harness validation uses Node only (see sibling template `../tdd-harness-ts`).

## Setup

```bash
pnpm install
```

If `better-sqlite3` fails to load, approve and rebuild native addons:

```bash
pnpm approve-builds   # select better-sqlite3 if prompted
pnpm rebuild better-sqlite3
```

## Development

```bash
pnpm dev
```

Starts Vite (renderer), TypeScript watch (main), and Electron.

## Tests

```bash
pnpm test              # renderer (Vitest) + main process (Node test runner)
npx tsc --noEmit       # typecheck
./init.sh              # full harness verification
```

Main-process tests load `tests/main/electron-mock.cjs` to stub Electron APIs.

## Build

```bash
pnpm run build:main    # compiles main process + copies SQL migrations
pnpm run build         # full production build
```

## Project docs

| File | Purpose |
|------|---------|
| `AGENTS.md` | Entry point for AI agents |
| `docs/architecture.md` | Module map, data flow, DB schema (Mermaid) |
| `docs/conventions.md` | Code style, DB conventions, test layout |
| `docs/specs.md` | SDD process and EARS requirements |
| `docs/verification.md` | How to prove work is complete |
| `CHECKPOINTS.md` | Objective final-state criteria |

## Agent workflow

```
pending → spec_author → spec_ready → human approval → in_progress → implementer → reviewer → done
```

See `AGENTS.md` and `docs/specs.md` for details.
