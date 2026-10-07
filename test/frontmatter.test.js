import assert from "node:assert/strict";
import test from "node:test";
import { extractFrontmatter, renderFrontmatter } from "../src/frontmatter.js";

test("returns the whole document when there is no frontmatter", () => {
  const markdown = "# Title\n\nBody";
  const { entries, body } = extractFrontmatter(markdown);

  assert.deepEqual(entries, []);
  assert.equal(body, markdown);
});

test("extracts key values and strips the block from the body", () => {
  const { entries, body } = extractFrontmatter("---\ntitle: Release Notes\nstatus: draft\n---\n# Body\n");

  assert.deepEqual(entries, [
    { key: "title", value: "Release Notes", items: [] },
    { key: "status", value: "draft", items: [] }
  ]);
  assert.equal(body, "# Body\n");
});

test("parses block lists, flow lists and quoted values", () => {
  const { entries } = extractFrontmatter([
    "---",
    "title: \"Quoted: title\"",
    "tags: [markdown, preview]",
    "reviewers:",
    "  - Dana",
    "  - Marco",
    "---"
  ].join("\n"));

  assert.equal(entries[0].value, "Quoted: title");
  assert.deepEqual(entries[1].value, "markdown, preview");
  assert.deepEqual(entries[2].items, ["Dana", "Marco"]);
});

test("normalizes windows line endings", () => {
  const { body } = extractFrontmatter("---\r\ntitle: x\r\n---\r\n# Body\r\n");

  assert.equal(body, "# Body\n");
});

test("keeps the document when the closing delimiter is missing", () => {
  const markdown = "---\ntitle: x\n\n# Body";

  assert.deepEqual(extractFrontmatter(markdown).entries, []);
  assert.equal(extractFrontmatter(markdown).body, markdown);
});

test("skips comment lines inside the block", () => {
  const { entries } = extractFrontmatter("---\n# a comment\ntitle: x\n---");

  assert.deepEqual(entries, [{ key: "title", value: "x", items: [] }]);
});

test("renders a metadata card with title, tags and fields", () => {
  const { entries } = extractFrontmatter([
    "---",
    "title: Release Notes",
    "tags: [markdown, preview]",
    "status: draft",
    "reviewers:",
    "  - Dana",
    "---"
  ].join("\n"));
  const html = renderFrontmatter(entries);

  assert.match(html, /^<aside class="frontmatter" aria-label="Document metadata">/);
  assert.match(html, /<p class="frontmatter-title">Release Notes<\/p>/);
  assert.match(html, /<li class="tag">markdown<\/li>/);
  assert.match(html, /<li class="tag">preview<\/li>/);
  assert.match(html, /<dt>status<\/dt><dd>draft<\/dd>/);
  assert.match(html, /<dt>reviewers<\/dt><dd><ul><li>Dana<\/li><\/ul><\/dd>/);
  assert.doesNotMatch(html, /<dt>(?:title|tags)<\/dt>/);
});

test("renders block list tags as badges", () => {
  const { entries } = extractFrontmatter("---\ntags:\n  - local\n  - first\n---");

  assert.match(renderFrontmatter(entries), /<li class="tag">local<\/li><li class="tag">first<\/li>/);
});

test("renders nothing for empty or missing entries", () => {
  assert.equal(renderFrontmatter([]), "");
  assert.equal(renderFrontmatter(null), "");
  assert.equal(renderFrontmatter([{ key: "title", value: "", items: [] }]), "");
});

test("escapes unsafe html in metadata", () => {
  const { entries } = extractFrontmatter('---\ntitle: <script>alert("xss")</script>\n---\n');

  assert.equal(
    renderFrontmatter(entries),
    '<aside class="frontmatter" aria-label="Document metadata">' +
      '<p class="frontmatter-title">&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p></aside>'
  );
});

test("never emits raw script or event handler markup", () => {
  const { entries } = extractFrontmatter('---\ntitle: <img src=x onerror="alert(1)">\ntags: ["><script>alert(2)</script>]\n---');
  const html = renderFrontmatter(entries);

  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /\son\w+=(?!&quot;)/i);
});