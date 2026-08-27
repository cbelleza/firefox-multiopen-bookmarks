import { describe, it, expect } from "vitest";
import { filterTree } from "../src/core/filter-engine.js";

function makeNodes() {
  return [
    {
      id: "1",
      title: "Folder",
      type: "folder",
      children: [
        { id: "2", title: "Hello World", url: "https://example.com/hello", type: "bookmark" },
        { id: "3", title: "Another", url: "https://test.com/world", type: "bookmark" },
        {
          id: "4",
          title: "Sub",
          type: "folder",
          children: [{ id: "5", title: "Nested Hello", url: "https://other.com", type: "bookmark" }]
        }
      ]
    },
    { id: "6", title: "Orphan Bookmark", url: "https://example.org", type: "bookmark" }
  ];
}

describe("filterTree", () => {
  it("returns all when query empty", () => {
    const nodes = makeNodes();
    expect(filterTree(nodes, "")).toBe(nodes);
    expect(filterTree(nodes, "   ")).toBe(nodes);
  });

  it("matches title case-insensitive", () => {
    const result = filterTree(makeNodes(), "hello");
    // Folder should remain with matching children 2 and 5
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    const ids = result[0].children.map((c) => c.id);
    expect(ids).toContain("2");
    expect(ids).toContain("4");
    expect(result[0].children.find((c) => c.id === "4").children[0].id).toBe("5");
  });

  it("matches url hostname+path", () => {
    const result = filterTree(makeNodes(), "example.com");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe("2");
  });

  it("matches when folder title matches", () => {
    const result = filterTree(makeNodes(), "folder");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty when no match", () => {
    const result = filterTree(makeNodes(), "zzzz");
    expect(result).toEqual([]);
  });

  it("does not mutate original nodes", () => {
    const nodes = makeNodes();
    const copy = JSON.stringify(nodes);
    filterTree(nodes, "hello");
    expect(JSON.stringify(nodes)).toBe(copy);
  });

  it("handles bookmark at top level", () => {
    const result = filterTree(makeNodes(), "orphan");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("6");
  });
});
