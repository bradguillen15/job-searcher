# Implementation — navigation-layout

## Traceability

- R1 → `uses createHashRouter and updates location hash on navigation` (router.test.tsx)
- R2 → `renders all six nav items` (AppShell two-column layout)
- R3 → `renders all six nav items`
- R4 → `places Settings in bottom group separated from main nav` (AppShell.test.tsx)
- R5 → `active link has accent classes` (NavItem), `updates active highlight when clicking nav items` (AppShell)
- R6 → `updates active highlight when clicking nav items`
- R7 → `default class is dark`, `initialises from localStorage "light"`
- R8 → `toggles to light`
- R9 → `initialises from localStorage "light"` (applyInitialTheme in main.tsx before render)
- R10 → `renders active profile name`, `renders chevron icon beside active profile name` (ProfileSwitcher.test.tsx)
- R11 → `opens dropdown and lists profiles`
- R12 → `calls profiles:switch with correct id`
- R13 → `shows placeholder text for each route` (Outlet renders route content)
- R14 → `shows placeholder text for each route`
- R15 → `marks sidebar header as draggable for Electron window controls` (Sidebar.test.tsx)
- R16 → `defines --font-sans as Inter and --font-mono as JetBrains Mono` (globals.test.ts)
- R17 → Tailwind + shadcn/ui (globals.css, tailwind.config.ts, components/ui/)
- R18 → `renders icon and label text` (NavItem), `renders icon alongside label for each nav item` (AppShell)

## Verification

```bash
./init.sh
```

All tests pass; TypeScript compiles with no errors.
