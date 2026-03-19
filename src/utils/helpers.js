import { SUPPORTED_PROTOCOLS } from "./constants.js";

export function isOpenableUrl(url) {
  if (typeof url !== "string") {
    return false;
  }

  const normalized = url.trim();
  if (!normalized) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    return SUPPORTED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function toLowerSafe(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.toLowerCase();
}
