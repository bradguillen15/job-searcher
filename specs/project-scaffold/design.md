# Design — project-scaffold

## Files to create

```
job-searcher/
├── package.json                        # scripts: dev, build, test; all deps
├── tsconfig.json                       # base TS config, strict: true
├── tsconfig.main.json                  # extends base, targets Node/CommonJS for main
├── electron-builder.config.js          # dmg (mac) + nsis (windows)
├── .env.example                        # documented env vars; .env is gitignored
├── vite.config.ts                      # renderer Vite config
├── src/
│   ├── main/
│   │   ├── index.ts                    # Electron main entry: BrowserWindow, app lifecycle
│   │   ├── ipc-handler.ts              # registers ipcMain.handle for all channels
│   │   └── preload.ts                  # contextBridge.exposeInMainWorld('api', {...})
│   └── renderer/
│       ├── index.html                  # Vite entry HTML
│       ├── main.tsx                    # React root: ReactDOM.createRoot
│       ├── App.tsx                     # root component (placeholder)
│       ├── styles/
│       │   ├── global.css              # @import fonts, :root CSS vars, body reset
│       │   └── tokens.css              # --color-bg, --color-surface, --color-text, --color-accent
│       └── vite-env.d.ts               # /// <reference types="vite/client" />
│   └── renderer/
│       └── locales/
│           └── en/
│               └── translation.json    # all English UI strings
│       └── i18n.ts                     # i18next init: lng "en", fallbackLng "en", resources
└── tests/
    ├── main/
    │   └── ipc-handler.test.ts         # Node test runner: channel registration, UnknownChannelError
    └── renderer/
        └── App.test.tsx                # Vitest + jsdom: App mounts without crashing
```

## Key signatures

### `src/main/index.ts`
```ts
import { app, BrowserWindow } from "electron";

function createWindow(): BrowserWindow {
  // minWidth: 1200, minHeight: 800, title: "Job Scout"
  // webPreferences: { preload, contextIsolation: true, nodeIntegration: false }
}

app.whenReady().then(createWindow);
```

### `src/main/preload.ts`
```ts
import { contextBridge, ipcRenderer } from "electron";

export type ApiChannel = "db:query" | "scraper:run" | "ollama:list" | "fs:openPath";

contextBridge.exposeInMainWorld("api", {
  invoke: (channel: ApiChannel, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: "scraper:progress", callback: (...args: unknown[]) => void) => {
    const sub = (_: Electron.IpcRendererEvent, ...a: unknown[]) => callback(...a);
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },
});
```

### `src/main/ipc-handler.ts`
```ts
import { ipcMain } from "electron";

export class UnknownChannelError extends Error {
  constructor(channel: string) {
    super(`Unknown IPC channel: ${channel}`);
    this.name = "UnknownChannelError";
  }
}

const ALLOWED_CHANNELS = ["db:query", "scraper:run", "ollama:list", "fs:openPath"] as const;

export function registerIpcHandlers(): void {
  // Register stub handlers for each channel; unknown channels throw UnknownChannelError
}
```

### CSS variables (`:root` in `tokens.css`)
```css
:root {
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-text: #e2e8f0;
  --color-accent: #6366f1;
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

## Dependency list (prod + dev)

| Package | Role |
|---|---|
| `electron` | Desktop shell |
| `react`, `react-dom` | UI framework |
| `typescript` | Type checker |
| `vite`, `@vitejs/plugin-react` | Renderer build + HMR |
| `electron-builder` | Packaging |
| `dotenv` | .env loading in main |
| `@fontsource/inter` | Inter font |
| `@fontsource/jetbrains-mono` | JetBrains Mono font |
| `vitest`, `@testing-library/react`, `jsdom` | Renderer tests |
| `concurrently` | Run Vite + Electron together in `dev` script |
| `wait-on` | Wait for Vite port before launching Electron in `dev` |
| `i18next`, `react-i18next` | Translations / i18n |
| `electron-vite` (discarded — see below) | — |

### `src/renderer/i18n.ts`
```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

export default i18n;
```

## Alternative discarded

**`electron-vite` all-in-one CLI** was considered instead of a manual Vite + tsc setup. It bundles main, preload, and renderer under a single config and supports HMR for all processes. It was discarded because:
1. It adds a non-trivial abstraction layer that makes the build pipeline harder to debug and customize as scraping and AI features grow.
2. The `tsconfig` handling is opinionated and conflicts with having a single base `tsconfig.json` with per-process overrides as required by R23.
3. `concurrently` + `wait-on` + plain `vite` achieves the same dev experience with full transparency and fewer hidden conventions.
