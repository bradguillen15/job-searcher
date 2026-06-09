# Traceability — project-scaffold

## Requirement → Test Map

| Requirement | Description | Test |
|---|---|---|
| R1 | Electron app with main + renderer | `tests/renderer/App.test.tsx > App > mounts without throwing` (renderer boots via React); main process wiring verified by file structure |
| R2 | React 18 + Vite renderer | `tests/renderer/App.test.tsx > App > mounts without throwing` |
| R3 | TypeScript strict mode | `tsconfig.json` has `"strict": true`; both tsconfig.main.json and vite.config.ts inherit it |
| R4 | dotenv in main process | `src/main/index.ts` imports `dotenv/config` as first line |
| R5 | BrowserWindow 1200×800, title "Job Scout" | `src/main/index.ts` — minWidth/minHeight/title; smoke-tested manually (T14) |
| R6 | contextBridge, no direct ipcRenderer exposure | `src/main/preload.ts` uses `contextBridge.exposeInMainWorld` |
| R7 | `invoke('db:query', ...)` exposed | `tests/main/ipc-handler.test.ts > validateChannel > accepts db:query` |
| R8 | `invoke('scraper:run', ...)` exposed | `tests/main/ipc-handler.test.ts > validateChannel > accepts scraper:run` |
| R9 | `invoke('ollama:list', ...)` exposed | `tests/main/ipc-handler.test.ts > validateChannel > accepts ollama:list` |
| R10 | `invoke('fs:openPath', ...)` exposed | `tests/main/ipc-handler.test.ts > validateChannel > accepts fs:openPath` |
| R11 | `on('scraper:progress', cb)` exposed | `src/main/preload.ts` — `api.on` implementation |
| R12 | electron-builder dmg for macOS | `electron-builder.config.js` mac target dmg |
| R13 | electron-builder nsis for Windows | `electron-builder.config.js` win target nsis |
| R14 | `dev` script | `package.json` scripts.dev — concurrently + wait-on |
| R15 | `build` script | `package.json` scripts.build — vite build + tsc + electron-builder |
| R16 | `test` script | `package.json` scripts.test — vitest run + tsx --test |
| R17 | CSS variables dark theme | `src/renderer/styles/tokens.css` — --color-bg, --color-surface, --color-text, --color-accent |
| R18 | Inter font loaded | `src/renderer/styles/global.css` imports `@fontsource/inter` |
| R19 | JetBrains Mono font loaded | `src/renderer/styles/global.css` imports `@fontsource/jetbrains-mono` |
| R20 | Dev mode loads Vite URL | `src/main/index.ts` — `NODE_ENV === "development"` → `win.loadURL(VITE_DEV_URL)` |
| R21 | Prod mode loads compiled index.html | `src/main/index.ts` — else branch → `win.loadFile(indexPath)` |
| R22 | Unknown channel rejects with UnknownChannelError | `tests/main/ipc-handler.test.ts > validateChannel > rejects unknown channel with UnknownChannelError` |
| R23 | tsconfig.json base + tsconfig.main.json override | Files present: `tsconfig.json`, `tsconfig.main.json` |
| R24 | i18next + react-i18next integrated | `tests/renderer/App.test.tsx > App > renders app title from translations` |
| R25 | Locale files at `src/renderer/locales/<lang>/translation.json` | `src/renderer/locales/en/translation.json` present |
| R26 | i18next init with `lng: "en"`, `fallbackLng: "en"` | `src/renderer/i18n.ts` init options |
| R27 | `useTranslation` hook available | `src/renderer/App.tsx` uses `useTranslation`; tested via `tests/renderer/App.test.tsx` |

## Test Execution Results

- `npx vitest run`: 2 passed (App mounts, App renders title)
- `npx tsx --require ./tests/main/electron-mock.cjs --test tests/main/ipc-handler.test.ts`: 8 passed (UnknownChannelError × 3, validateChannel × 5) — test now imports real `UnknownChannelError` and `validateChannel` from `src/main/ipc-handler.ts`; electron is mocked via `tests/main/electron-mock.cjs` CJS preloader
- `npx tsc --noEmit`: 0 errors — `tsconfig.json` updated with `jsx: react-jsx`, `lib: [ES2020, DOM]`, `moduleResolution: bundler`
- `./init.sh`: exit 0 (steps 4, 4b, 4c all green)

## Files Created

- `package.json`
- `tsconfig.json`
- `tsconfig.main.json`
- `vite.config.ts`
- `electron-builder.config.js`
- `.env.example`
- `src/main/index.ts`
- `src/main/preload.ts`
- `src/main/ipc-handler.ts`
- `src/renderer/index.html`
- `src/renderer/main.tsx`
- `src/renderer/App.tsx`
- `src/renderer/vite-env.d.ts`
- `src/renderer/i18n.ts`
- `src/renderer/locales/en/translation.json`
- `src/renderer/styles/tokens.css`
- `src/renderer/styles/global.css`
- `tests/main/ipc-handler.test.ts`
- `tests/renderer/App.test.tsx`
