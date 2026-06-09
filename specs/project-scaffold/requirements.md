# Requirements — project-scaffold

## R1
El sistema DEBE arrancar como una aplicación Electron con un proceso principal (`main`) y un proceso renderer (`renderer`) separados.

## R2
El sistema DEBE usar React 18 y Vite como herramienta de build para el renderer.

## R3
El sistema DEBE tener TypeScript en modo estricto (`"strict": true`) habilitado en todos los procesos (main y renderer).

## R4
El sistema DEBE cargar variables de entorno desde un archivo `.env` en el proceso principal usando `dotenv`.

## R5
CUANDO el proceso main se inicia, el sistema DEBE crear una ventana `BrowserWindow` con tamaño mínimo de 1200×800 píxeles y título "Job Scout".

## R6
El sistema DEBE exponer un preload script que use `contextBridge.exposeInMainWorld` para proveer una API segura al renderer. NO DEBE exponer `ipcRenderer` directamente al renderer.

## R7
El sistema DEBE exponer el canal `invoke('db:query', ...)` a través del preload script.

## R8
El sistema DEBE exponer el canal `invoke('scraper:run', ...)` a través del preload script.

## R9
El sistema DEBE exponer el canal `invoke('ollama:list', ...)` a través del preload script.

## R10
El sistema DEBE exponer el canal `invoke('fs:openPath', ...)` a través del preload script.

## R11
El sistema DEBE exponer el canal `on('scraper:progress', callback)` a través del preload script para que el renderer pueda suscribirse a eventos unidireccionales del main.

## R12
El sistema DEBE incluir configuración de `electron-builder` que genere un instalador `.dmg` para macOS.

## R13
El sistema DEBE incluir configuración de `electron-builder` que genere un instalador `nsis` para Windows.

## R14
El sistema DEBE proveer el script `dev` en `package.json` que arranque simultáneamente el servidor Vite con HMR y el proceso Electron apuntando a la URL de Vite.

## R15
El sistema DEBE proveer el script `build` en `package.json` que compile el renderer con Vite y el main con `tsc`, y luego ejecute `electron-builder`.

## R16
El sistema DEBE proveer el script `test` en `package.json` que ejecute Vitest para los tests del renderer y el Node test runner para los tests del main.

## R17
El sistema DEBE aplicar CSS variables para theming con un tema oscuro como default, incluyendo al menos `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`.

## R18
El sistema DEBE cargar la tipografía Inter desde `@fontsource/inter` en el renderer.

## R19
El sistema DEBE cargar la tipografía JetBrains Mono desde `@fontsource/jetbrains-mono` en el renderer.

## R20
CUANDO la aplicación se inicia en modo `dev`, el sistema DEBE cargar el renderer desde la URL local de Vite (e.g. `http://localhost:5173`).

## R21
CUANDO la aplicación se inicia en modo producción (post `build`), el sistema DEBE cargar el renderer desde el archivo `index.html` compilado.

## R22
SI el proceso principal recibe una invocación IPC con un canal no registrado ENTONCES el sistema DEBE rechazar la promesa con un error nombrado `UnknownChannelError`.

## R23
El sistema DEBE definir un `tsconfig.json` en la raíz que sirva de base, con un `tsconfig.main.json` para el proceso main y un `tsconfig.renderer.json` (o equivalente en Vite) para el renderer.

## R24
El sistema DEBE integrar `i18next` y `react-i18next` en el renderer para soporte de traducciones.

## R25
El sistema DEBE cargar los archivos de traducción desde `src/renderer/locales/<lang>/translation.json`, con inglés (`en`) como idioma por defecto.

## R26
CUANDO el renderer inicializa, el sistema DEBE configurar `i18next` con el idioma `en` por defecto y la opción `fallbackLng: "en"`.

## R27
El sistema DEBE exponer el hook `useTranslation` de `react-i18next` para uso en todos los componentes del renderer.
