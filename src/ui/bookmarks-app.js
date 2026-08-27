import { getTree } from "../api/bookmarks-api.js";
import { createTabs, getOpenUrls } from "../api/tabs-api.js";
import { getSettings, setSettings, getSelectedBookmarkIds, setSelectedBookmarkIds } from "../api/storage-api.js";
import { buildBookmarkTree, isValidRootFolder, getScopedNodes } from "../core/bookmark-tree.js";
import { filterTree } from "../core/filter-engine.js";
import { openPreparedUrls, prepareUrls } from "../core/open-engine.js";
import { createSelectionStore } from "../core/selection-store.js";
import { renderTree } from "./tree-renderer.js";
import { createUiState } from "./state.js";
import { logError } from "../utils/logger.js";
import { DEFAULT_SETTINGS } from "../utils/constants.js";

const SEARCH_DEBOUNCE_MS = 120;
const SELECTION_PERSIST_MS = 200;

function bindElements(root) {
  return {
    searchInput: root.querySelector("[data-role='search-input']"),
    clearSearchBtn: root.querySelector("[data-role='clear-search-btn']"),
    selectedCountText: root.querySelector("[data-role='selected-count']"),
    clearSelectionBtn: root.querySelector("[data-role='clear-selection-btn']"),
    openSelectedBtn: root.querySelector("[data-role='open-selected-btn']"),
    skipAlreadyOpenToggle: root.querySelector("[data-role='skip-open-toggle']"),
    feedbackText: root.querySelector("[data-role='feedback-text']"),
    treeContainer: root.querySelector("[data-role='tree-container']")
  };
}

function showFeedback(elements, message, type = "info") {
  if (!message) {
    elements.feedbackText.hidden = true;
    elements.feedbackText.textContent = "";
    elements.feedbackText.dataset.type = "info";
    return;
  }

  elements.feedbackText.hidden = false;
  elements.feedbackText.textContent = message;
  elements.feedbackText.dataset.type = type;
}

function createBookmarkContextMenu(root) {
  const menu = document.createElement("div");
  menu.className = "bookmark-context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Bookmark actions");
  menu.hidden = true;

  const actions = [
    { action: "context-folder-toggle", label: "Select Folder" },
    { action: "context-open", label: "Open Link" },
    { action: "context-bulk-toggle", label: "Select Visible" }
  ];

  for (const { action, label } of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.dataset.action = action;
    button.textContent = label;
    menu.appendChild(button);
  }

  const buttons = Array.from(menu.querySelectorAll("button"));
  buttons.forEach((button) => { button.tabIndex = -1; });
  root.appendChild(menu);
  return menu;
}

function showMenuElement(element, shouldShow) {
  element.hidden = !shouldShow;
}

function isFolderInsideRoot(index, folderId, rootFolderId) {
  if (!folderId || !rootFolderId) return true;

  let current = index.byId.get(folderId);
  while (current) {
    if (current.id === rootFolderId) return true;
    current = current.parentId ? index.byId.get(current.parentId) : null;
  }
  return false;
}

