const FOLDER_ICON = "📁";
const FAVICON_PLACEHOLDER = "🔖";

// Common styles
const ROW_BASE_STYLE = "cursor: pointer;";
const TITLE_HOVER_STYLE = "font-weight: bold;";

function getFaviconUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return `https://icons.duckduckgo.com/ip3/${parsed.hostname}.ico`;
  } catch {
    return "";
  }
}

function createFavicon(node) {
  const favicon = document.createElement("img");
  favicon.className = "bookmark-favicon";
  favicon.alt = "";
  favicon.loading = "lazy";

  const fallback = document.createElement("span");
  fallback.className = "bookmark-favicon-fallback";
  fallback.textContent = FAVICON_PLACEHOLDER;
  fallback.setAttribute("aria-hidden", "true");

  const faviconUrl = getFaviconUrl(node.url || "");
  if (!faviconUrl) {
    favicon.style.display = "none";
    return { favicon, fallback };
  }

  favicon.src = faviconUrl;
  fallback.style.display = "none";
  favicon.addEventListener("error", () => {
    favicon.style.display = "none";
    fallback.style.display = "";
  });
  favicon.addEventListener("load", () => {
    fallback.style.display = "none";
  });

  return { favicon, fallback };
}

function createTitle(text, query = "") {
  const span = document.createElement("span");
  span.className = "tree-title";
  span.style.cssText = "cursor: pointer;";

  if (!query || !query.trim()) {
    span.textContent = text;
    return span;
  }

  const term = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(term);
  if (index === -1) {
    span.textContent = text;
    return span;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + term.length);
  const after = text.substring(index + term.length);

  span.textContent = before;
  const mark = document.createElement("mark");
  mark.className = "search-highlight";
  mark.textContent = match;
  span.appendChild(mark);
  span.appendChild(document.createTextNode(after));

  return span;
}

function createFolderItem(node, handlers, isRootFolder, query = "") {
  const row = document.createElement("div");
  row.className = "tree-row tree-row-folder";
  row.style.cssText = "padding-left: 8px; cursor: pointer;";

  const expandIcon = document.createElement("span");
  expandIcon.className = "tree-expand-icon";
  expandIcon.style.cssText = "font-size: 10px; color: #999; margin-right: 4px;";
  expandIcon.textContent = "▶";

  const folderIcon = document.createElement("span");
  folderIcon.className = "folder-icon";
  folderIcon.textContent = FOLDER_ICON;

  const title = document.createElement("span");
  title.className = "tree-title";
  title.textContent = node.title;
  title.style.cssText = "cursor: pointer;";

  // Hover effect
  row.addEventListener("mouseenter", () => { title.style.fontWeight = "bold"; });
  row.addEventListener("mouseleave", () => { title.style.fontWeight = ""; });

  const rootButton = document.createElement("button");
  rootButton.type = "button";
  rootButton.className = `folder-root-btn${isRootFolder ? " is-active" : ""}`;
  rootButton.textContent = isRootFolder ? "📍" : "📌";
  rootButton.title = isRootFolder ? "Current root folder" : "Set as default root folder";
  rootButton.addEventListener("click", (event) => {
    event.stopPropagation();
    handlers.onSetRootFolder(node.id);
  });

  row.addEventListener("click", (event) => {
    const target = event.target;
    if (target === rootButton || target.parentNode === rootButton) return;
    handlers.onNavigateToFolder(node.id);
  });

  row.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    handlers.onOpenFolderContextMenu(node.id, event.clientX, event.clientY);
  });

  row.appendChild(expandIcon);
  row.appendChild(folderIcon);
  row.appendChild(title);
  row.appendChild(rootButton);

  return row;
}

