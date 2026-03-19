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

export async function getExpandedFolderIds() {
  const result = await browser.storage.local.get(STORAGE_KEYS.expandedFolderIds);
  const ids = result[STORAGE_KEYS.expandedFolderIds];
  return Array.isArray(ids) ? ids : [];
}

export async function setExpandedFolderIds(folderIds) {
  await browser.storage.local.set({ [STORAGE_KEYS.expandedFolderIds]: Array.from(folderIds) });
}
export async function getSelectedBookmarkIds() {
  const result = await browser.storage.local.get(STORAGE_KEYS.selectedBookmarkIds);
  return Array.isArray(result[STORAGE_KEYS.selectedBookmarkIds]) ? result[STORAGE_KEYS.selectedBookmarkIds] : [];
}

export async function setSelectedBookmarkIds(ids) {
  await browser.storage.local.set({ [STORAGE_KEYS.selectedBookmarkIds]: Array.from(ids) });
}
