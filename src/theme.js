export const THEME_STORAGE_KEY = "md-viewer-theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export function normalizeTheme(value) {
  return value === "light" || value === "dark" ? value : null;
}

export function readStoredTheme(storage) {
  try {
    return normalizeTheme(storage?.getItem(THEME_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function storeTheme(storage, theme) {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return false;
  }
  return true;
}

export function resolveInitialTheme(stored, prefersDark) {
  return normalizeTheme(stored) ?? (prefersDark ? "dark" : "light");
}

export function nextTheme(theme) {
  return normalizeTheme(theme) === "dark" ? "light" : "dark";
}

export function applyTheme(theme, root) {
  const value = normalizeTheme(theme) ?? "light";
  root.dataset.theme = value;
  root.style.colorScheme = value;
  return value;
}