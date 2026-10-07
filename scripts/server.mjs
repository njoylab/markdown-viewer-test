import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { isAbsolute, join, normalize, relative, sep } from "node:path";
import { contentType } from "./content-type.mjs";

const root = await realpath(process.cwd());
const port = Number(process.env.PORT ?? 3000);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const requestPath = normalize(decodeURIComponent(url.pathname));
    const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
    const realPath = await realpath(join(root, relativePath));
    const escaped = relative(root, realPath);

    if (escaped === ".." || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const fileStat = await stat(realPath);
    if (!fileStat.isFile()) {
      throw new Error("Not a file");
    }

    const type = contentType(realPath);

    if (type.startsWith("text/html")) {
      const version = await assetVersion();
      const etag = `"${version}"`;
      if (request.headers["if-none-match"] === etag) {
        response.writeHead(304, { "cache-control": "no-cache", etag });
        response.end();
        return;
      }

      const html = (await readFile(realPath, "utf8")).replaceAll("__ASSET_VERSION__", version);
      response.writeHead(200, {
        "cache-control": "no-cache",
        "content-type": type,
        etag
      });
      response.end(html);
      return;
    }

    const immutable = isVersioned(url.searchParams);
    const headers = {
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
      "content-type": type
    };
    const etag = computeEtag(fileStat);

    if (request.headers["if-none-match"] === etag) {
      response.writeHead(304, { ...headers, etag });
      response.end();
      return;
    }

    response.writeHead(200, { ...headers, etag });
    createReadStream(realPath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Markdown Viewer running at http://127.0.0.1:${port}`);
});

function isVersioned(searchParams) {
  const version = searchParams.get("v");
  return version !== null && version !== "" && version !== "__ASSET_VERSION__";
}

function computeEtag(fileStat) {
  const hash = createHash("sha1");
  hash.update(`${fileStat.size}-${fileStat.mtimeMs}`);
  return `"${hash.digest("hex").slice(0, 16)}"`;
}

async function assetVersion() {
  const hash = createHash("sha1");
  for (const file of await listFiles(root)) {
    const fileStat = await stat(file);
    hash.update(`${relative(root, file)}:${fileStat.size}:${fileStat.mtimeMs}\n`);
  }
  return hash.digest("hex").slice(0, 12);
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}