function createBookmarkItem(node, handlers, isSelected, pathLabel = "", query = "") {
  const row = document.createElement("div");
  row.className = "tree-row tree-row-bookmark";
  row.style.cssText = "padding-left: 28px; cursor: pointer;";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isSelected;
  checkbox.setAttribute("aria-label", `Select bookmark ${node.title}`);
  checkbox.addEventListener("click", (event) => event.stopPropagation());
  checkbox.addEventListener("change", () => handlers.onToggleSelection(node.id, checkbox.checked));

  const { favicon, fallback } = createFavicon(node);
  favicon && (favicon.style.cursor = "pointer");
  fallback && (fallback.style.cursor = "pointer");

  const title = document.createElement("span");
  title.className = "tree-title";
  title.textContent = node.title;
  title.style.cssText = "cursor: pointer;";

  // Hover effect
  row.addEventListener("mouseenter", () => { title.style.fontWeight = "bold"; });
  row.addEventListener("mouseleave", () => { title.style.fontWeight = ""; });

  row.addEventListener("click", (event) => {
    const target = event.target;
    if (target === checkbox || target.parentNode === checkbox) return;
    handlers.onToggleSelection(node.id);
  });

  row.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    handlers.onOpenBookmarkContextMenu(node.id, event.clientX, event.clientY);
  });

  row.appendChild(checkbox);
  row.appendChild(fallback);
  row.appendChild(favicon);
  row.appendChild(title);

  if (pathLabel) {
    const path = document.createElement("span");
    path.className = "tree-url";
    path.textContent = pathLabel;
    path.title = pathLabel;
    row.appendChild(path);
  }

  return row;
}

function createSeparatorItem(node) {
  const row = document.createElement("div");
  row.className = "tree-row-separator";
  row.setAttribute("role", "separator");

  const line = document.createElement("hr");
  line.className = "tree-separator";
  row.appendChild(line);

  const label = (node.title || "").trim();
  const shouldShowLabel = label && label !== "(Untitled)";
  if (shouldShowLabel) {
    const text = document.createElement("span");
    text.className = "tree-separator-label";
    text.textContent = label;
    row.appendChild(text);
  }

  return row;
}

function findFolderPath(index, folderId) {
  if (!folderId) return [];

  const path = [];
  let currentId = folderId;

  while (currentId) {
    const node = index.byId.get(currentId);
    if (!node) break;
    path.unshift({ id: node.id, title: node.title });
    currentId = node.parentId;
  }

  return path;
}

function getRelativePath(path, rootFolderId) {
  if (!rootFolderId || !path.length) return path;

  const rootIndex = path.findIndex((item) => item.id === rootFolderId);
  if (rootIndex === -1) return path;

  return path.slice(rootIndex + 1);
}

function getFolderContent(allNodes, index, currentFolderId) {
  if (!currentFolderId) return allNodes;

  const folder = index.byId.get(currentFolderId);
  if (!folder || !folder.children) return [];

  return folder.children;
}

function createBreadcrumbStyle() {
  const style = document.createElement("div");
  style.style.cssText = "display: flex; align-items: center; gap: 4px; padding: 8px; background: #fafafa; border-radius: 6px; margin-bottom: 8px; overflow-x: auto; white-space: nowrap; font-size: 14px;";
  return style;
}

function createBreadcrumbResetButton(handlers) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "breadcrumb-reset-btn";
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.textContent = "↺";
  button.appendChild(span);
  button.title = "Reset view to all bookmarks";
  button.setAttribute("aria-label", "Reset View");
  button.addEventListener("click", () => handlers.onResetView?.());
  return button;
}

function createBreadcrumbSelectButton(handlers, allSelected = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "breadcrumb-select-btn";
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.textContent = allSelected ? "☒" : "☑";
  button.appendChild(span);
  button.title = allSelected ? "Unselect Visible Items" : "Select Visible Items";
  button.setAttribute("aria-label", button.title);
  button.addEventListener("click", () => handlers.onSelectVisible?.());
  return button;
}

function appendBreadcrumbActions(container, handlers, options = {}) {
  const actions = document.createElement("div");
  actions.className = "breadcrumb-actions";
  let hasActions = false;

  if (options.showReset) {
    actions.appendChild(createBreadcrumbResetButton(handlers));
    hasActions = true;
  }

  if (options.showSelect) {
    actions.appendChild(createBreadcrumbSelectButton(handlers, Boolean(options.allVisibleSelected)));
    hasActions = true;
  }

  hasActions && container.appendChild(actions);
}

function createNavButton(text, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.style.cssText = "border: none; background: transparent; padding: 2px 4px; cursor: pointer; border-radius: 4px; font-weight: 600; color: #333;";
  btn.textContent = text;
  btn.addEventListener("mouseenter", () => { btn.style.background = "#ddd"; });
  btn.addEventListener("mouseleave", () => { btn.style.background = "transparent"; });
  btn.addEventListener("click", onClick);
  return btn;
}

