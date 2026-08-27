import { getTree } from "../src/api/bookmarks-api.js";
import { getSettings, setSettings } from "../src/api/storage-api.js";
import { buildBookmarkTree, getFolderPath, isValidRootFolder } from "../src/core/bookmark-tree.js";
import { logError } from "../src/utils/logger.js";

const feedbackEl = document.querySelector("[data-role='feedback']");
const thresholdInput = document.querySelector("[data-role='confirm-threshold']");
const skipToggle = document.querySelector("[data-role='skip-open-toggle']");
const dedupToggle = document.querySelector("[data-role='deduplicate-toggle']");
const rootSelect = document.querySelector("[data-role='root-folder-select']");
const pathEl = document.querySelector("[data-role='folder-path']");
const clearRootBtn = document.querySelector("[data-role='clear-root-btn']");

function showFeedback(message, type = "success") {
  if (!feedbackEl) return;
  if (!message) {
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    feedbackEl.dataset.type = "info";
    return;
  }
  feedbackEl.hidden = false;
  feedbackEl.textContent = message;
  feedbackEl.dataset.type = type;
  window.clearTimeout(showFeedback._t);
  showFeedback._t = window.setTimeout(() => {
    feedbackEl.hidden = true;
  }, 3000);
}

function collectFolderOptions(nodes, depth = 0, out = []) {
  for (const node of nodes) {
    if (node.type === "folder") {
      const indent = depth ? "  ".repeat(depth) + "↳ " : "";
      out.push({ id: node.id, label: `${indent}${node.title}`, depth });
      if (node.children?.length) {
        collectFolderOptions(node.children, depth + 1, out);
      }
    }
  }
  return out;
}

async function init() {
  try {
    const [settings, rawTree] = await Promise.all([getSettings(), getTree()]);
    const { nodes, index } = buildBookmarkTree(rawTree);

    // Populate threshold
    if (thresholdInput) {
      thresholdInput.value = String(settings.confirmThreshold ?? 10);
      thresholdInput.addEventListener("change", async () => {
        let v = Number.parseInt(thresholdInput.value, 10);
        if (!Number.isFinite(v) || v < 1) v = 1;
        if (v > 100) v = 100;
        thresholdInput.value = String(v);
        try {
          await setSettings({ confirmThreshold: v });
          showFeedback(`Confirm threshold set to ${v}.`);
        } catch (e) {
          logError("Failed to save confirmThreshold", e);
          showFeedback("Failed to save.", "error");
        }
      });
    }

    if (skipToggle) {
      skipToggle.checked = Boolean(settings.skipAlreadyOpen);
      skipToggle.addEventListener("change", async () => {
        try {
          await setSettings({ skipAlreadyOpen: skipToggle.checked });
          showFeedback(skipToggle.checked ? "Will skip already open tabs." : "Will open even if already open.");
        } catch (e) {
          logError("Failed to save skipAlreadyOpen", e);
          showFeedback("Failed to save.", "error");
        }
      });
    }

    if (dedupToggle) {
      dedupToggle.checked = Boolean(settings.deduplicateUrls);
      dedupToggle.addEventListener("change", async () => {
        try {
          await setSettings({ deduplicateUrls: dedupToggle.checked });
          showFeedback(dedupToggle.checked ? "Duplicates will be removed." : "Duplicates will be kept.");
        } catch (e) {
          logError("Failed to save deduplicateUrls", e);
          showFeedback("Failed to save.", "error");
        }
      });
    }

    // Populate root folder select
    if (rootSelect) {
      const options = collectFolderOptions(nodes);
      rootSelect.innerHTML = "";
      const allOpt = document.createElement("option");
      allOpt.value = "";
      allOpt.textContent = "All Bookmarks (no filter)";
      rootSelect.appendChild(allOpt);
      for (const opt of options) {
        const el = document.createElement("option");
        el.value = opt.id;
        el.textContent = opt.label;
        rootSelect.appendChild(el);
      }

      const current = isValidRootFolder(index, settings.rootFolderId) ? settings.rootFolderId : "";
      rootSelect.value = current;

      let currentValid = current;
      if (current) {
        const p = getFolderPath(index, current);
        if (p && pathEl) {
          pathEl.textContent = `Current: ${p}`;
          pathEl.hidden = false;
        }
      }

      rootSelect.addEventListener("change", async () => {
        const next = rootSelect.value || "";
        if (next && !isValidRootFolder(index, next)) {
          showFeedback("Invalid folder.", "warning");
          rootSelect.value = currentValid;
          return;
        }
        try {
          await setSettings({ rootFolderId: next, lastOpenedFolderId: "" });
          currentValid = next;
          if (next && pathEl) {
            const p = getFolderPath(index, next);
            pathEl.textContent = p ? `Current: ${p}` : "";
            pathEl.hidden = !p;
          } else if (pathEl) {
            pathEl.hidden = true;
          }
          showFeedback(next ? "Default folder updated." : "Showing all bookmarks.");
        } catch (e) {
          logError("Failed to save rootFolderId", e);
          showFeedback("Failed to save.", "error");
        }
      });
    }

    if (clearRootBtn) {
      clearRootBtn.addEventListener("click", async () => {
        try {
          await setSettings({ rootFolderId: "", lastOpenedFolderId: "" });
          if (rootSelect) rootSelect.value = "";
          if (pathEl) pathEl.hidden = true;
          showFeedback("View reset to all bookmarks.");
        } catch (e) {
          logError("Failed to clear root", e);
          showFeedback("Failed to clear.", "error");
        }
      });
    }

    // Storage sync for multi-instance
    if (browser.storage?.onChanged) {
      browser.storage.onChanged.addListener((changes, area) => {
        if (area !== "local" || !changes.settings) return;
        const nv = changes.settings.newValue || {};
        if (thresholdInput && typeof nv.confirmThreshold === "number") {
          thresholdInput.value = String(nv.confirmThreshold);
        }
        if (skipToggle && typeof nv.skipAlreadyOpen === "boolean") {
          skipToggle.checked = nv.skipAlreadyOpen;
        }
        if (dedupToggle && typeof nv.deduplicateUrls === "boolean") {
          dedupToggle.checked = nv.deduplicateUrls;
        }
        if (rootSelect && typeof nv.rootFolderId === "string") {
          const v = isValidRootFolder(index, nv.rootFolderId) ? nv.rootFolderId : "";
          rootSelect.value = v;
          if (pathEl) {
            if (v) {
              const p = getFolderPath(index, v);
              pathEl.textContent = p ? `Current: ${p}` : "";
              pathEl.hidden = !p;
            } else {
              pathEl.hidden = true;
            }
          }
        }
      });
    }
  } catch (error) {
    logError("Options init failed", error);
    showFeedback("Failed to load settings.", "error");
  }
}

init();
