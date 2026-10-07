const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):/;
const ALLOWED_SCHEMES = new Set(["http", "https", "mailto", "tel"]);
const BLOCKED_SCHEMES = new Set(["data", "blob", "file", "filesystem", "javascript", "vbscript"]);

export function normalizeUrl(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, " ")
    .replace(CONTROL_CHARS, "")
    .trim();
}

export function safeUrl(value) {
  const url = normalizeUrl(value);
  if (url === "") {
    return null;
  }

  const scheme = SCHEME.exec(url);
  if (!scheme) {
    return isRelativeUrl(url) ? url : null;
  }

  const name = scheme[1].toLowerCase();
  if (BLOCKED_SCHEMES.has(name)) {
    return null;
  }
  return ALLOWED_SCHEMES.has(name) ? url : null;
}

export function isSafeUrl(value) {
  return safeUrl(value) !== null;
}

function isRelativeUrl(url) {
  if (url.startsWith("//")) {
    return false;
  }
  if (url.startsWith("#") || url.startsWith("./") || url.startsWith("../")) {
    return true;
  }
  if (url.startsWith("/")) {
    return !url.startsWith("/\\");
  }
  return !url.startsWith("\\");
}