function createNavText(text, isLast = false) {
  const span = document.createElement("span");
  span.textContent = text;
  if (isLast) {
    span.style.cssText = "font-weight: 600; color: #333;";
  } else {
    span.style.cssText = "cursor: pointer; color: #555; padding: 2px 6px; border-radius: 4px;";
    span.addEventListener("mouseenter", () => { span.style.background = "#ddd"; span.style.color = "#333"; });
    span.addEventListener("mouseleave", () => { span.style.background = "transparent"; span.style.color = "#555"; });
  }
  return span;
}

export function renderTree(
  container,
  allNodes,
  handlers,
  selectionStore,
  rootFolderId,
  currentFolderId,
  options = {}
) {
  const query = (options.query || "").trim();
  const searchResults = Array.isArray(options.searchResults) ? options.searchResults : [];
  const canSelectVisible = Boolean(options.canSelectVisible);

  // Clear container safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (!allNodes?.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No bookmarks found.";
    container.appendChild(empty);
    return;
  }

  // Use passed index or build one as fallback
  const index = options.index || { byId: new Map() };
  if (!options.index) {
    function buildIndex(nodes) {
      for (const node of nodes) {
        index.byId.set(node.id, node);
        node.children && buildIndex(node.children);
      }
    }
    buildIndex(allNodes);
  }

  if (query) {
    const searchHeader = createBreadcrumbStyle();
    searchHeader.style.marginBottom = "8px";
    appendBreadcrumbActions(searchHeader, handlers, {
      showReset: Boolean(rootFolderId),
      showSelect: canSelectVisible,
      allVisibleSelected: options.allVisibleSelected
    });
    const label = document.createElement("span");
    label.textContent = `Search results for "${query}"`;
    searchHeader.appendChild(label);
    container.appendChild(searchHeader);

    if (!searchResults.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No bookmarks match this search.";
      container.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const item of searchResults) {
      fragment.appendChild(createBookmarkItem(item, handlers, selectionStore.isSelected(item.id), item.pathLabel, query));
    }
    container.appendChild(fragment);
    return;
  }

  // Determine which folder to show content from
  const displayFolderId = currentFolderId || rootFolderId || null;
  const currentPath = currentFolderId ? findFolderPath(index, currentFolderId) : [];
  const relativePath = getRelativePath(currentPath, rootFolderId);

  // Single horizontal breadcrumb row
  const breadcrumb = createBreadcrumbStyle();
  breadcrumb.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    handlers.onOpenBreadcrumbContextMenu(event.clientX, event.clientY);
  });

  appendBreadcrumbActions(breadcrumb, handlers, {
    showReset: Boolean(rootFolderId),
    showSelect: canSelectVisible,
    allVisibleSelected: options.allVisibleSelected
  });

  // Show root folder or "All" button
  if (rootFolderId) {
    const rootFolder = index.byId.get(rootFolderId);
    rootFolder && breadcrumb.appendChild(createNavButton(rootFolder.title, () => handlers.onNavigateToFolder(null)));
  } else {
    const rootBtn = createNavText("All", false);
    rootBtn.addEventListener("click", () => handlers.onNavigateToFolder(null));
    breadcrumb.appendChild(rootBtn);
  }

  // Path items
  for (let i = 0; i < relativePath.length; i++) {
    const sep = document.createElement("span");
    sep.textContent = "/";
    sep.style.color = "#888";
    sep.style.fontSize = "14px";
    breadcrumb.appendChild(sep);
    breadcrumb.appendChild(createNavText(relativePath[i].title, i === relativePath.length - 1));
    if (i < relativePath.length - 1) {
      breadcrumb.lastChild.addEventListener("click", () => handlers.onNavigateToFolder(relativePath[i].id));
    }
  }

  container.appendChild(breadcrumb);

  // Get content to display
  const content = getFolderContent(allNodes, index, displayFolderId);
  const fragment = document.createDocumentFragment();

  for (const item of content) {
    if (item.type === "folder") {
      fragment.appendChild(createFolderItem(item, handlers, item.id === rootFolderId, query));
    } else if (item.type === "bookmark") {
      fragment.appendChild(createBookmarkItem(item, handlers, selectionStore.isSelected(item.id), "", query));
    }
 else if (item.type === "separator") {
      fragment.appendChild(createSeparatorItem(item));
    }
  }

  container.appendChild(fragment);
}
