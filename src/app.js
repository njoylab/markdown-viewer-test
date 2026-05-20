import { renderMarkdown } from "./markdown.js";

const input = document.querySelector("#file-input");
const preview = document.querySelector("#preview");
const resetButton = document.querySelector("#reset-button");
const initialPreview = preview.innerHTML;
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

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  const markdown = await file.text();
  preview.innerHTML = renderMarkdown(markdown);
  resetButton.hidden = false;
});

resetButton.addEventListener("click", () => {
  input.value = "";
  preview.innerHTML = initialPreview;
  resetButton.hidden = true;
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

  preview.innerHTML = renderMarkdown(markdown);
});
