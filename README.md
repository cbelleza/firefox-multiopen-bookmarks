# MultiOpen Bookmarks

Firefox WebExtension to select multiple bookmarks and open them together in new tabs.

## Features
- **Multi-select bookmarks** with checkboxes
- **Selection Persistence** - selection is saved in storage and restored when popup reopens
- **Search Highlighting** - matched terms are visually highlighted in search results
- **Select Visible / Clear Selection** for current-list workflows
- **Folder bulk selection** - select/unselect bookmarks in a folder (includes subfolders)
- **Root folder filter** - scope the view to a specific folder
- **Search** by title and URL with real-time filtering
- **Confirmation dialog** when opening more than 10 tabs (configurable)
- **Skip already-open tabs** option (persisted)
- **Bookmark favicons** with local fallback icon
- **Keyboard support** - Escape to close menus
- **Context menu** - right-click on bookmarks for quick actions
- **Set default root folder** - pin a folder as the default view
- **Dark mode support** - automatic theme based on system preference

## Privacy Note
- Favicon images are fetched from `icons.duckduckgo.com` using bookmark hostnames for visual enrichment.
- No personal data is collected or transmitted.

## Keyboard Shortcuts
- **Escape** - Close context menu or dialogs
- **Arrow Up/Down** - Navigate context menu items
- **Enter/Space** - Activate context menu item

## Load in Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` from this project folder

## Project Structure
- `manifest.json` - Extension manifest
- `background.js` / `background.html` - Background script with ESM support
- `popup/*` - Popup view
- `sidebar/*` - Sidebar view
- `options/*` - Options page
- `src/api/*` - Browser API wrappers
- `src/core/*` - Core business logic
- `src/ui/*` - UI components
- `src/utils/*` - Utilities

## Technical Details
- Pure JavaScript (no external dependencies)
- **High-Performance Rendering**: Efficient index reuse and modern CSS containment (`content-visibility: auto`)
- **GPU Acceleration**: Smooth transitions and layouts optimized for system performance
- **Selection Persistence**: Integration with `storage.local`
- **Dynamic DOM**: Efficient updates with DocumentFragment and requestAnimationFrame
- **Optimized Search**: Lowercase memoization for real-time filtering

## Version
1.3.0
