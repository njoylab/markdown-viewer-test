const blockTags = new Set(["h1", "h2", "h3", "pre", "ul", "ol", "p"]);

export function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let list = null;
  let code = null;

  const closeList = () => {
    if (list) {
      blocks.push(`<${list.type}>${list.items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</${list.type}>`);
      list = null;
    }
  };

  const closeCode = () => {
    if (code) {
      blocks.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
      code = null;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (code) {
        closeCode();
      } else {
        closeList();
        code = { lines: [] };
      }
      continue;
    }

    if (code) {
      code.lines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${formatInline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      if (!list || list.type !== "ul") {
        closeList();
        list = { type: "ul", items: [] };
      }
      list.items.push(unordered[1]);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      if (!list || list.type !== "ol") {
        closeList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    closeList();
    blocks.push(`<p>${formatInline(line)}</p>`);
  }

  closeCode();
  closeList();

  return blocks.filter((block) => blockTags.has(block.match(/^<([a-z0-9]+)/)?.[1] ?? "")).join("\n");
}

function formatInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
