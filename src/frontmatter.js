import { escapeHtml } from "./html.js";

const OPENING = /^---[ \t]*$/;
const CLOSING = /^(?:---|\.\.\.)[ \t]*$/;
const PAIR = /^([A-Za-z0-9_.-]+)[ \t]*:[ \t]*(.*)$/;
const ITEM = /^[ \t]+-[ \t]*(.+)$/;

export function extractFrontmatter(markdown) {
  const text = String(markdown).replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  if (lines.length === 0 || !OPENING.test(lines[0])) {
    return { entries: [], body: text };
  }

  const closing = lines.findIndex((line, index) => index > 0 && CLOSING.test(line));
  if (closing === -1) {
    return { entries: [], body: text };
  }

  return {
    entries: parseEntries(lines.slice(1, closing)),
    body: lines.slice(closing + 1).join("\n")
  };
}

export function renderFrontmatter(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return "";
  }

  const title = findEntry(entries, "title");
  const tags = findEntry(entries, "tags");
  const rest = entries.filter((entry) => !/^(?:title|tags)$/i.test(entry.key));
  const tagItems = tags ? tagList(tags) : [];
  if (!title?.value && tagItems.length === 0 && rest.length === 0) {
    return "";
  }

  const parts = [];
  if (title?.value) {
    parts.push(`<p class="frontmatter-title">${escapeHtml(title.value)}</p>`);
  }
  if (tagItems.length > 0) {
    const badges = tagItems.map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join("");
    parts.push(`<ul class="frontmatter-tags">${badges}</ul>`);
  }
  if (rest.length > 0) {
    parts.push(`<dl class="frontmatter-fields">${rest.map(renderField).join("")}</dl>`);
  }

  return `<aside class="frontmatter" aria-label="Document metadata">${parts.join("")}</aside>`;
}

function parseEntries(lines) {
  const entries = [];
  let current = null;

  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }

    const item = ITEM.exec(line);
    if (item && current) {
      current.items.push(scalar(item[1]));
      continue;
    }

    const pair = PAIR.exec(line);
    if (pair) {
      current = { key: pair[1], value: scalar(pair[2]), items: [] };
      entries.push(current);
      continue;
    }

    if (current) {
      current.value = [current.value, line.trim()].filter(Boolean).join(" ");
    }
  }

  return entries;
}

function renderField(entry) {
  const value = entry.items.length > 0
    ? `<dd><ul>${entry.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></dd>`
    : `<dd>${escapeHtml(entry.value)}</dd>`;
  return `<div class="frontmatter-field"><dt>${escapeHtml(entry.key)}</dt>${value}</div>`;
}

function findEntry(entries, key) {
  return entries.find((entry) => entry.key.toLowerCase() === key);
}

function tagList(entry) {
  if (entry.items.length > 0) {
    return entry.items;
  }
  return entry.value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function scalar(value) {
  const text = value.trim();
  const quoted = /^(["'])([\s\S]*)\1$/.exec(text);
  if (quoted) {
    return quoted[2];
  }
  return text
    .replace(/\s+#.*$/, "")
    .replace(/^\[([\s\S]*)\]$/, "$1")
    .trim();
}