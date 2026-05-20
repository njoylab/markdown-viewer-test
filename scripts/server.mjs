import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT ?? 3000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

createServer(async (request, response) => {
  const requestPath = normalize(decodeURIComponent(new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname));
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const filePath = join(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      throw new Error("Not a file");
    }
    response.setHeader("content-type", mimeTypes[extname(filePath)] ?? "application/octet-stream");
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Markdown Viewer running at http://127.0.0.1:${port}`);
});
