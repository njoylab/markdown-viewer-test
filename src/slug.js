const MARKDOWN_INLINE = /`([^`]*)`|!?\[([^\]]*)\]\([^)]*\)|[*_~]|<[^>]*>/g;
const SEPARATORS = /[\s\u00a0]+/g;
const UNSAFE = /[^\p{Letter}\p{Number}\- ]/gu;

export function plainText(value) {
  return String(value ?? "")
    .replace(MARKDOWN_INLINE, (match, code, label) => code ?? label ?? "")
    .replace(/\\([\\`*_{}[\]()#+\-.!>])/g, "$1")
    .trim();
}

export function slugify(value) {
  const text = plainText(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(SEPARATORS, "-")
    .replace(UNSAFE, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return text || "section";
}

export function createSlugger() {
  const used = new Map();

  return function slug(text) {
    const base = slugify(text);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };
}