export async function initBookmarksApp(rootSelector = "body") {
  const root = document.querySelector(rootSelector);
  if (!root) {
    logError("Bookmarks app root not found:", rootSelector);
    return;
  }

  const elements = bindElements(root);
  const requiredElementKeys = ["searchInput", "openSelectedBtn", "skipAlreadyOpenToggle", "feedbackText", "treeContainer"];

  for (const key of requiredElementKeys) {
    if (!elements[key]) {
      logError(`Required UI element missing: ${key}`);
      return;
    }
  }

  const contextMenu = createBookmarkContextMenu(root);
  let contextTarget = null;
  let redrawRafId = null;
  let searchDebounceId = null;
  let selectionPersistTimer = null;

  function flushSelectionPersist() {
    if (selectionPersistTimer !== null) {
      window.clearTimeout(selectionPersistTimer);
      selectionPersistTimer = null;
    }
    void setSelectedBookmarkIds(selectionStore.getSelectedIds());
  }

  function scheduleSelectionPersist() {
    if (selectionPersistTimer !== null) {
      window.clearTimeout(selectionPersistTimer);
    }
    selectionPersistTimer = window.setTimeout(() => {
      selectionPersistTimer = null;
      void setSelectedBookmarkIds(selectionStore.getSelectedIds());
    }, SELECTION_PERSIST_MS);
  }

  const [rawTree, settings, savedSelectionIds] = await Promise.all([getTree(), getSettings(), getSelectedBookmarkIds()]);
  const { nodes, index } = buildBookmarkTree(rawTree);
  const selectionStore = createSelectionStore(index.bookmarksById);
  if (savedSelectionIds.length) {
    selectionStore.setSelectionMany(savedSelectionIds, true);
  }
  const candidateRootFolderId = String(settings.rootFolderId || "");
  const initialRootFolderId = isValidRootFolder(index, candidateRootFolderId) ? candidateRootFolderId : "";

  if (!isValidRootFolder(index, candidateRootFolderId) && candidateRootFolderId) {
    settings.rootFolderId = "";
    await setSettings({ rootFolderId: "" });
  }

  const candidateCurrentFolderId = String(settings.lastOpenedFolderId || "");
  const initialCurrentFolderId = isFolderInsideRoot(index, candidateCurrentFolderId, initialRootFolderId) ? candidateCurrentFolderId : "";

  const uiState = createUiState({
    nodes,
    query: "",
    settings,
    rootFolderId: initialRootFolderId,
    currentFolderId: initialCurrentFolderId || ""
  });

  function syncSearchUi() {
    if (!elements.clearSearchBtn) return;
    const hasQuery = Boolean(elements.searchInput.value.trim());
    elements.clearSearchBtn.hidden = !hasQuery;
    elements.clearSearchBtn.disabled = !hasQuery;
  }

  syncSearchUi();

  function getCurrentListBookmarkIds(searchResultsOverride) {
    const query = uiState.getState().query.trim();
    if (query) {
      const items = searchResultsOverride !== undefined ? searchResultsOverride : getSearchResultItems();
      return items.map((item) => item.id);
    }

    const state = uiState.getState();
    const canUseCurrent = isFolderInsideRoot(index, state.currentFolderId, state.rootFolderId);
    const displayFolderId = canUseCurrent ? (state.currentFolderId || state.rootFolderId) : state.rootFolderId;

    if (!displayFolderId) {
      return (state.nodes || []).filter((node) => node.type === "bookmark").map((node) => node.id);
    }

    const folder = index.byId.get(displayFolderId);
    const children = folder?.children || [];
    return children.filter((node) => node.type === "bookmark").map((node) => node.id);
  }

  function getSearchResultItems() {
    const state = uiState.getState();
    const query = state.query.trim();
    if (!query) return [];

    const scopedNodes = getScopedNodes(state.nodes, index, state.rootFolderId);
    const filteredNodes = filterTree(scopedNodes, query);
    const results = [];

    function collect(nodes, pathSegments = []) {
      for (const node of nodes) {
        if (node.type === "folder") {
          collect(node.children || [], node.title ? [...pathSegments, node.title] : pathSegments);
          continue;
        }
        if (node.type === "bookmark") {
          results.push({ id: node.id, title: node.title, url: node.url, pathLabel: pathSegments.join(" / ") });
        }
      }
    }

    collect(filteredNodes, []);
    return results;
  }

  function syncCountAndButtons() {
    const selectedCount = selectionStore.getSelectedCount();
    elements.openSelectedBtn.disabled = selectedCount === 0;
    if (elements.selectedCountText) {
      elements.selectedCountText.textContent = `Selected: ${selectedCount}`;
      elements.selectedCountText.dataset.count = selectedCount;
    }
    elements.clearSelectionBtn && (elements.clearSelectionBtn.disabled = selectedCount === 0);
    scheduleSelectionPersist();
  }

  function closeContextMenu() {
    contextMenu.hidden = true;
    contextTarget = null;
  }

  function updateContextMenuLabels(target) {
    const folderToggleButton = contextMenu.querySelector("[data-action='context-folder-toggle']");
    const openButton = contextMenu.querySelector("[data-action='context-open']");
    const bulkToggleButton = contextMenu.querySelector("[data-action='context-bulk-toggle']");
    if (!folderToggleButton || !openButton || !bulkToggleButton) return;

    if (target.type === "folder") {
      const folderBookmarkIds = index.folderBookmarkIds.get(target.id) || [];
      if (!folderBookmarkIds.length) {
        showMenuElement(folderToggleButton, false);
        showMenuElement(openButton, false);
        showMenuElement(bulkToggleButton, false);
        return;
      }

      const selectionStats = selectionStore.getSelectionStats(folderBookmarkIds);
      const allSelected = selectionStats.checked;
      folderToggleButton.textContent = allSelected ? "Unselect Folder" : "Select Folder";
      folderToggleButton.title = "Includes bookmarks from this folder and all subfolders";
      folderToggleButton.setAttribute("aria-label", folderToggleButton.textContent);
      showMenuElement(folderToggleButton, true);
      showMenuElement(openButton, false);
      showMenuElement(bulkToggleButton, false);
      return;
    }

    if (target.type === "bookmark") {
      openButton.textContent = "Open Link";
      openButton.title = "Open this bookmark link";
      openButton.setAttribute("aria-label", openButton.textContent);
      showMenuElement(folderToggleButton, false);
      showMenuElement(openButton, true);
      showMenuElement(bulkToggleButton, false);
      return;
    }

    if (target.type === "breadcrumb") {
      const selectableBookmarkIds = getCurrentListBookmarkIds();
      const selectionStats = selectionStore.getSelectionStats(selectableBookmarkIds);
      const allSelected = selectableBookmarkIds.length > 0 && selectionStats.checked;
      bulkToggleButton.textContent = allSelected ? "Unselect Visible" : "Select Visible";
      bulkToggleButton.title = "Applies only to bookmarks visible in the current list";
      bulkToggleButton.setAttribute("aria-label", bulkToggleButton.textContent);
      showMenuElement(folderToggleButton, false);
      showMenuElement(openButton, false);
      showMenuElement(bulkToggleButton, selectableBookmarkIds.length > 0);
      return;
    }

    contextMenu.hidden = true;
  }

  function openContextMenu(target, x, y) {
    if (target.type !== "bookmark" && target.type !== "breadcrumb" && target.type !== "folder") {
      closeContextMenu();
      return;
    }
    contextTarget = target;
    updateContextMenuLabels(target);
    const visibleItems = contextMenu.querySelectorAll("button:not([hidden])");
    if (!visibleItems.length) {
      closeContextMenu();
      return;
    }
    contextMenu.hidden = false;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = contextMenu.offsetWidth || 180;
    const menuHeight = contextMenu.offsetHeight || 120;
    const left = Math.max(8, Math.min(x, viewportWidth - menuWidth - 8));
    const top = Math.max(8, Math.min(y, viewportHeight - menuHeight - 8));
    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;

    const firstItem = contextMenu.querySelector("button:not([hidden])");
    firstItem && firstItem.focus();
  }

  function redrawTree() {
    const state = uiState.getState();
    const query = state.query.trim();
    const searchResults = query ? getSearchResultItems() : [];
    const visibleIds = getCurrentListBookmarkIds(query ? searchResults : undefined);
    const visibleStats = selectionStore.getSelectionStats(visibleIds);
    const allVisibleSelected = visibleIds.length > 0 && visibleStats.checked;

    renderTree(
      elements.treeContainer,
      state.nodes,
      {
        onToggleSelection: (bookmarkId, isSelected) => {
          const shouldSelect = typeof isSelected === "boolean" ? isSelected : !selectionStore.isSelected(bookmarkId);
          selectionStore.setSelection(bookmarkId, shouldSelect);
          syncCountAndButtons();
          scheduleRedraw();
        },
        onOpenBookmarkContextMenu: (bookmarkId, x, y) => openContextMenu({ type: "bookmark", id: bookmarkId }, x, y),
        onOpenFolderContextMenu: (folderId, x, y) => openContextMenu({ type: "folder", id: folderId }, x, y),
        onOpenBreadcrumbContextMenu: (x, y) => openContextMenu({ type: "breadcrumb", id: "current-list" }, x, y),
        onSelectVisible: () => selectVisibleInCurrentList(),
        onSetRootFolder: async (folderId) => {
          if (folderId === uiState.getState().rootFolderId) return;
          const nextSettings = await setSettings({ rootFolderId: folderId, lastOpenedFolderId: "" });
          uiState.setState({ rootFolderId: String(nextSettings.rootFolderId || ""), currentFolderId: "", settings: nextSettings });
          selectionStore.clearSelection();
          syncCountAndButtons();
          scheduleRedraw();
          showFeedback(elements, "Default root folder updated.", "success");
        },
        onNavigateToFolder: (folderId) => {
          const state = uiState.getState();
          const nextFolderId = folderId || "";
          if (nextFolderId && !isFolderInsideRoot(index, nextFolderId, state.rootFolderId)) {
            showFeedback(elements, "Folder is outside current root scope.", "warning");
            return;
          }
          uiState.setState({ currentFolderId: nextFolderId });
          setSettings({ lastOpenedFolderId: nextFolderId });
          syncCountAndButtons();
          scheduleRedraw();
        },
        onResetView: () => resetRootView()
      },
      selectionStore,
      state.rootFolderId,
      state.currentFolderId,
      { index, query, searchResults, canSelectVisible: visibleIds.length > 0, allVisibleSelected }
    );
  }

  function scheduleRedraw() {
    if (redrawRafId !== null) return;
    redrawRafId = window.requestAnimationFrame(() => {
      redrawRafId = null;
      redrawTree();
    });
  }

  async function handleOpenSelected() {
    try {
      const state = uiState.getState();
      const selectedUrls = selectionStore.getSelectedUrls();
      const preparedUrls = await prepareUrls(selectedUrls, {
        deduplicateUrls: state.settings.deduplicateUrls,
        skipAlreadyOpen: state.settings.skipAlreadyOpen,
        getOpenUrls
      });

      if (preparedUrls.length === 0) {
        showFeedback(elements, "No valid URLs to open.", "warning");
        return;
      }

      showFeedback(elements, `Opening ${preparedUrls.length} tabs...`, "info");

      const result = await openPreparedUrls(preparedUrls, {
        confirmThreshold: state.settings.confirmThreshold,
        confirmCount: preparedUrls.length,
        confirmOpen: async (count) => window.confirm(`Open ${count} selected items now?\n\nClick OK to open or Cancel to abort.`),
        createTabs
      });

      if (result.wasCancelled) {
        showFeedback(elements, "Open cancelled.", "warning");
        return;
      }

      selectionStore.clearSelection();
      syncCountAndButtons();
      scheduleRedraw();
      showFeedback(elements, `Opened ${result.openedCount} tabs.`, "success");
    } catch (error) {
      logError("Failed to open selected bookmarks:", error);
      showFeedback(elements, "Failed to open tabs.", "error");
    }
  }

  async function handleOpenSingleBookmark(bookmarkId) {
    try {
      const url = index.bookmarksById.get(bookmarkId);
      if (!url) {
        showFeedback(elements, "Bookmark URL not found.", "warning");
        return;
      }

      const state = uiState.getState();
      const preparedUrls = await prepareUrls([url], {
        deduplicateUrls: state.settings.deduplicateUrls,
        skipAlreadyOpen: state.settings.skipAlreadyOpen,
        getOpenUrls
      });

      if (!preparedUrls.length) {
        showFeedback(elements, "No valid URL to open.", "warning");
        return;
      }

      await createTabs(preparedUrls);
      showFeedback(elements, "Opened bookmark.", "success");
    } catch (error) {
      logError("Failed to open bookmark:", error);
      showFeedback(elements, "Failed to open bookmark.", "error");
    }
  }

  async function resetRootView() {
    try {
      const nextSettings = await setSettings({ rootFolderId: "", lastOpenedFolderId: "" });
      uiState.setState({ rootFolderId: "", currentFolderId: "", settings: nextSettings });
      selectionStore.clearSelection();
      syncCountAndButtons();
      scheduleRedraw();
      showFeedback(elements, "View reset. Showing all bookmarks.", "info");
    } catch (error) {
      logError("Failed to clear root folder:", error);
      showFeedback(elements, "Failed to clear root folder.", "error");
    }
  }

  function selectVisibleInCurrentList() {
    const visibleIds = getCurrentListBookmarkIds();
    if (!visibleIds.length) {
      showFeedback(elements, "No bookmarks in this list.", "warning");
      return;
    }

    const visibleStats = selectionStore.getSelectionStats(visibleIds);
    const shouldSelect = !visibleStats.checked;
    selectionStore.setSelectionMany(visibleIds, shouldSelect);
    syncCountAndButtons();
    scheduleRedraw();
    showFeedback(elements, shouldSelect ? `Selected ${visibleIds.length} items in this list.` : "Unselected all items in this list.", "success");
  }

  elements.searchInput.addEventListener("input", () => {
    syncSearchUi();
    if (searchDebounceId !== null) {
      window.clearTimeout(searchDebounceId);
    }

    const nextQuery = elements.searchInput.value;
    searchDebounceId = window.setTimeout(() => {
      searchDebounceId = null;
      uiState.setState({ query: nextQuery });
      scheduleRedraw();
      syncCountAndButtons();
    }, SEARCH_DEBOUNCE_MS);
  });

  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener("click", () => {
      if (!elements.searchInput.value) {
        return;
      }
      elements.searchInput.value = "";
      uiState.setState({ query: "" });
      syncSearchUi();
      scheduleRedraw();
      syncCountAndButtons();
      showFeedback(elements, "", "info");
      elements.searchInput.focus();
    });
  }

  elements.skipAlreadyOpenToggle.checked = settings.skipAlreadyOpen;
  elements.skipAlreadyOpenToggle.addEventListener("change", async () => {
    try {
      const nextSettings = await setSettings({
        skipAlreadyOpen: elements.skipAlreadyOpenToggle.checked
      });
      uiState.setState({ settings: nextSettings });
    } catch (error) {
      logError("Failed to update skip-already-open setting:", error);
      showFeedback(elements, "Failed to update setting.", "error");
    }
  });

  elements.openSelectedBtn.addEventListener("click", handleOpenSelected);
  if (elements.clearSelectionBtn) {
    elements.clearSelectionBtn.addEventListener("click", () => {
      selectionStore.clearSelection();
      syncCountAndButtons();
      scheduleRedraw();
      showFeedback(elements, "Cleaned all selected items.", "success");
    });
  }

  contextMenu.addEventListener("click", async (event) => {
    try {
      const action = event.target?.dataset?.action;
      if (!action || !contextTarget) {
        return;
      }

      if (action === "context-open") {
        if (contextTarget.type === "bookmark") {
          await handleOpenSingleBookmark(contextTarget.id);
        }
        closeContextMenu();
        return;
      }

      if (action === "context-folder-toggle" && contextTarget.type === "folder") {
        const folderBookmarkIds = index.folderBookmarkIds.get(contextTarget.id) || [];
        if (!folderBookmarkIds.length) {
          showFeedback(elements, "No bookmarks in this folder.", "warning");
          closeContextMenu();
          return;
        }

        const selectionStats = selectionStore.getSelectionStats(folderBookmarkIds);
        const shouldSelect = !selectionStats.checked;
        selectionStore.setSelectionMany(folderBookmarkIds, shouldSelect);
        syncCountAndButtons();
        scheduleRedraw();
        showFeedback(
          elements,
          shouldSelect
            ? `Selected ${folderBookmarkIds.length} bookmarks from folder.`
            : "Unselected folder bookmarks.",
          "success"
        );
        closeContextMenu();
        return;
      }

      if (action === "context-bulk-toggle" && contextTarget.type === "breadcrumb") {
        const selectableBookmarkIds = getCurrentListBookmarkIds();
        if (!selectableBookmarkIds.length) {
          showFeedback(elements, "No bookmarks in this list.", "warning");
          closeContextMenu();
          return;
        }

        const selectionStats = selectionStore.getSelectionStats(selectableBookmarkIds);
        const allSelected = selectionStats.checked;
        const shouldSelect = !allSelected;
        selectionStore.setSelectionMany(selectableBookmarkIds, shouldSelect);
        syncCountAndButtons();
        scheduleRedraw();
        showFeedback(
          elements,
          shouldSelect
            ? `Selected ${selectableBookmarkIds.length} bookmarks in list.`
            : "Unselected all bookmarks in list.",
          "success"
        );
        closeContextMenu();
      }
    } catch (error) {
      logError("Context menu action failed:", error);
      showFeedback(elements, "Action failed.", "error");
      closeContextMenu();
    }
  });

  contextMenu.addEventListener("keydown", (event) => {
    const items = Array.from(contextMenu.querySelectorAll("button:not([hidden])"));
    if (!items.length) {
      return;
    }

    const currentIndex = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1 + items.length) % items.length;
      items[nextIndex].focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (currentIndex >= 0) {
        items[currentIndex].click();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeContextMenu();
    }
  });

  root.addEventListener("click", (event) => {
    if (!contextMenu.hidden && !contextMenu.contains(event.target)) {
      closeContextMenu();
    }
  });

  root.addEventListener("contextmenu", (event) => {
    if (
      !event.target.closest(".tree-row-bookmark") &&
      !event.target.closest(".tree-row-folder") &&
      !event.target.closest(".tree-breadcrumb") &&
      !event.target.closest(".bookmark-context-menu")
    ) {
      closeContextMenu();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeContextMenu();
    }
  });

  // Keep view in sync when bookmarks change externally
  let reloadDebounceId = null;
  async function reloadBookmarks() {
    try {
      const freshTree = await getTree();
      const rebuilt = buildBookmarkTree(freshTree);
      // Mutate existing index maps to keep selectionStore reference valid
      index.bookmarksById.clear();
      for (const [k, v] of rebuilt.index.bookmarksById) index.bookmarksById.set(k, v);
      index.byId.clear();
      for (const [k, v] of rebuilt.index.byId) index.byId.set(k, v);
      index.folderBookmarkIds.clear();
      for (const [k, v] of rebuilt.index.folderBookmarkIds) index.folderBookmarkIds.set(k, v);

      uiState.setState({ nodes: rebuilt.nodes });

      const state = uiState.getState();
      if (state.rootFolderId && !isValidRootFolder(index, state.rootFolderId)) {
        const nextSettings = await setSettings({ rootFolderId: "", lastOpenedFolderId: "" });
        uiState.setState({ rootFolderId: "", currentFolderId: "", settings: nextSettings });
        showFeedback(elements, "Root folder no longer exists — view reset.", "warning");
      } else if (state.currentFolderId && !isFolderInsideRoot(index, state.currentFolderId, state.rootFolderId)) {
        uiState.setState({ currentFolderId: "" });
        await setSettings({ lastOpenedFolderId: "" });
      }

      // Drop stale selections (bookmarks that no longer exist)
      const currentIds = selectionStore.getSelectedIds();
      const stale = currentIds.filter((id) => !index.bookmarksById.has(id));
      if (stale.length) {
        selectionStore.setSelectionMany(stale, false);
        scheduleSelectionPersist();
      }

      scheduleRedraw();
      syncCountAndButtons();
    } catch (error) {
      logError("Failed to reload bookmarks:", error);
    }
  }

  function scheduleReload() {
    if (reloadDebounceId !== null) window.clearTimeout(reloadDebounceId);
    reloadDebounceId = window.setTimeout(() => {
      reloadDebounceId = null;
      void reloadBookmarks();
    }, 300);
  }

  if (browser.bookmarks?.onCreated) {
    browser.bookmarks.onCreated.addListener(scheduleReload);
    browser.bookmarks.onRemoved.addListener(scheduleReload);
    browser.bookmarks.onChanged.addListener(scheduleReload);
    browser.bookmarks.onMoved.addListener(scheduleReload);
  }

  if (browser.storage?.onChanged) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.settings) {
        const newValue = changes.settings.newValue || {};
        const nextSettings = { ...DEFAULT_SETTINGS, ...newValue };
        const prevSettings = uiState.getState().settings;
        // Avoid feedback loop if same
        if (JSON.stringify(prevSettings) !== JSON.stringify(nextSettings)) {
          elements.skipAlreadyOpenToggle.checked = Boolean(nextSettings.skipAlreadyOpen);
          uiState.setState({ settings: nextSettings });
          scheduleRedraw();
        }
      }
      if (changes.selectedBookmarkIds) {
        const incoming = Array.isArray(changes.selectedBookmarkIds.newValue) ? changes.selectedBookmarkIds.newValue : [];
        const validIncoming = incoming.filter((id) => index.bookmarksById.has(id));
        const current = new Set(selectionStore.getSelectedIds());
        const nextSet = new Set(validIncoming);
        const same = current.size === nextSet.size && [...current].every((id) => nextSet.has(id));
        if (!same) {
          selectionStore.clearSelection();
          if (validIncoming.length) selectionStore.setSelectionMany(validIncoming, true);
          syncCountAndButtons();
          scheduleRedraw();
        }
      }
    });
  }

  window.addEventListener("pagehide", flushSelectionPersist);
  window.addEventListener("beforeunload", flushSelectionPersist);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSelectionPersist();
    }
  });

  redrawTree();
  syncCountAndButtons();
  showFeedback(elements, "");
}
