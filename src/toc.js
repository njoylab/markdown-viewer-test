const DEFAULT_MIN_LEVEL = 2;
const DEFAULT_MAX_LEVEL = 3;

export function buildToc(headings, options = {}) {
  const minLevel = normalizeLevel(options.minLevel, DEFAULT_MIN_LEVEL);
  const maxLevel = normalizeLevel(options.maxLevel, DEFAULT_MAX_LEVEL);
  const low = Math.min(minLevel, maxLevel);
  const high = Math.max(minLevel, maxLevel);

  if (!Array.isArray(headings)) {
    return [];
  }

  return headings
    .filter((heading) => heading.level >= low && heading.level <= high)
    .map((heading) => ({
      level: heading.level,
      text: heading.text,
      id: heading.id,
      depth: heading.level - low
    }));
}

export function headingHref(heading) {
  const id = typeof heading === "string" ? heading : heading?.id;
  return `#${encodeURIComponent(id ?? "")}`;
}

export function findHeadingById(headings, id) {
  const wanted = decodeHash(id);
  if (!wanted || !Array.isArray(headings)) {
    return null;
  }
  return headings.find((heading) => heading.id === wanted) ?? null;
}

export function decodeHash(hash) {
  const value = String(hash ?? "").replace(/^#/, "");
  if (value === "") {
    return "";
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeLevel(value, fallback) {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= 6 ? level : fallback;
}