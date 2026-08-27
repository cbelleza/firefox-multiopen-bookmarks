import { describe, it, expect } from "vitest";
import { createSelectionStore } from "../src/core/selection-store.js";

function makeMap(entries) {
  return new Map(entries);
}

describe("createSelectionStore", () => {
  it("selects only known ids", () => {
    const store = createSelectionStore(makeMap([["1", "https://a.com"], ["2", "https://b.com"]]));
    store.setSelection("1", true);
    store.setSelection("99", true);
    expect(store.isSelected("1")).toBe(true);
    expect(store.isSelected("99")).toBe(false);
    expect(store.getSelectedCount()).toBe(1);
  });

  it("toggles and clears", () => {
    const store = createSelectionStore(makeMap([["1", "https://a.com"]]));
    store.setSelection("1", true);
    expect(store.getSelectedCount()).toBe(1);
    store.setSelection("1", false);
    expect(store.getSelectedCount()).toBe(0);
    store.setSelection("1", true);
    store.clearSelection();
    expect(store.getSelectedCount()).toBe(0);
  });

  it("setSelectionMany bulk", () => {
    const store = createSelectionStore(makeMap([["1", "a"], ["2", "b"], ["3", "c"]]));
    store.setSelectionMany(["1", "2", "99"], true);
    expect(store.getSelectedIds().sort()).toEqual(["1", "2"]);
    store.setSelectionMany(["1"], false);
    expect(store.getSelectedIds()).toEqual(["2"]);
  });

  it("getSelectedUrls", () => {
    const store = createSelectionStore(makeMap([["1", "https://a.com"], ["2", "https://b.com"]]));
    store.setSelection("1", true);
    store.setSelection("2", true);
    expect(store.getSelectedUrls().sort()).toEqual(["https://a.com", "https://b.com"]);
  });

  it("getSelectionStats", () => {
    const store = createSelectionStore(makeMap([["1", "a"], ["2", "b"]]));
    store.setSelection("1", true);
    let stats = store.getSelectionStats(["1", "2"]);
    expect(stats).toEqual({ selectedCount: 1, totalCount: 2, checked: false, indeterminate: true });
    store.setSelection("2", true);
    stats = store.getSelectionStats(["1", "2"]);
    expect(stats.checked).toBe(true);
    expect(store.getSelectionStats([])).toEqual({ selectedCount: 0, totalCount: 0, checked: false, indeterminate: false });
  });
});
