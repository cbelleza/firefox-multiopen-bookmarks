export async function getTree() {
  const tree = await browser.bookmarks.getTree();
  return Array.isArray(tree) ? tree : [];
}
