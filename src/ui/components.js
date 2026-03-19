export function createTextBadge(text) {
  const badge = document.createElement("span");
  badge.className = "text-badge";
  badge.textContent = text;
  return badge;
}
