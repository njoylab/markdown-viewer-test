export const FONT_SIZE_STORAGE_KEY = "md-viewer-font-size";
export const FONT_SIZES = ["small", "medium", "large", "xlarge"];
export const DEFAULT_FONT_SIZE = "medium";

export function normalizeFontSize(value) {
  return FONT_SIZES.includes(value) ? value : null;
}

export function readFontSize(storage) {
  try {
    return normalizeFontSize(storage?.getItem(FONT_SIZE_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function storeFontSize(storage, size) {
  if (!storage || !normalizeFontSize(size)) {
    return false;
  }
  try {
    storage.setItem(FONT_SIZE_STORAGE_KEY, size);
    return true;
  } catch {
    return false;
  }
}

export function resolveInitialFontSize(stored) {
  return normalizeFontSize(stored) ?? DEFAULT_FONT_SIZE;
}

export function stepFontSize(size, direction) {
  const current = FONT_SIZES.indexOf(resolveInitialFontSize(size));
  const offset = direction === "smaller" ? -1 : direction === "bigger" ? 1 : 0;
  const next = current + offset;
  return FONT_SIZES[Math.min(Math.max(next, 0), FONT_SIZES.length - 1)];
}

export function applyFontSize(size, root) {
  const value = resolveInitialFontSize(size);
  root.dataset.fontSize = value;
  return value;
}