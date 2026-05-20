import { renderMarkdown } from "./markdown.js";

const input = document.querySelector("#file-input");
const uploadButton = document.querySelector(".upload-button");
const preview = document.querySelector("#preview");

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  const markdown = await file.text();
  preview.innerHTML = renderMarkdown(markdown);
  uploadButton.classList.remove("is-uploading");
  void uploadButton.offsetWidth;
  uploadButton.classList.add("is-uploading");
});
