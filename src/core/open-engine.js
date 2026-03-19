import { isOpenableUrl } from "../utils/helpers.js";

export async function prepareUrls(urls, options = {}) {
  const { deduplicateUrls = true, skipAlreadyOpen = false, getOpenUrls = null } = options;

  const cleaned = [];
  const seen = new Set();

  for (const rawUrl of urls) {
    if (typeof rawUrl !== "string") continue;

    const url = rawUrl.trim();
    if (!isOpenableUrl(url)) continue;
    if (deduplicateUrls && seen.has(url)) continue;

    seen.add(url);
    cleaned.push(url);
  }

  if (!skipAlreadyOpen || typeof getOpenUrls !== "function") return cleaned;

  const openUrls = await getOpenUrls();
  return cleaned.filter((url) => !openUrls.has(url));
}

export async function openPreparedUrls(urls, options = {}) {
  const { confirmThreshold = 15, confirmCount = null, confirmOpen = null, createTabs } = options;

  if (!Array.isArray(urls) || urls.length === 0) {
    return { openedCount: 0, wasCancelled: false };
  }

  const countForConfirm = Number.isInteger(confirmCount) && confirmCount >= 0 ? confirmCount : urls.length;

  if (countForConfirm >= confirmThreshold && typeof confirmOpen === "function") {
    const shouldProceed = await confirmOpen(countForConfirm);
    if (!shouldProceed) {
      return { openedCount: 0, wasCancelled: true };
    }
  }

  await createTabs(urls);

  return { openedCount: urls.length, wasCancelled: false };
}
