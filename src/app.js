import { renderMarkdown } from "./markdown.js";

const input = document.querySelector("#file-input");
const uploadButton = document.querySelector(".upload-button");
const preview = document.querySelector("#preview");
const uploadError = document.querySelector("#upload-error");
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

function showMarkdown(markdown) {
  preview.innerHTML = renderMarkdown(markdown);
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

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  input.value = "";
  if (!file) {
    return;
  }

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
  preview.innerHTML = renderMarkdown(markdown);
});
