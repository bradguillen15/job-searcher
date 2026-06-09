# Tasks — project-scaffold

- [x] T1 — Create `package.json` with all dependencies (electron, react, vite, typescript, dotenv, @fontsource/*, electron-builder, vitest, concurrently, wait-on) and scripts `dev`, `build`, `test`. Cubre: R14, R15, R16.

- [x] T2 — Create `tsconfig.json` (base, `strict: true`), `tsconfig.main.json` (extends base, `module: CommonJS`, targets Node), and `vite.config.ts` with `@vitejs/plugin-react`. Cubre: R3, R23.

- [x] T3 — Create `src/main/index.ts`: initialize `BrowserWindow` with `minWidth: 1200`, `minHeight: 800`, title `"Job Scout"`, `contextIsolation: true`, `nodeIntegration: false`, and load URL from Vite in dev or compiled `index.html` in prod. Cubre: R1, R5, R20, R21.

- [x] T4 — Create `src/main/preload.ts`: expose `api.invoke` for channels `db:query`, `scraper:run`, `ollama:list`, `fs:openPath` and `api.on` for channel `scraper:progress` via `contextBridge`. Cubre: R6, R7, R8, R9, R10, R11.

- [x] T5 — Create `src/main/ipc-handler.ts`: define `UnknownChannelError`, register stub `ipcMain.handle` for each allowed channel, and reject with `UnknownChannelError` for unrecognized channels. Cubre: R7, R8, R9, R10, R22.

- [x] T6 — Create `src/renderer/index.html`, `src/renderer/main.tsx`, and `src/renderer/App.tsx` (placeholder component). Cubre: R2.

- [x] T7 — Create `src/renderer/styles/tokens.css` with CSS variables `--color-bg`, `--color-surface`, `--color-text`, `--color-accent` using dark defaults. Cubre: R17.

- [x] T8 — Create `src/renderer/styles/global.css`: import `@fontsource/inter`, `@fontsource/jetbrains-mono`, import `tokens.css`, apply body reset with `font-family: var(--font-sans)`. Cubre: R17, R18, R19.

- [x] T9 — Create `.env.example` documenting placeholder env vars; add `.env` to `.gitignore`; load `.env` in `src/main/index.ts` via `dotenv/config`. Cubre: R4.

- [x] T10 — Create `electron-builder.config.js` with `mac.target: dmg` and `win.target: nsis`. Cubre: R12, R13.

- [x] T11 — Write `tests/main/ipc-handler.test.ts` using the Node test runner: verify each of the four `invoke` channels resolves (or returns stub), and that an unknown channel rejects with `UnknownChannelError`. Cubre: R7, R8, R9, R10, R22.

- [x] T12 — Write `tests/renderer/App.test.tsx` using Vitest + `@testing-library/react` + jsdom: verify `<App />` mounts without throwing. Cubre: R2.

- [x] T13 — Create `src/renderer/locales/en/translation.json` with placeholder keys for all visible UI strings in the scaffold (e.g. `"app.title": "Job Scout"`). Create `src/renderer/i18n.ts` that initializes i18next with `lng: "en"`, `fallbackLng: "en"`, and imports the EN resource. Import `i18n.ts` in `main.tsx` before rendering. Cubre: R24, R25, R26, R27.

- [x] T14 — Smoke-test the `dev` script locally: Vite starts on port 5173, Electron loads it, window title is "Job Scout", minimum size enforced. Cubre: R5, R14, R20.
