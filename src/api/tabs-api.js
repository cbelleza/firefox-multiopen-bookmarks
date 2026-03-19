import { isOpenableUrl } from "../utils/helpers.js";

export async function createTabs(urls) {
  const createdTabs = [];
  for (const url of urls) {
    const tab = await browser.tabs.create({ url });
    createdTabs.push(tab);
  }
  return createdTabs;
}

export async function getOpenUrls() {
  const tabs = await browser.tabs.query({});
  const openUrls = new Set();

  for (const tab of tabs) {
    if (isOpenableUrl(tab.url)) {
      openUrls.add(tab.url.trim());
    }
  }

  return openUrls;
}
