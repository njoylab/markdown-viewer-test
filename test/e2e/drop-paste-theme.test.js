import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { contentType } from "../../scripts/content-type.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../..");
const appUrl = "http://markdown-viewer.test/";
const droppedMarkdown = "---\ntitle: Dropped Doc\ntags: [drop]\n---\n\n# Dropped Doc\n\n- [x] rendered\n";

test("pastes markdown from the clipboard", { timeout: 15000 }, async () => {
  const { browser, page } = await openPage();
  try {
    await paste(page, "# Pasted\n\nFrom clipboard.");

    await assertVisibleText(page, "Pasted");
    await assertVisibleText(page, "From clipboard.");
  } finally {
    await browser.close();
  }
});

test("renders a dropped markdown file with frontmatter and task lists", { timeout: 15000 }, async () => {
  const { browser, page } = await openPage();
  try {
    await dropFile(page, droppedMarkdown, "dropped.md", "text/markdown");

    await page.waitForSelector(".frontmatter");
    assert.equal(await page.locator(".frontmatter-title").textContent(), "Dropped Doc");
    assert.equal(await page.getByRole("heading", { name: "Dropped Doc" }).isVisible(), true);
    assert.equal(await page.locator(".frontmatter-tags .tag").textContent(), "drop");
    assert.equal(await page.locator(".task-checkbox").isChecked(), true);
  } finally {
    await browser.close();
  }
});

test("rejects dropped files that are not markdown", { timeout: 15000 }, async () => {
  const { browser, page } = await openPage();
  try {
    await dropFile(page, "binary", "photo.png", "image/png");

    await assertVisibleText(page, "Choose a Markdown file (.md, .markdown or .txt).");
  } finally {
    await browser.close();
  }
});

test("toggles dark mode and remembers the choice", { timeout: 15000 }, async () => {
  const { browser, page } = await openPage();
  try {
    const toggle = page.locator("#theme-toggle");
    await assertVisibleText(page, "Dark mode");

    await toggle.click();

    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
    assert.equal(await toggle.textContent(), "Light mode");
    assert.equal(await page.evaluate(() => localStorage.getItem("md-viewer-theme")), "dark");

    await page.reload();

    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");

    await toggle.click();

    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
    assert.equal(await page.evaluate(() => localStorage.getItem("md-viewer-theme")), "light");
  } finally {
    await browser.close();
  }
});

test("follows the system color scheme when no choice is stored", { timeout: 15000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ colorScheme: "dark" });
  await routeStaticFiles(page);
  try {
    await page.goto(appUrl);

    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");

    await page.evaluate(() => localStorage.setItem("md-viewer-theme", "light"));
    await page.reload();

    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
  } finally {
    await browser.close();
  }
});

test("renders frontmatter, tables and highlighted code from the frontmatter example", { timeout: 15000 }, async () => {
  const { browser, page } = await openPage();
  try {
    await page.getByRole("button", { name: "Frontmatter" }).click();

    assert.deepEqual(await page.locator(".frontmatter-field dt").allTextContents(), ["status", "reviewers"]);
    assert.equal(await page.locator("table th").count(), 2);
    assert.equal(await page.locator(".task-checkbox").count(), 2);
    assert.equal(await page.locator("pre code .tok-keyword").count() > 0, true);
  } finally {
    await browser.close();
  }
});

async function openPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await routeStaticFiles(page);
  await page.goto(appUrl);
  return { browser, page };
}

async function paste(page, text) {
  await page.evaluate((value) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", value);
    document.body.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dataTransfer, bubbles: true, cancelable: true }));
  }, text);
}

async function dropFile(page, content, name, type) {
  await page.evaluate(({ value, fileName, mimeType }) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([value], fileName, { type: mimeType }));
    document.body.dispatchEvent(new DragEvent("drop", { dataTransfer, bubbles: true, cancelable: true }));
  }, { value: content, fileName: name, mimeType: type });
}

async function routeStaticFiles(page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = resolve(repoRoot, `.${pathname}`);
    const escaped = relative(repoRoot, filePath);
    if (escaped === ".." || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
      await route.fulfill({ status: 403, body: "Forbidden" });
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw new Error("Not a file");
      }
      await route.fulfill({
        status: 200,
        contentType: contentType(filePath),
        body: await readFile(filePath)
      });
    } catch {
      await route.fulfill({ status: 404, body: "Not found" });
    }
  });
}

async function assertVisibleText(page, text) {
  assert.equal(await page.getByText(text, { exact: true }).isVisible(), true);
}