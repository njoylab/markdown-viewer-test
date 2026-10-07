import assert from "node:assert/strict";
import test from "node:test";
import { buildToc, decodeHash, findHeadingById, headingHref } from "../src/toc.js";

const headings = [
  { level: 1, text: "Release Notes", id: "release-notes" },
  { level: 2, text: "Highlights", id: "highlights" },
  { level: 3, text: "Upload", id: "upload" },
  { level: 4, text: "Details", id: "details" },
  { level: 2, text: "Fixes", id: "fixes" }
];

test("keeps only the levels inside the configured range", () => {
  assert.deepEqual(buildToc(headings).map((item) => item.id), ["highlights", "upload", "fixes"]);
  assert.deepEqual(
    buildToc(headings, { minLevel: 1, maxLevel: 6 }).map((item) => item.id),
    ["release-notes", "highlights", "upload", "details", "fixes"]
  );
  assert.deepEqual(buildToc(headings, { minLevel: 4, maxLevel: 6 }).map((item) => item.id), ["details"]);
});

test("reports the nesting depth relative to the first level", () => {
  assert.deepEqual(buildToc(headings).map((item) => item.depth), [0, 1, 0]);
});

test("falls back to defaults for invalid levels or missing headings", () => {
  assert.deepEqual(buildToc(null), []);
  assert.deepEqual(
    buildToc(undefined, { minLevel: 9, maxLevel: 0 }),
    []
  );
  assert.deepEqual(
    buildToc(headings, { minLevel: 9, maxLevel: 0 }).map((item) => item.id),
    ["highlights", "upload", "fixes"]
  );
  assert.deepEqual(buildToc(headings, { minLevel: "2" }).map((item) => item.id), ["highlights", "upload", "fixes"]);
});

test("builds escaped heading hrefs", () => {
  assert.equal(headingHref({ id: "getting-started" }), "#getting-started");
  assert.equal(headingHref("città"), "#citt%C3%A0");
});

test("finds a heading from a hash or a raw id", () => {
  assert.equal(findHeadingById(headings, "#fixes").id, "fixes");
  assert.equal(findHeadingById(headings, "fixes").id, "fixes");
  assert.equal(findHeadingById(headings, "#missing"), null);
  assert.equal(findHeadingById(headings, ""), null);
  assert.equal(findHeadingById(null, "#fixes"), null);
});

test("decodes hashes without throwing on broken escapes", () => {
  assert.equal(decodeHash("#a%20b"), "a b");
  assert.equal(decodeHash("#a%ZZb"), "a%ZZb");
  assert.equal(decodeHash(""), "");
});