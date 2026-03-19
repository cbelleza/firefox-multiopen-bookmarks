import { DEBUG } from "./constants.js";

export function logDebug(...args) {
  if (!DEBUG) {
    return;
  }
  console.log("[MultiOpen]", ...args);
}

export function logError(...args) {
  console.error("[MultiOpen]", ...args);
}
