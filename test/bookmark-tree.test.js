import { describe, it, expect } from "vitest";
import {
  buildBookmarkTree,
  getScopedNodes,
  getScopedBookmarkIds,
  isValidRootFolder,
  getFolderPath
} from "../src/core/bookmark-tree.js";

function makeRawTree() {
  return [
    {
      id: "root",
      children: [
        {
          id: "1",
          title: "Folder A",
          children: [
            { id: "2", title: "Bookmark 1", url: "https://a.com" },
            {
              id: "3",
              title: "Subfolder",
              children: [{ id: "4", title: "Bookmark 2", url: "https://b.com" }]
            }
          ]
        },
        { id: "5", title: "Bookmark 3", url: "https://c.com" },
        { id: "6", title: "Sep", type: "separator" }
      ]
    }
  ];
}

describe("buildBookmarkTree", () => {
  it("normalizes folders/bookmarks/separators and builds index", () => {
    const { nodes, index } = buildBookmarkTree(makeRawTree());
    expect(nodes).toHaveLength(3); // Folder A, Bookmark 3, Sep
    expect(index.byId.has("1")).toBe(true);
    expect(index.byId.has("2")).toBe(true);
    expect(index.bookmarksById.get("2")).toBe("https://a.com");
    expect(index.folderBookmarkIds.get("1")).toEqual(["2", "4"]);
    expect(index.folderBookmarkIds.get("3")).toEqual(["4"]);
  });

  it("handles empty tree", () => {
    const { nodes, index } = buildBookmarkTree([]);
    expect(nodes).toEqual([]);
    expect(index.byId.size).toBe(0);
  });

  it("defaults untitled correctly", () => {
    const raw = [{ children: [{ id: "x", children: [] }] }];
    const { nodes } = buildBookmarkTree(raw);
    expect(nodes[0].title).toBe("(Untitled folder)");
  });
});

describe("getScopedNodes", () => {
  it("returns all when no root", () => {
    const { nodes, index } = buildBookmarkTree(makeRawTree());
    expect(getScopedNodes(nodes, index, "")).toBe(nodes);
  });

  it("returns subtree rebased when root valid", () => {
    const { nodes, index } = buildBookmarkTree(makeRawTree());
    const scoped = getScopedNodes(nodes, index, "1");
    expect(scoped).toHaveLength(2); // Bookmark 1 + Subfolder
    expect(scoped[0].id).toBe("2");
    expect(scoped[0].depth).toBe(0); // rebased
  });

  it("returns all when root invalid", () => {
    const { nodes, index } = buildBookmarkTree(makeRawTree());
    expect(getScopedNodes(nodes, index, "999")).toBe(nodes);
  });
});

describe("getScopedBookmarkIds", () => {
  it("returns all ids when no root", () => {
    const { index } = buildBookmarkTree(makeRawTree());
    expect(getScopedBookmarkIds(index, "")).toEqual(expect.arrayContaining(["2", "4", "5"]));
  });

  it("returns ids for folder subtree", () => {
    const { index } = buildBookmarkTree(makeRawTree());
    expect(getScopedBookmarkIds(index, "1")).toEqual(["2", "4"]);
  });
});

describe("isValidRootFolder", () => {
  it("validates folder type", () => {
    const { index } = buildBookmarkTree(makeRawTree());
    expect(isValidRootFolder(index, "")).toBe(true);
    expect(isValidRootFolder(index, "1")).toBe(true);
    expect(isValidRootFolder(index, "2")).toBe(false); // bookmark
    expect(isValidRootFolder(index, "999")).toBe(false);
  });
});

describe("getFolderPath", () => {
  it("builds slash path", () => {
    const { index } = buildBookmarkTree(makeRawTree());
    expect(getFolderPath(index, "3")).toBe("Folder A / Subfolder");
    expect(getFolderPath(index, "1")).toBe("Folder A");
  });

  it("returns empty for invalid", () => {
    const { index } = buildBookmarkTree(makeRawTree());
    expect(getFolderPath(index, "999")).toBe("");
    expect(getFolderPath(index, "2")).toBe(""); // bookmark not folder
  });
});
