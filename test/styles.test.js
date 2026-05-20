import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "..");

test("upload button is blue", async () => {
  const styles = await readFile(resolve(repoRoot, "src/styles.css"), "utf8");
  const uploadButtonRule = styles.match(/\.upload-button\s*\{[^}]+\}/)?.[0] ?? "";

  assert.match(uploadButtonRule, /background:\s*#0b57d0;/);
  assert.match(uploadButtonRule, /border:\s*1px solid #0b57d0;/);
});
