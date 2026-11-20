# mono-editor icons

## Best approach
- **Inline SVG strings in TypeScript** (one registry)
- Path: `src/icons/codicons.ts` → `MonoIcons` / `FIND_ICONS` / `MENU_ICONS`
- **Not** internet at runtime
- **Not** required as separate `.svg` files in public/ (npm package + Capacitor path pain)

## Why
- Tree-shakeable / no 404 asset paths
- `currentColor` theming
- Same as current `MENU_ICONS` pattern

## Optional later
- Build step that imports `icons/*.svg` as raw strings (vite `?raw`) — still ends up inlined
