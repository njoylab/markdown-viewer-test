import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const roots = ["src", "scripts", "test"];
const errors = [];

for (const root of roots) {
  for (const file of await listFiles(root)) {
    if (!file.endsWith(".js") && !file.endsWith(".mjs")) {
      continue;
    }
    const result = await checkSyntax(file);
    if (result) {
      errors.push(result);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

async function checkSyntax(file) {
  return await new Promise((resolve) => {
    const child = spawn(process.execPath, ["--check", file], {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve(code === 0 ? undefined : `${file}: ${stderr.trim()}`);
    });
  });
}
