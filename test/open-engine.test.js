import { describe, it, expect, vi } from "vitest";
import { prepareUrls, openPreparedUrls } from "../src/core/open-engine.js";

describe("prepareUrls", () => {
  it("filters invalid and deduplicates", async () => {
    const urls = ["https://a.com", "https://a.com ", " https://b.com", "javascript:alert(1)", "", null, "not-a-url"];
    const cleaned = await prepareUrls(urls, { deduplicateUrls: true });
    expect(cleaned).toEqual(["https://a.com", "https://b.com"]);
  });

  it("keeps duplicates when disabled", async () => {
    const urls = ["https://a.com", "https://a.com"];
    const cleaned = await prepareUrls(urls, { deduplicateUrls: false });
    expect(cleaned).toEqual(["https://a.com", "https://a.com"]);
  });

  it("skips already open when enabled", async () => {
    const urls = ["https://a.com", "https://b.com", "https://c.com"];
    const cleaned = await prepareUrls(urls, {
      skipAlreadyOpen: true,
      getOpenUrls: async () => new Set(["https://a.com"])
    });
    expect(cleaned).toEqual(["https://b.com", "https://c.com"]);
  });

  it("trims urls", async () => {
    const cleaned = await prepareUrls(["  https://a.com  "]);
    expect(cleaned).toEqual(["https://a.com"]);
  });
});

describe("openPreparedUrls", () => {
  it("returns 0 when empty", async () => {
    const result = await openPreparedUrls([], { createTabs: vi.fn() });
    expect(result).toEqual({ openedCount: 0, wasCancelled: false });
  });

  it("asks confirmation when threshold reached", async () => {
    const confirmOpen = vi.fn(async () => false);
    const createTabs = vi.fn();
    const result = await openPreparedUrls(["https://a.com", "https://b.com"], {
      confirmThreshold: 2,
      confirmCount: 2,
      confirmOpen,
      createTabs
    });
    expect(confirmOpen).toHaveBeenCalledWith(2);
    expect(result.wasCancelled).toBe(true);
    expect(createTabs).not.toHaveBeenCalled();
  });

  it("proceeds when confirmed", async () => {
    const confirmOpen = vi.fn(async () => true);
    const createTabs = vi.fn(async () => {});
    const result = await openPreparedUrls(["https://a.com"], {
      confirmThreshold: 1,
      confirmCount: 1,
      confirmOpen,
      createTabs
    });
    expect(result).toEqual({ openedCount: 1, wasCancelled: false });
    expect(createTabs).toHaveBeenCalledWith(["https://a.com"]);
  });

  it("does not confirm below threshold", async () => {
    const confirmOpen = vi.fn();
    const createTabs = vi.fn(async () => {});
    await openPreparedUrls(["https://a.com"], {
      confirmThreshold: 10,
      confirmCount: 1,
      confirmOpen,
      createTabs
    });
    expect(confirmOpen).not.toHaveBeenCalled();
    expect(createTabs).toHaveBeenCalled();
  });

  it("uses urls.length when confirmCount not integer", async () => {
    const confirmOpen = vi.fn(async () => true);
    const createTabs = vi.fn(async () => {});
    await openPreparedUrls(["https://a.com", "https://b.com"], {
      confirmThreshold: 2,
      confirmCount: null,
      confirmOpen,
      createTabs
    });
    expect(confirmOpen).toHaveBeenCalledWith(2);
  });
});
