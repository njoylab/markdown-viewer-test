import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../..");
const samplePath = join(repoRoot, "test/fixtures/sample.md");
const appUrl = "http://markdown-viewer.test/";

test("uploads and renders a markdown file", { timeout: 15000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await routeStaticFiles(page);
  try {
    await page.goto(appUrl);
    await page.locator("#file-input").setInputFiles(samplePath);

    const uploadButton = page.locator(".upload-button");
    await expectUploadAnimation(page, uploadButton);

    await assertVisibleText(page, "Release Notes");
    await assertVisibleText(page, "Highlights");
    await assertVisibleText(page, "Expected Result");

    assert.equal(await page.locator("strong").textContent(), "bold text");
    assert.equal(await page.locator("em").textContent(), "italic text");
    assert.equal(await page.locator("a[href='https://example.com']").textContent(), "public link");
    assert.match(await page.locator("pre code").textContent(), /const status = "rendered";/);
    assert.equal(await page.locator("script", { hasText: "alert" }).count(), 0);
  } finally {
    await browser.close();
  }
});

async function routeStaticFiles(page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = resolve(repoRoot, `.${pathname}`);
    if (!filePath.startsWith(repoRoot)) {
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

function contentType(filePath) {
  if (filePath.endsWith(".css")) {
    return "text/css";
  }
  if (filePath.endsWith(".js")) {
    return "text/javascript";
  }
  return "text/html";
}

async function assertVisibleText(page, text) {
  assert.equal(await page.getByText(text, { exact: true }).isVisible(), true);
}

async function expectUploadAnimation(page, locator) {
  await page.waitForFunction(() => {
    const element = document.querySelector(".upload-button");
    return element?.getAnimations().some(({ animationName }) => {
      return animationName === "upload-pulse";
    });
  });

  await locator.evaluate((element) => {
    return new Promise((resolve, reject) => {
      if (!element.classList.contains("is-uploading")) {
        reject(new Error("Upload button did not enter uploading animation state"));
        return;
      }

      const animation = element.getAnimations().find(({ animationName }) => {
        return animationName === "upload-pulse";
      });
      if (!animation) {
        reject(new Error("Upload button did not start upload-pulse animation"));
        return;
      }

      animation.finished.then(resolve, reject);
    });
  });
}
