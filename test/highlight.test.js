import assert from "node:assert/strict";
import test from "node:test";
import { highlight, resolveLanguage } from "../src/highlight.js";

test("resolves language aliases", () => {
  assert.equal(resolveLanguage("JavaScript"), "js");
  assert.equal(resolveLanguage("ts"), "js");
  assert.equal(resolveLanguage(" yml "), null);
  assert.equal(resolveLanguage(undefined), null);
});

test("escapes code without tokens for unknown languages", () => {
  assert.equal(highlight("const a = 1;", "klingon"), "const a = 1;");
  assert.equal(highlight("<script>alert(1)</script>", ""), "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("highlights javascript keywords, strings and numbers", () => {
  const html = highlight('const answer = "ready"; // done', "js");

  assert.match(html, /<span class="tok-keyword">const<\/span>/);
  assert.match(html, /<span class="tok-string">&quot;ready&quot;<\/span>/);
  assert.match(html, /<span class="tok-comment">\/\/ done<\/span>/);
});

test("keeps comment markers inside strings literal", () => {
  const html = highlight('const url = "https://example.com";', "js");

  assert.match(html, /<span class="tok-string">&quot;https:\/\/example\.com&quot;<\/span>/);
  assert.doesNotMatch(html, /tok-comment/);
});

test("highlights json keys, values and literals", () => {
  const html = highlight('{"name": "viewer", "ready": true, "count": 2}', "json");

  assert.match(html, /<span class="tok-attr">&quot;name&quot;<\/span>/);
  assert.match(html, /<span class="tok-string">&quot;viewer&quot;<\/span>/);
  assert.match(html, /<span class="tok-literal">true<\/span>/);
  assert.match(html, /<span class="tok-number">2<\/span>/);
});

test("highlights css at-rules, colors and properties", () => {
  const html = highlight("@media (min-width: 40rem) { color: #0b57d0; }", "css");

  assert.match(html, /<span class="tok-keyword">@media<\/span>/);
  assert.match(html, /<span class="tok-number">#0b57d0<\/span>/);
  assert.match(html, /<span class="tok-attr">color<\/span>/);
  assert.match(html, /<span class="tok-number">40rem<\/span>/);
});

test("highlights html comments, tags and attributes", () => {
  const html = highlight('<a href="https://x.com">x</a>', "html");

  assert.match(html, /<span class="tok-tag">&lt;a<\/span>/);
  assert.match(html, /<span class="tok-attr">href<\/span>/);
  assert.match(html, /<span class="tok-string">&quot;https:\/\/x\.com&quot;<\/span>/);
});

test("highlights shell comments, variables and options", () => {
  const html = highlight("grep -n \"todo\" notes.md # search", "bash");

  assert.match(html, /<span class="tok-keyword">grep<\/span>/);
  assert.match(html, /<span class="tok-attr">-n<\/span>/);
  assert.match(html, /<span class="tok-string">&quot;todo&quot;<\/span>/);
  assert.match(html, /<span class="tok-comment"># search<\/span>/);
});

test("keeps a hash inside a shell word literal", () => {
  assert.doesNotMatch(highlight("echo a#b", "bash"), /tok-comment/);
});

test("highlights shell shebangs", () => {
  assert.match(highlight("#!/usr/bin/env bash\necho hi", "bash"), /<span class="tok-comment">#!\/usr\/bin\/env bash<\/span>/);
});

test("highlights python keywords, decorators and triple quoted strings", () => {
  const html = highlight('def total(items):\n    """Sum them."""\n    return None', "python");

  assert.match(html, /<span class="tok-keyword">def<\/span>/);
  assert.match(html, /<span class="tok-string">&quot;&quot;&quot;Sum them\.&quot;&quot;&quot;<\/span>/);
  assert.match(html, /<span class="tok-keyword">return<\/span>/);
  assert.match(html, /<span class="tok-literal">None<\/span>/);
});

test("never emits raw html from highlighted code", () => {
  const samples = [
    ["html", '<script>alert("xss")</script>'],
    ["js", 'const a = "<script>alert(1)</script>";'],
    ["python", 'x = """<script>alert(1)</script>"""'],
    ["css", "body { content: '</scr' 'ipt>'; }"]
  ];

  for (const [language, code] of samples) {
    const html = highlight(code, language);
    assert.doesNotMatch(html, /<script/i, `${language}: ${code}`);
    assert.doesNotMatch(html, /\son\w+=/i, `${language}: ${code}`);
  }
});

test("highlighting never loses characters", () => {
  const code = 'const a = `x${1 + 2}`; // sum\nif (a) { return "y"; }';
  const stripped = highlight(code, "js")
    .replaceAll(/<span class="tok-[\w-]+">/g, "")
    .replaceAll("</span>", "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");

  assert.equal(stripped, code);
});

test("handles empty code and unknown token types", () => {
  assert.equal(highlight("", "js"), "");
  assert.equal(highlight(null, null), "");
});