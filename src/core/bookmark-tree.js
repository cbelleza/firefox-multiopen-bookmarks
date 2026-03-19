function createNode(rawNode, parentId, depth, expandedFolderIds) {
  const hasChildren = Array.isArray(rawNode.children);
  const type = rawNode.type === "separator" ? "separator" : rawNode.url ? "bookmark" : "folder";

  return {
    id: rawNode.id,
    parentId: parentId || undefined,
    title: rawNode.title || (type === "folder" ? "(Untitled folder)" : "(Untitled)"),
    url: rawNode.url,
    type,
    children: hasChildren ? [] : undefined,
    depth,
    isExpanded: type === "folder" ? expandedFolderIds.has(rawNode.id) : undefined
  };
}

function normalizeChildren(rawChildren, parentId, depth, expandedFolderIds, index) {
  const normalized = [];
  const bookmarkIds = [];

  for (const rawChild of rawChildren) {
    const node = createNode(rawChild, parentId, depth, expandedFolderIds);
    index.byId.set(node.id, node);

    if (node.type === "bookmark") {
      index.bookmarksById.set(node.id, node.url || "");
      bookmarkIds.push(node.id);
    } else if (node.type === "folder") {
      const childResult = normalizeChildren(rawChild.children || [], node.id, depth + 1, expandedFolderIds, index);
      node.children = childResult.nodes;
      index.folderBookmarkIds.set(node.id, childResult.bookmarkIds);
      bookmarkIds.push(...childResult.bookmarkIds);
    }

    normalized.push(node);
  }

  return { nodes: normalized, bookmarkIds };
}

export function buildBookmarkTree(rawTree, expandedFolderIdList = []) {
  const expandedFolderIds = new Set(expandedFolderIdList);
  const index = {
    byId: new Map(),
    bookmarksById: new Map(),
    folderBookmarkIds: new Map()
  };

  const rootChildren = Array.isArray(rawTree[0]?.children) ? rawTree[0].children : [];
  const result = normalizeChildren(rootChildren, null, 0, expandedFolderIds, index);
  const nodes = result.nodes;

  return {
    nodes,
    index
  };
}

function rebaseDepth(nodes, depthOffset) {
  return nodes.map((node) => {
    const nextNode = { ...node, depth: Math.max(0, node.depth - depthOffset) };
    if (nextNode.type === "folder") {
      nextNode.children = rebaseDepth(nextNode.children || [], depthOffset);
    }
    return nextNode;
  });
}

export function getScopedNodes(nodes, index, rootFolderId) {
  if (!rootFolderId) {
    return nodes;
  }

  const rootFolder = index.byId.get(rootFolderId);
  if (!rootFolder || rootFolder.type !== "folder") {
    return nodes;
  }

  const subtree = rootFolder.children || [];
  return rebaseDepth(subtree, rootFolder.depth + 1);
}

export function getScopedBookmarkIds(index, rootFolderId) {
  if (!rootFolderId) return [...index.bookmarksById.keys()];
  return index.folderBookmarkIds.get(rootFolderId) || [];
}

export function isValidRootFolder(index, rootFolderId) {
  if (!rootFolderId) {
    return true;
  }

  const node = index.byId.get(rootFolderId);
  return Boolean(node && node.type === "folder");
}

export function getTopLevelFolderOptions(nodes) {
  return nodes
    .filter((node) => node.type === "folder")
    .map((node) => ({ id: node.id, label: node.title }));
}

export function getFolderPath(index, folderId) {
  const path = [];
  let current = index.byId.get(folderId);

  while (current && current.type === "folder") {
    path.unshift(current.title);
    current = current.parentId ? index.byId.get(current.parentId) : null;
  }

  return path.join(" / ");
}

export function collectExpandedFolderIds(nodes, expandedIds = new Set()) {
  for (const node of nodes) {
    if (node.type === "folder") {
      if (node.isExpanded) {
        expandedIds.add(node.id);
      }
      collectExpandedFolderIds(node.children || [], expandedIds);
    }
  }
  return expandedIds;
}
