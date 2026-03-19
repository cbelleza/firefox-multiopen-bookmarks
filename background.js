import { logDebug } from "./src/utils/logger.js";
import { logError } from "./src/utils/logger.js";

browser.runtime.onInstalled.addListener(() => {
  logDebug("Extension installed");
});

browser.runtime.onMessage.addListener(async (message) => {
  if (!message || typeof message !== "object") {
    return undefined;
  }

  if (message.type === "multiopen.ping") {
    return { ok: true };
  }

  return undefined;
});
