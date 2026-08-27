import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../utils/constants.js";

export async function getSettings() {
  const result = await browser.storage.local.get(STORAGE_KEYS.settings);
  const settings = result[STORAGE_KEYS.settings] || {};
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function setSettings(partialSettings) {
  const currentSettings = await getSettings();
  const nextSettings = { ...currentSettings, ...partialSettings };
  await browser.storage.local.set({ [STORAGE_KEYS.settings]: nextSettings });
  return nextSettings;
}

/** @deprecated — breadcrumb navigation replaces expand state; kept for migration */
export async function getExpandedFolderIds() {
  const result = await browser.storage.local.get(STORAGE_KEYS.expandedFolderIds);
  const ids = result[STORAGE_KEYS.expandedFolderIds];
  if (Array.isArray(ids) && ids.length) {
    // cleanup legacy key opportunistically
    await browser.storage.local.remove(STORAGE_KEYS.expandedFolderIds).catch(() => {});
  }
  return [];
}

export async function setExpandedFolderIds() {
  // no-op, legacy cleanup
  await browser.storage.local.remove(STORAGE_KEYS.expandedFolderIds).catch(() => {});
}

export async function getSelectedBookmarkIds() {
  const result = await browser.storage.local.get(STORAGE_KEYS.selectedBookmarkIds);
  return Array.isArray(result[STORAGE_KEYS.selectedBookmarkIds]) ? result[STORAGE_KEYS.selectedBookmarkIds] : [];
}

export async function setSelectedBookmarkIds(ids) {
  await browser.storage.local.set({ [STORAGE_KEYS.selectedBookmarkIds]: Array.from(ids) });
}
