import { escapeHtml } from "./html.js";

const ALIASES = {
  js: "js",
  javascript: "js",
  mjs: "js",
  cjs: "js",
  jsx: "js",
  ts: "js",
  tsx: "js",
  typescript: "js",
  json: "json",
  jsonc: "json",
  css: "css",
  html: "html",
  xml: "html",
  svg: "html",
  vue: "html",
  bash: "shell",
  sh: "shell",
  shell: "shell",
  zsh: "shell",
  py: "python",
  python: "python"
};

const JS_KEYWORDS =
  "as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|" +
  "extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|keyof|let|new|of|" +
  "private|protected|public|readonly|return|satisfies|set|static|super|switch|this|throw|try|type|typeof|" +
  "var|void|while|with|yield";
const JS_LITERALS = "true|false|null|undefined|NaN|Infinity";
const SHELL_KEYWORDS =
  "alias|awk|break|case|cat|cd|chmod|chown|continue|cp|curl|do|done|echo|elif|else|esac|exit|export|fi|" +
  "for|function|grep|if|in|local|ls|mkdir|mv|node|npm|npx|read|return|rm|sed|set|shift|source|sudo|" +
  "then|trap|unset|until|wait|while|xargs";
const PYTHON_KEYWORDS =
  "and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|finally|for|from|global|" +
  "if|import|in|is|lambda|match|nonlocal|not|or|pass|raise|return|try|while|with|yield";

const STRING_PATTERNS = [
  '"""[\\s\\S]*?"""',
  "'''[\\s\\S]*?'''",
  '"(?:[^"\\\\\\n]|\\\\.)*"',
  "'(?:[^'\\\\\\n]|\\\\.)*'"
];

function sticky(source, flags = "") {
  return new RegExp(source, `y${flags}`);
}

function atLineStart(code, index) {
  return index === 0 || code[index - 1] === "\n";
}

function afterWhitespace(code, index) {
  return index === 0 || /\s/.test(code[index - 1]);
}



const RULES = {
  js: [
    { type: "comment", pattern: sticky("//[^\\n]*") },
    { type: "comment", pattern: sticky("/\\*[\\s\\S]*?\\*/") },
    { type: "string", pattern: sticky("`(?:[^`\\\\]|\\\\.)*`") },
    { type: "string", pattern: sticky(STRING_PATTERNS.join("|"), "i") },
    { type: "number", pattern: sticky("0[xXbBoO][0-9a-fA-F_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?") },
    { type: "keyword", pattern: sticky(`\\b(?:${JS_KEYWORDS})\\b`) },
    { type: "literal", pattern: sticky(`\\b(?:${JS_LITERALS})\\b`) },
    { type: "func", pattern: sticky("[A-Za-z_$][\\w$]*(?=\\s*\\()") },
    { type: "attr", pattern: sticky("(?<=\\.)[A-Za-z_$][\\w$]*") }
  ],
  json: [
    { type: "attr", pattern: sticky('"(?:[^"\\\\]|\\\\.)*"(?=\\s*:)') },
    { type: "string", pattern: sticky('"(?:[^"\\\\]|\\\\.)*"') },
    { type: "number", pattern: sticky("-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?") },
    { type: "literal", pattern: sticky("\\b(?:true|false|null)\\b") }
  ],
  css: [
    { type: "comment", pattern: sticky("/\\*[\\s\\S]*?\\*/") },
    { type: "string", pattern: sticky('"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'') },
    { type: "keyword", pattern: sticky("@[a-zA-Z-]+|!important") },
    { type: "number", pattern: sticky("#[0-9a-fA-F]{3,8}\\b") },
    { type: "number", pattern: sticky("-?\\d*\\.?\\d+(?:%|[a-zA-Z]{1,4})?") },
    { type: "attr", pattern: sticky("[-a-zA-Z]+(?=\\s*:)") }
  ],
  html: [
    { type: "comment", pattern: sticky("<!--[\\s\\S]*?-->") },
    { type: "keyword", pattern: sticky("<!DOCTYPE[^>]*>", "i") },
    { type: "tag", pattern: sticky("</?[a-zA-Z][\\w:-]*") },
    { type: "tag", pattern: sticky("/?>") },
    { type: "attr", pattern: sticky("[a-zA-Z_:][\\w:.-]*(?=\\s*=)") },
    { type: "string", pattern: sticky('"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'') }
  ],
  shell: [
    { type: "comment", pattern: sticky("#!/[^\\n]*"), guard: atLineStart },
    { type: "comment", pattern: sticky("#[^\\n]*"), guard: afterWhitespace },
    { type: "string", pattern: sticky('"(?:[^"\\\\]|\\\\.)*"|\'[^\']*\'') },
    { type: "var", pattern: sticky("\\$(?:\\{[^}]*\\}|[A-Za-z_]\\w*|[0-9@*#?$!-])") },
    { type: "attr", pattern: sticky("--?[a-zA-Z][\\w-]*"), guard: afterWhitespace },
    { type: "keyword", pattern: sticky(`\\b(?:${SHELL_KEYWORDS})\\b`) },
    { type: "number", pattern: sticky("\\b\\d+\\b") }
  ],
  python: [
    { type: "comment", pattern: sticky("#[^\\n]*") },
    { type: "string", pattern: sticky("(?:[rbfuRBFU]{0,2})?(?:" + STRING_PATTERNS.join("|") + ")", "i") },
    { type: "keyword", pattern: sticky("@[A-Za-z_][\\w.]*") },
    { type: "keyword", pattern: sticky(`\\b(?:${PYTHON_KEYWORDS})\\b`) },
    { type: "literal", pattern: sticky("\\b(?:True|False|None)\\b") },
    { type: "number", pattern: sticky("\\b\\d[\\d_]*(?:\\.\\d+)?\\b") },
    { type: "func", pattern: sticky("[A-Za-z_]\\w*(?=\\s*\\()") }
  ]
};

export function highlight(code, language) {
  const text = code === null || code === undefined ? "" : String(code);
  const rules = RULES[resolveLanguage(language)];
  if (!rules) {
    return escapeHtml(text);
  }

  let html = "";
  let plain = "";
  let index = 0;

  while (index < text.length) {
    const rule = matchRule(rules, text, index);
    if (rule) {
      html += escapeHtml(plain) + token(rule.type, rule.text);
      plain = "";
      index += rule.text.length;
      continue;
    }

    plain += text[index];
    index += 1;
  }

  return html + escapeHtml(plain);
}

export function resolveLanguage(language) {
  const key = String(language ?? "").trim().toLowerCase();
  return ALIASES[key] ?? null;
}

function matchRule(rules, code, index) {
  for (const rule of rules) {
    if (rule.guard && !rule.guard(code, index)) {
      continue;
    }
    rule.pattern.lastIndex = index;
    const match = rule.pattern.exec(code);
    if (match && match[0].length > 0) {
      return { type: rule.type, text: match[0] };
    }
  }
  return null;
}

function token(type, text) {
  return `<span class="tok-${type}">${escapeHtml(text)}</span>`;
}