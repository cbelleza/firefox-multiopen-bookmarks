import { toLowerSafe } from "../utils/helpers.js";

function getSearchableUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return toLowerSafe(`${parsed.hostname}${parsed.pathname}`);
  } catch {
    return toLowerSafe(String(url).split(/[?#]/)[0]);
  }
}

function filterNode(node, termLower) {
  if (!termLower) return node;

  const titleLower = toLowerSafe(node.title);
  const searchableUrl = getSearchableUrl(node.url);
  const selfMatches = titleLower.includes(termLower) || searchableUrl.includes(termLower);

  if (node.type !== "folder") {
    return selfMatches ? { ...node } : null;
  }

  const filteredChildren = [];
  for (const child of node.children || []) {
    const filteredChild = filterNode(child, termLower);
    filteredChild && filteredChildren.push(filteredChild);
  }

  if (!selfMatches && filteredChildren.length === 0) return null;

  return { ...node, isExpanded: true, children: filteredChildren };
}

export function filterTree(nodes, query) {
  const termLower = toLowerSafe(query.trim());
  if (!termLower) return nodes;

  const filtered = [];
  for (const node of nodes) {
    const nextNode = filterNode(node, termLower);
    nextNode && filtered.push(nextNode);
  }
  return filtered;
}
