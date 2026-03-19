import { initBookmarksApp } from "../src/ui/bookmarks-app.js";
import { logError } from "../src/utils/logger.js";

initBookmarksApp("body").catch((error) => {
  logError("Failed to initialize popup:", error);
});
