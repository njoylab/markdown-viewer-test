import assert from "node:assert/strict";
import test from "node:test";
import { renderDocument } from "../src/document.js";

test("returns the rendered html, the headings and the title", () => {
  const result = renderDocument("# Release Notes\n\n## Highlights\n\nBody text.");

  assert.equal(
    result.html,
    '<h1 id="release-notes">Release Notes</h1>\n<h2 id="highlights">Highlights</h2>\n<p>Body text.</p>'
  );
  assert.deepEqual(result.headings, [
    { level: 1, text: "Release Notes", id: "release-notes" },
    { level: 2, text: "Highlights", id: "highlights" }
  ]);
  assert.equal(result.title, "Release Notes");
});

test("prefers the frontmatter title for the document title", () => {
  const result = renderDocument("---\ntitle: Draft Plan\n---\n\n# Ignored\n");

  assert.equal(result.title, "Draft Plan");
  assert.match(result.html, /^<aside class="frontmatter"/);
});

test("renders an empty document without throwing", () => {
  const result = renderDocument("");

  assert.equal(result.html, "");
  assert.deepEqual(result.headings, []);
  assert.equal(result.title, "");
});

test("collects headings from blockquotes with unique ids", () => {
  const result = renderDocument("# Setup\n\n> ## Setup\n");

  assert.deepEqual(result.headings.map((heading) => heading.id), ["setup", "setup-1"]);
});