export const DEBUG = false;

export const DEFAULT_SETTINGS = {
  confirmThreshold: 10,
  skipAlreadyOpen: false,
  deduplicateUrls: true,
  rootFolderId: "",
  lastOpenedFolderId: ""
};

export const STORAGE_KEYS = {
  settings: "settings",
  selectedBookmarkIds: "selectedBookmarkIds",
  // deprecated: kept for migration cleanup
  expandedFolderIds: "expandedFolderIds"
};

export const SUPPORTED_PROTOCOLS = new Set([
  "http:",
  "https:",
  "ftp:",
  "file:"
]);
