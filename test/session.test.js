import assert from "node:assert/strict";
import test from "node:test";
import {
  DOCUMENT_NAME_STORAGE_KEY,
  DOCUMENT_STORAGE_KEY,
  MAX_DOCUMENT_LENGTH,
  clearDocument,
  readDocument,
  storeDocument
} from "../src/session.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values
  };
}

test("stores and reads the last document", () => {
  const storage = createStorage();

  assert.equal(storeDocument(storage, "# Notes\n", "notes.md"), true);
  assert.equal(storage.values.get(DOCUMENT_STORAGE_KEY), "# Notes\n");
  assert.equal(storage.values.get(DOCUMENT_NAME_STORAGE_KEY), "notes.md");
  assert.deepEqual(readDocument(storage), { markdown: "# Notes\n", name: "notes.md" });
});

test("returns null when nothing is stored", () => {
  assert.equal(readDocument(createStorage()), null);
  assert.equal(readDocument(createStorage({ [DOCUMENT_STORAGE_KEY]: "" })), null);
});

test("truncates very large documents", () => {
  const storage = createStorage();

  storeDocument(storage, "a".repeat(MAX_DOCUMENT_LENGTH + 10));

  assert.equal(storage.values.get(DOCUMENT_STORAGE_KEY).length, MAX_DOCUMENT_LENGTH);
});

test("clears the stored document when the markdown is empty", () => {
  const storage = createStorage({ [DOCUMENT_STORAGE_KEY]: "# Old", [DOCUMENT_NAME_STORAGE_KEY]: "old.md" });

  assert.equal(storeDocument(storage, ""), true);
  assert.equal(readDocument(storage), null);
  assert.equal(storage.values.has(DOCUMENT_NAME_STORAGE_KEY), false);
});

test("clears the stored document on demand", () => {
  const storage = createStorage({ [DOCUMENT_STORAGE_KEY]: "# Old", [DOCUMENT_NAME_STORAGE_KEY]: "old.md" });

  assert.equal(clearDocument(storage), true);
  assert.equal(readDocument(storage), null);
});

test("survives a blocked storage", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    }
  };

  assert.equal(readDocument(storage), null);
  assert.equal(storeDocument(storage, "# Notes"), false);
  assert.equal(storeDocument(null, "# Notes"), false);
  assert.equal(clearDocument(storage), false);
  assert.equal(clearDocument(null), false);
});