import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { isAbsolute, join, normalize, relative, sep } from "node:path";
import { contentType } from "./content-type.mjs";

const root = await realpath(process.cwd());
const port = Number(process.env.PORT ?? 3000);

createServer(async (request, response) => {
  try {
    const requestPath = normalize(decodeURIComponent(new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname));
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

    response.setHeader("content-type", contentType(realPath));
    createReadStream(realPath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Markdown Viewer running at http://127.0.0.1:${port}`);
});
