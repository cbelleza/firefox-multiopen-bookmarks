# MultiOpen Bookmarks

Firefox WebExtension to select multiple bookmarks and open them together in new tabs.

## Features
- **Multi-select bookmarks** with checkboxes
- **Selection Persistence** - saved in `storage.local`, restored on popup/sidebar reopen, synced via `storage.onChanged`
- **Search Highlighting** - all occurrences highlighted (title, case-insensitive)
- **Select Visible / Clear Selection** for current-list workflows
- **Folder bulk selection** - select/unselect bookmarks in a folder (includes subfolders)
- **Root folder filter** - scope the view to a specific folder
- **Search** by title and URL (hostname+path) with real-time filtering (120ms debounce)
- **Confirmation dialog** when opening many tabs (configurable, checks prepared count)
- **Skip already-open tabs** and **Deduplicate URLs** options (persisted)
- **Bookmark favicons** from `icons.duckduckgo.com` with local fallback
- **Keyboard support** - Escape to close menus, Arrow Up/Down + Enter/Space in context menu
- **Context menu** - right-click on bookmarks/folders/breadcrumb
- **Set default root folder** - via 📌 button or Options page, with path validation
- **Live sync** - `bookmarks.onCreated/onRemoved/onChanged/onMoved` auto-refreshes tree, stale selections purged
- **Dark mode support** - automatic via `prefers-color-scheme`

## Privacy Note
- Favicon images are fetched from `icons.duckduckgo.com` using bookmark hostnames for visual enrichment.
- No personal data is collected or transmitted.

## Keyboard Shortcuts
- **Escape** - Close context menu or dialogs
- **Arrow Up/Down** - Navigate context menu items
- **Enter/Space** - Activate context menu item

## Load in Firefox (development)
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` from this project folder
4. Or run `npx web-ext run --source-dir=.` / `npx web-ext run --source-dir=dist` after build

## Build (AMO)
```bash
npm install
./build.sh                # → multiopen-bookmarks-v1.4.0.xpi (minified, linted, tested)
./build.sh --no-minify    # → without terser/cleancss
./build.sh --with-sources # → + multiopen-bookmarks-sources-v1.4.0.zip (required by AMO when minified)
./build.sh --bump patch   # 1.4.0 → 1.4.1  (also updates manifest.json/package.json/README)
./build.sh --bump minor   # 1.4.0 → 1.5.0
./build.sh --bump major   # 1.4.0 → 2.0.0
```
Requires `node`, `zip`, `npx`. `build.sh` runs `npm test` + `web-ext lint` (source + `dist`) and produces only the versioned XPI. Without `--bump` the version is kept.

## Development
```bash
npm install
npm test          # vitest run — 37 tests (bookmark-tree, filter-engine, open-engine, selection-store, helpers)
npm run lint      # eslint 9 flat config
npm run lint:fix  # --fix
npm run check     # lint + test + web-ext lint
```

## Project Structure
- `manifest.json` - Extension manifest (`strict_min_version: 142.0`)
- `background.js` / `background.html` - Background (ESM, `runtime.onInstalled` + ping handler)
- `popup/*` - Popup view (`popup.html` → `shared.css` + `popup.css`)
- `sidebar/*` - Sidebar view
- `options/*` - Options page (threshold, skip/dedup, root folder with live preview)
- `src/api/*` - Browser API wrappers (`bookmarks-api.js`, `tabs-api.js`, `storage-api.js`)
- `src/core/*` - Pure business logic (`bookmark-tree.js`, `filter-engine.js`, `open-engine.js`, `selection-store.js`)
- `src/ui/*` - UI (`bookmarks-app.js`, `tree-renderer.js`, `state.js`, `shared.css` — single source for popup/sidebar)
- `src/utils/*` - Utilities (`constants.js`, `helpers.js`, `logger.js`)
- `test/*` - Vitest suites
- `build.sh` - Reproducible XPI builder
- `icons/*` - Extension icons

## Technical Details
- Pure JavaScript (no runtime dependencies, dev-only: `vitest`, `eslint`, `prettier`, `web-ext`, `terser`, `clean-css-cli`)
- **High-Performance Rendering**: `content-visibility: auto` + `contain-intrinsic-size`, `DocumentFragment` + `requestAnimationFrame`
- **Selection Persistence**: `storage.local` with debounced writes (200ms) + `pagehide`/`visibilitychange` flush
- **Optimized Search**: lowercase memoization, URL `hostname+pathname` cache (4096), debounced input
- **Shared Styles**: `src/ui/shared.css` imported by popup/sidebar/options; no `style.cssText` (only dynamic `hidden`/`left/top` for menu)

## Changelog
- **1.4.0** — Shared styles (`src/ui/shared.css`), multi-occurrence search highlight, fixed `confirmCount` (prepared count), `bookmarks`/`storage` live sync, full Options page, `build.sh` versioned-only XPI with `--bump`, Vitest 37 tests + ESLint/Prettier.
- **1.3.0** — Previous feature set (multi-select, persistence, favicons, context menu, dark mode).

## Version
1.4.0
