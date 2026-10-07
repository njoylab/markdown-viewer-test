# Markdown Viewer Test Repo

Small browser app used as a target repository for the GitHub issue bugfix agent.

## Run

```bash
npm run dev
```

Open `http://127.0.0.1:3000`, upload a `.md` file and preview formatted Markdown.

## Features

- Drag-and-drop a `.md`, `.markdown` or `.txt` file anywhere on the page, or upload it with the button.
- Paste Markdown from the clipboard with `Ctrl+V` / `Cmd+V`.
- YAML frontmatter is parsed and shown as a metadata card with title, tag badges and key/value fields.
- GitHub-flavoured tables with column alignment and task lists with checkboxes.
- Syntax highlighting for fenced code blocks (JavaScript/TypeScript, JSON, CSS, HTML, shell, Python).
- Dark/light mode toggle with system preference detection, persisted in `localStorage`.

Everything runs in the browser with no dependencies: `src/markdown.js` parses Markdown, `src/highlight.js` highlights code, `src/frontmatter.js` reads metadata and `src/theme.js` handles the colour theme.

## Checks

```bash
npm run lint
npm test
```

The agent can infer these commands from `package.json`, so a config does not need explicit `lintCommand` or `testCommand`.

## E2E

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

## E2E Fixture

Use `test/fixtures/sample.md` as the upload file for browser/e2e checks.
