import { renderMarkdown } from "./markdown.js";

const input = document.querySelector("#file-input");
const preview = document.querySelector("#preview");

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  const markdown = await file.text();
  preview.innerHTML = renderMarkdown(markdown);
});
