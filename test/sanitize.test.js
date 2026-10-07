import assert from "node:assert/strict";
import test from "node:test";
import { isSafeUrl, normalizeUrl, safeUrl } from "../src/sanitize.js";

test("keeps http, https, mailto and tel links", () => {
  assert.equal(safeUrl("https://example.com/a?b=1#c"), "https://example.com/a?b=1#c");
  assert.equal(safeUrl("http://example.com"), "http://example.com");
  assert.equal(safeUrl("mailto:docs@example.com"), "mailto:docs@example.com");
  assert.equal(safeUrl("tel:+3901234567"), "tel:+3901234567");
});

test("keeps relative links and fragments", () => {
  assert.equal(safeUrl("./notes.md"), "./notes.md");
  assert.equal(safeUrl("../notes.md"), "../notes.md");
  assert.equal(safeUrl("/docs/notes.md"), "/docs/notes.md");
  assert.equal(safeUrl("#section-1"), "#section-1");
  assert.equal(safeUrl("notes.md"), "notes.md");
});

test("blocks script and local file schemes", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("JavaScript:alert(1)"), null);
  assert.equal(safeUrl("vbscript:msgbox(1)"), null);
  assert.equal(safeUrl("data:text/html;base64,PHNjcmlwdD4="), null);
  assert.equal(safeUrl("blob:https://example.com/uuid"), null);
  assert.equal(safeUrl("file:///etc/passwd"), null);
});

test("blocks schemes hidden behind control characters or case", () => {
  assert.equal(safeUrl("java\tscript:alert(1)"), null);
  assert.equal(safeUrl("java\nscript:alert(1)"), null);
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("  javascript:alert(1)  "), null);
});

test("blocks protocol relative urls", () => {
  assert.equal(safeUrl("//evil.example.com"), null);
  assert.equal(safeUrl("\\\\evil.example.com\\share"), null);
});

test("rejects empty values", () => {
  assert.equal(safeUrl(""), null);
  assert.equal(safeUrl("   "), null);
  assert.equal(safeUrl(null), null);
  assert.equal(safeUrl(undefined), null);
});

test("normalizes line breaks and control characters", () => {
  assert.equal(normalizeUrl("https://example.com/a\r\nb"), "https://example.com/a b");
  assert.equal(normalizeUrl("https://example.com\u0007"), "https://example.com");
});

test("exposes a boolean helper", () => {
  assert.equal(isSafeUrl("https://example.com"), true);
  assert.equal(isSafeUrl("javascript:alert(1)"), false);
});