# Tasks — navigation-layout

- [x] T1 — Install dependencies: `react-router-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`. Run `pnpm dlx shadcn@latest init` (choose: TypeScript, style=default, base color=slate, globals at `src/renderer/styles/globals.css`, Tailwind config at root). Cubre: R1, R17.

- [x] T2 — Create `tailwind.config.ts`: set `darkMode: "class"`, content paths covering `src/renderer/**/*.{ts,tsx}` and `src/renderer/components/ui/**/*.{ts,tsx}`. Create `postcss.config.js` with tailwindcss + autoprefixer. Cubre: R17.

- [x] T3 — Replace `src/renderer/styles/tokens.css` with `src/renderer/styles/globals.css`: add `@tailwind base/components/utilities`, map JobScout design tokens onto shadcn CSS variable names (dark default in `:root`, light overrides in `.light`). Import `globals.css` in `main.tsx` instead of `tokens.css`. Cubre: R7, R16, R17.

- [x] T4 — Create `src/renderer/hooks/useTheme.ts`: reads `localStorage["theme"]` on init, applies class `"dark"` or `"light"` to `<html>` (shadcn convention), exposes `{ theme, toggleTheme }`. Default is `"dark"`. Cubre: R7, R8, R9.

- [x] T5 — Create `src/renderer/router.tsx` using `createHashRouter` with `AppShell` as the root layout and one route per screen. Cubre: R1, R2, R13, R14.

- [x] T6 — Create six placeholder screen components in `src/renderer/screens/`. Cubre: R14.

- [x] T7 — Create `src/renderer/components/NavItem.tsx`: `<NavLink>` with a lucide icon slot and label; active state applies `text-accent bg-accent/10` Tailwind classes. Cubre: R3, R4, R5, R6, R18.

- [x] T8 — Create `src/renderer/components/ProfileSwitcher.tsx` using shadcn `DropdownMenu`: on mount calls `window.api.invoke('profiles:list')`, renders active profile name + `ChevronDown` icon, switch calls `profiles:switch` + reload, handles IPC rejection with an error state. Cubre: R10, R11, R12.

- [x] T9 — Create `src/renderer/components/Sidebar.tsx`: drag region div with `[-webkit-app-region:drag]` Tailwind arbitrary property, `ProfileSwitcher`, five `NavItem` components, bottom group with theme-toggle `Button` (shadcn) + Settings `NavItem`. Width fixed at `var(--sidebar-width)`. Cubre: R2, R3, R4, R8, R15, R16, R18.

- [x] T10 — Create `src/renderer/components/AppShell.tsx`: flex row with `<Sidebar />` and `<main className="flex-1 overflow-auto"><Outlet /></main>`. Replace `src/renderer/App.tsx` body with `<RouterProvider router={router} />`. Cubre: R1, R2, R13.

- [x] T11 — Write `tests/renderer/useTheme.test.ts`: (a) default class is `dark`, (b) toggles to `light`, (c) persists to localStorage, (d) initialises from localStorage `"light"`. Cubre: R7, R8, R9.

- [x] T12 — Write `tests/renderer/NavItem.test.tsx`: active link has accent classes, inactive does not. Cubre: R5.

- [x] T13 — Write `tests/renderer/ProfileSwitcher.test.tsx`: mock `window.api.invoke`, verify profile name renders, dropdown opens, switch called with correct id, graceful error state on IPC reject. Cubre: R10, R11, R12.

- [x] T14 — Write `tests/renderer/AppShell.test.tsx`: mount full router, all six nav items present, clicking updates active highlight, placeholder text visible per route. Cubre: R2, R3, R4, R6, R13, R14.
