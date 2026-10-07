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

test("escapes html that could inject attributes or handlers", () => {
  const html = renderMarkdown('<img src=x onerror="alert(1)">');

  assert.equal(html, "<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>");
  assert.doesNotMatch(html, /<img/);
});

test("cannot break out of a link href attribute", () => {
  const html = renderMarkdown('[x](https://x.com" onmouseover="alert(1))');

  assert.equal(html, "<p>[x](https://x.com&quot; onmouseover=&quot;alert(1))</p>");
  assert.doesNotMatch(html, /onmouseover="alert/);
});

test("escapes single quotes used to break out of attributes", () => {
  const html = renderMarkdown("<p class='x'>hi</p>");

  assert.equal(html, "<p>&lt;p class=&#39;x&#39;&gt;hi&lt;/p&gt;</p>");
});

test("escapes html inside headings, list items and quotes", () => {
  const html = renderMarkdown("# <b>a</b>\n\n- <i>b</i>\n\n> <svg onload=alert(1)>");

  assert.equal(
    html,
    "<h1>&lt;b&gt;a&lt;/b&gt;</h1>\n<ul><li>&lt;i&gt;b&lt;/i&gt;</li></ul>\n" +
      "<blockquote><p>&lt;svg onload=alert(1)&gt;</p></blockquote>"
  );
});

test("never emits a raw script or event handler tag", () => {
  const samples = [
    "<script>alert(1)</script>",
    "# <script>alert(1)</script>",
    "- <script>alert(1)</script>",
    "> <script>alert(1)</script>",
    "[a](https://x.com) <script>alert(1)</script>",
    "**<script>alert(1)</script>**",
    "`<script>alert(1)</script>`",
    "~~~html\n<script>alert(1)</script>\n~~~",
    "    <script>alert(1)</script>"
  ];

  for (const sample of samples) {
    const html = renderMarkdown(sample);
    assert.doesNotMatch(html, /<script/i, `sample: ${sample}`);
    assert.doesNotMatch(html, /\son\w+=/i, `sample: ${sample}`);
  }
});

test("strips control characters and forged token placeholders", () => {
  const html = renderMarkdown("a\u0000b\uE0000\uE001 *bold*");

  assert.equal(html, "<p>ab0 <em>bold</em></p>");
});

test("renders tilde fenced code blocks", () => {
  assert.equal(renderMarkdown("~~~js\nconst value = 1;\n~~~"), "<pre><code>const value = 1;</code></pre>");
  assert.equal(
    renderMarkdown("~~~~\nlonger fence\n~~~~"),
    "<pre><code>longer fence</code></pre>"
  );
});

test("keeps a different fence marker literal inside a code block", () => {
  assert.equal(
    renderMarkdown("```\n~~~\nliteral\n~~~\n```"),
    "<pre><code>~~~\nliteral\n~~~</code></pre>"
  );
});

test("renders indented code blocks and keeps consecutive blocks together", () => {
  assert.equal(
    renderMarkdown("    first\n    second\n\nafter"),
    "<pre><code>first\nsecond</code></pre>\n<p>after</p>"
  );
  assert.equal(
    renderMarkdown("    one\n\n    two"),
    "<pre><code>one\n\ntwo</code></pre>"
  );
});

test("does not turn indented paragraph continuations into code", () => {
  assert.equal(renderMarkdown("line one\n    line two"), "<p>line one\n    line two</p>");
});

test("renders code spans delimited by longer backtick runs", () => {
  assert.equal(renderMarkdown("`` a ` b ``"), "<p><code>a ` b</code></p>");
  assert.equal(renderMarkdown("`inline`"), "<p><code>inline</code></p>");
});
