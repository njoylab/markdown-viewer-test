export function renderMarkdown(markdown) {
  const lines = markdown.replace(/\0/g, "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let list = null;
  let code = null;
  let paragraph = [];
  let quote = [];

  const closeList = () => {
    if (list) {
      const attr = list.type === "ol" && list.start > 1 ? ` start="${list.start}"` : "";
      blocks.push(`<${list.type}${attr}>${list.items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</${list.type}>`);
      list = null;
    }
  };

  const closeCode = () => {
    if (code) {
      blocks.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
      code = null;
    }
  };

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(`<p>${formatInline(paragraph.join("\n"))}</p>`);
      paragraph = [];
    }
  };

  const closeQuote = () => {
    if (quote.length > 0) {
      blocks.push(`<blockquote>${renderMarkdown(quote.join("\n"))}</blockquote>`);
      quote = [];
    }
  };

  const closeText = () => {
    closeList();
    closeParagraph();
    closeQuote();
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (code) {
        closeCode();
      } else {
        closeText();
        code = { lines: [] };
      }
      continue;
    }

    if (code) {
      code.lines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeText();
      continue;
    }

    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) {
      closeList();
      closeParagraph();
      quote.push(quoted[1]);
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      closeText();
      const level = heading[1].length;
      blocks.push(`<h${level}>${formatInline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      closeParagraph();
      closeQuote();
      if (!list || list.type !== "ul") {
        closeList();
        list = { type: "ul", items: [] };
      }
      list.items.push(unordered[1]);
      continue;
    }

    const ordered = /^(\d+)\.\s+(.+)$/.exec(line);
    if (ordered) {
      closeParagraph();
      closeQuote();
      const start = Number(ordered[1]);
      if (!list || list.type !== "ol") {
        closeList();
        list = { type: "ol", start, items: [] };
      }
      list.items.push(ordered[2]);
      continue;
    }

    closeList();
    closeQuote();
    paragraph.push(line);
  }

  closeCode();
  closeText();

  return blocks.join("\n");
}

function formatInline(value) {
  const tokens = [];
  const stash = (html) => {
    tokens.push(html);
    return "\0" + (tokens.length - 1) + "\0";
  };

  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, (match, content) => stash(`<code>${content}</code>`));
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (match, label, url) =>
    stash(`<a href="${url}" rel="noreferrer">${applyEmphasis(label)}</a>`)
  );
  text = applyEmphasis(text);

  return restoreTokens(text, tokens);
}

function applyEmphasis(text) {
  return text
    .replace(/\*\*(?!\s)(.+?)(?<!\s)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(?!\s)([^*\n]+?)(?<!\s)\*/g, "<em>$1</em>");
}

function restoreTokens(text, tokens) {
  return text.replace(/\0(\d+)\0/g, (match, index) => restoreTokens(tokens[Number(index)], tokens));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
