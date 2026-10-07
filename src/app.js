import { extractFrontmatter, renderFrontmatter } from "./frontmatter.js";
import { renderMarkdown } from "./markdown.js";
import {
  DARK_QUERY,
  applyTheme,
  nextTheme,
  readStoredTheme,
  resolveInitialTheme,
  storeTheme
} from "./theme.js";

const input = document.querySelector("#file-input");
const uploadButton = document.querySelector(".upload-button");
const preview = document.querySelector("#preview");
const uploadError = document.querySelector("#upload-error");
const themeToggle = document.querySelector("#theme-toggle");
const examples = {
  "release-notes": `# Release Notes

## Highlights

- Added upload support
- Improved **Markdown** previews
- Kept unsafe HTML escaped

[Read more](https://example.com)`,
  "project-plan": `# Project Plan

1. Collect requirements
2. Build the first version
3. Review with the team

Next step: ship a focused preview.`,
  "technical-note": `# Technical Note

Use inline \`code\` for commands and fenced blocks for snippets.

\`\`\`js
const status = "ready";
\`\`\``,
  "frontmatter": `---
title: Release Notes
tags: [markdown, preview, local-first]
status: draft
reviewers:
  - Dana
  - Marco
---

# Release Notes

| Feature | State |
| :--- | :---: |
| Upload | done |
| Dark mode | done |

- [x] Parse YAML frontmatter
- [ ] Ship drag and drop

\`\`\`js
const theme = localStorage.getItem("md-viewer-theme") ?? "light";
\`\`\``
};

function showError(message) {
  uploadError.textContent = message;
  uploadError.hidden = false;
}

function clearError() {
  uploadError.textContent = "";
  uploadError.hidden = true;
}

function renderDocument(markdown) {
  const { entries, body } = extractFrontmatter(markdown);
  return renderFrontmatter(entries) + renderMarkdown(body);
}

function showMarkdown(markdown) {
  preview.innerHTML = renderDocument(markdown);
  uploadButton.classList.remove("is-uploading");
  void uploadButton.offsetWidth;
  uploadButton.classList.add("is-uploading");
}

function isMarkdownFile(file) {
  if (/\.(md|markdown|txt)$/i.test(file.name)) {
    return true;
  }
  return file.type === "text/markdown" || file.type === "text/plain";
}

async function loadFile(file) {
  clearError();
  if (!isMarkdownFile(file)) {
    showError("Choose a Markdown file (.md, .markdown or .txt).");
    return;
  }

  let markdown;
  try {
    markdown = await file.text();
  } catch {
    showError("The file could not be read.");
    return;
  }

  showMarkdown(markdown);
}

input.addEventListener("change", () => {
  const file = input.files?.[0];
  input.value = "";
  if (file) {
    loadFile(file);
  }
});

preview.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest("[data-example]");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const markdown = examples[button.dataset.example];
  if (!markdown) {
    return;
  }

  clearError();
  preview.innerHTML = renderDocument(markdown);
});

let dragDepth = 0;

function isEditable(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(?:input|textarea|select)$/i.test(target.tagName));
}

document.addEventListener("dragenter", (event) => {
  if (!event.dataTransfer?.types.includes("Files") || isEditable(event.target)) {
    return;
  }
  dragDepth += 1;
  document.body.classList.add("is-dragging");
});

document.addEventListener("dragover", (event) => {
  if (event.dataTransfer?.types.includes("Files")) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }
});

document.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) {
    document.body.classList.remove("is-dragging");
  }
});

document.addEventListener("drop", (event) => {
  if (!event.dataTransfer?.types.includes("Files")) {
    return;
  }
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove("is-dragging");
  const file = event.dataTransfer.files?.[0];
  if (file) {
    loadFile(file);
  }
});

document.addEventListener("paste", (event) => {
  if (isEditable(event.target)) {
    return;
  }

  const file = event.clipboardData?.files?.[0];
  if (file) {
    event.preventDefault();
    loadFile(file);
    return;
  }

  const text = event.clipboardData?.getData("text/plain");
  if (text?.trim()) {
    event.preventDefault();
    clearError();
    showMarkdown(text);
  }
});

const colorScheme = window.matchMedia?.(DARK_QUERY);
let theme = resolveInitialTheme(readStoredTheme(window.localStorage), Boolean(colorScheme?.matches));
applyTheme(theme, document.documentElement);

function syncTheme(next) {
  theme = next;
  applyTheme(theme, document.documentElement);
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
}

themeToggle.addEventListener("click", () => {
  syncTheme(nextTheme(theme));
  storeTheme(window.localStorage, theme);
});

colorScheme?.addEventListener("change", (event) => {
  if (readStoredTheme(window.localStorage)) {
    return;
  }
  syncTheme(resolveInitialTheme(null, event.matches));
});

syncTheme(theme);