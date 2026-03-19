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
  expandedFolderIds: "expandedFolderIds",
  selectedBookmarkIds: "selectedBookmarkIds"
};

export const SUPPORTED_PROTOCOLS = new Set([
  "http:",
  "https:",
  "ftp:",
  "file:"
]);
