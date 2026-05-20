import { renderMarkdown } from "./markdown.js";

const input = document.querySelector("#file-input");
const preview = document.querySelector("#preview");
const uploadButton = document.querySelector(".upload-button");

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  uploadButton.classList.remove("upload-button--animating");
  void uploadButton.offsetWidth;
  uploadButton.classList.add("upload-button--animating");

  const markdown = await file.text();
  preview.innerHTML = renderMarkdown(markdown);
});

uploadButton.addEventListener("animationend", () => {
  uploadButton.classList.remove("upload-button--animating");
});
