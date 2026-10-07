import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FONT_SIZE,
  FONT_SIZE_STORAGE_KEY,
  FONT_SIZES,
  applyFontSize,
  normalizeFontSize,
  readFontSize,
  resolveInitialFontSize,
  stepFontSize,
  storeFontSize
} from "../src/font-size.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values
  };
}

test("normalizes only known sizes", () => {
  assert.equal(normalizeFontSize("large"), "large");
  assert.equal(normalizeFontSize("huge"), null);
  assert.equal(normalizeFontSize(undefined), null);
});

test("reads and stores the size", () => {
  const storage = createStorage({ [FONT_SIZE_STORAGE_KEY]: "xlarge" });

  assert.equal(readFontSize(storage), "xlarge");
  assert.equal(readFontSize(createStorage()), null);
  assert.equal(readFontSize(null), null);
  assert.equal(storeFontSize(storage, "small"), true);
  assert.equal(storage.values.get(FONT_SIZE_STORAGE_KEY), "small");
  assert.equal(storeFontSize(storage, "huge"), false);
});

test("survives a blocked storage", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    }
  };

  assert.equal(readFontSize(storage), null);
  assert.equal(storeFontSize(storage, "large"), false);
  assert.equal(storeFontSize(null, "large"), false);
});

test("falls back to the default size", () => {
  assert.equal(resolveInitialFontSize("small"), "small");
  assert.equal(resolveInitialFontSize(null), DEFAULT_FONT_SIZE);
});

test("steps through the sizes and stops at the bounds", () => {
  assert.equal(stepFontSize("small", "bigger"), "medium");
  assert.equal(stepFontSize("medium", "smaller"), "small");
  assert.equal(stepFontSize("small", "smaller"), "small");
  assert.equal(stepFontSize("xlarge", "bigger"), "xlarge");
  assert.equal(stepFontSize("medium", "same"), "medium");
  assert.equal(stepFontSize("nope", "bigger"), "large");
});

test("applies the size to the document root", () => {
  const root = { dataset: {} };

  assert.equal(applyFontSize("large", root), "large");
  assert.equal(root.dataset.fontSize, "large");
  assert.equal(applyFontSize("huge", root), DEFAULT_FONT_SIZE);
  assert.equal(FONT_SIZES.length, 4);
});