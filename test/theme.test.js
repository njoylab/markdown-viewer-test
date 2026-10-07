import assert from "node:assert/strict";
import test from "node:test";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  nextTheme,
  normalizeTheme,
  readStoredTheme,
  resolveInitialTheme,
  storeTheme
} from "../src/theme.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values
  };
}

function createRoot() {
  return { dataset: {}, style: {} };
}

test("normalizes only known theme names", () => {
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("light"), "light");
  assert.equal(normalizeTheme("Dark"), null);
  assert.equal(normalizeTheme("sepia"), null);
  assert.equal(normalizeTheme(undefined), null);
});

test("reads the stored theme", () => {
  const storage = createStorage({ [THEME_STORAGE_KEY]: "dark" });

  assert.equal(readStoredTheme(storage), "dark");
  assert.equal(readStoredTheme(createStorage({ [THEME_STORAGE_KEY]: "neon" })), null);
  assert.equal(readStoredTheme(null), null);
});

test("reads the stored theme without throwing when storage is blocked", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    }
  };

  assert.equal(readStoredTheme(storage), null);
});

test("stores the theme without throwing when storage is blocked", () => {
  const storage = {
    setItem() {
      throw new Error("blocked");
    }
  };

  assert.equal(storeTheme(storage, "dark"), false);
  assert.equal(storeTheme(null, "dark"), false);
  assert.equal(storeTheme(createStorage(), "dark"), true);
});

test("falls back to the system preference when nothing is stored", () => {
  assert.equal(resolveInitialTheme(null, true), "dark");
  assert.equal(resolveInitialTheme(null, false), "light");
  assert.equal(resolveInitialTheme(undefined, true), "dark");
});

test("prefers the stored theme over the system preference", () => {
  assert.equal(resolveInitialTheme("light", true), "light");
  assert.equal(resolveInitialTheme("dark", false), "dark");
});

test("toggles between light and dark", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
  assert.equal(nextTheme(null), "dark");
});

test("applies the theme to the document root", () => {
  const root = createRoot();

  assert.equal(applyTheme("dark", root), "dark");
  assert.equal(root.dataset.theme, "dark");
  assert.equal(root.style.colorScheme, "dark");
  assert.equal(applyTheme("sepia", root), "light");
  assert.equal(root.dataset.theme, "light");
});