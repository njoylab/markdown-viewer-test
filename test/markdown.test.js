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
