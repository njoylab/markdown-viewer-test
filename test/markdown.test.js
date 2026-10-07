import assert from "node:assert/strict";
import test from "node:test";
import { renderMarkdown } from "../src/markdown.js";

test("renders headings, emphasis and lists", () => {
  const html = renderMarkdown("# Title\n\nA **bold** and *soft* line.\n\n- One\n- Two");

  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>soft<\/em>/);
  assert.match(html, /<ul><li>One<\/li><li>Two<\/li><\/ul>/);
});

test("escapes unsafe html", () => {
  const html = renderMarkdown("# <script>alert(1)</script>");

  assert.equal(html, "<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>");
});

test("renders fenced code blocks", () => {
  const html = renderMarkdown("```js\nconst value = 1 < 2;\n```");

  assert.equal(html, "<pre><code>const value = 1 &lt; 2;</code></pre>");
});

test("keeps inline code literal", () => {
  assert.equal(renderMarkdown("`**not bold**`"), "<p><code>**not bold**</code></p>");
  assert.equal(
    renderMarkdown("`[a](https://b.com)`"),
    "<p><code>[a](https://b.com)</code></p>"
  );
});

test("renders nested emphasis", () => {
  assert.equal(renderMarkdown("**a *b* c**"), "<p><strong>a <em>b</em> c</strong></p>");
});

test("renders headings up to level six", () => {
  const html = renderMarkdown("#### Four\n\n###### Six");

  assert.equal(html, "<h4>Four</h4>\n<h6>Six</h6>");
});

test("keeps the ordered list start number", () => {
  assert.equal(renderMarkdown("5. five\n6. six"), '<ol start="5"><li>five</li><li>six</li></ol>');
  assert.equal(renderMarkdown("1. one"), "<ol><li>one</li></ol>");
});

test("joins consecutive lines into one paragraph", () => {
  assert.equal(renderMarkdown("line one\nline two"), "<p>line one\nline two</p>");
});

test("renders blockquotes", () => {
  assert.equal(
    renderMarkdown("> quoted *line*\n> more\n\nafter"),
    "<blockquote><p>quoted <em>line</em>\nmore</p></blockquote>\n<p>after</p>"
  );
});

test("applies emphasis inside link labels", () => {
  assert.equal(
    renderMarkdown("[**bold**](https://x.com)"),
    '<p><a href="https://x.com" rel="noreferrer"><strong>bold</strong></a></p>'
  );
});

test("ignores unsafe link schemes", () => {
  const html = renderMarkdown("[x](javascript:alert(1))");

  assert.equal(html, "<p>[x](javascript:alert(1))</p>");
});
