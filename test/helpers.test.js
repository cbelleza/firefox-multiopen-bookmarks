import { describe, it, expect } from "vitest";
import { isOpenableUrl, toLowerSafe } from "../src/utils/helpers.js";

describe("isOpenableUrl", () => {
  it("accepts http/https/ftp/file", () => {
    expect(isOpenableUrl("https://example.com")).toBe(true);
    expect(isOpenableUrl("http://example.com")).toBe(true);
    expect(isOpenableUrl("ftp://example.com")).toBe(true);
    expect(isOpenableUrl("file:///tmp/a.html")).toBe(true);
  });

  it("rejects javascript/data/about and invalid", () => {
    expect(isOpenableUrl("javascript:alert(1)")).toBe(false);
    expect(isOpenableUrl("data:text/html,hi")).toBe(false);
    expect(isOpenableUrl("about:blank")).toBe(false);
    expect(isOpenableUrl("")).toBe(false);
    expect(isOpenableUrl("   ")).toBe(false);
    expect(isOpenableUrl(null)).toBe(false);
    expect(isOpenableUrl("not-a-url")).toBe(false);
  });

  it("trims whitespace", () => {
    expect(isOpenableUrl("  https://example.com  ")).toBe(true);
  });
});

describe("toLowerSafe", () => {
  it("lowercases strings", () => {
    expect(toLowerSafe("Hello")).toBe("hello");
    expect(toLowerSafe("ABC")).toBe("abc");
  });

  it("returns empty for non-strings", () => {
    expect(toLowerSafe(null)).toBe("");
    expect(toLowerSafe(undefined)).toBe("");
    expect(toLowerSafe(123)).toBe("");
  });
});
