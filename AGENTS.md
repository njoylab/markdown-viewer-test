# Repository Guidelines

## Project Structure & Module Organization

This is a small vanilla JavaScript Markdown viewer fixture. Browser code lives in `src/`: `app.js` wires the UI, `markdown.js` contains Markdown rendering logic, and `styles.css` holds page styling. `index.html` is the app entry point. Local serving is handled by `scripts/server.mjs`; repository checks live in `scripts/lint.mjs`. Tests are under `test/`, with unit tests in `test/*.test.js`, browser/e2e tests in `test/e2e/`, and upload fixtures in `test/fixtures/`.

## Build, Test, and Development Commands

Use Node.js 20 or newer.

- `npm run dev`: starts the local server from `scripts/server.mjs`; open `http://127.0.0.1:3000`.
- `npm run lint`: runs syntax checks across `src/`, `scripts/`, and `test/`.
- `npm test`: runs unit tests with Node's built-in test runner.
- `npm run test:e2e`: runs e2e tests, including Markdown upload coverage.

There is no separate build step; the app is served as static HTML, CSS, and ES modules.

## Coding Style & Naming Conventions

Use ES modules and keep code dependency-free unless a task clearly requires otherwise. Match the existing style: two-space indentation, double quotes, semicolons, and small focused functions. Prefer descriptive camelCase names such as `renderMarkdown` and file names that reflect their role, for example `markdown.test.js` or `upload-markdown.test.js`.

## Testing Guidelines

Tests use `node:test` and `node:assert/strict`. Add or update unit tests in `test/*.test.js` when changing Markdown parsing or HTML escaping. Add e2e coverage in `test/e2e/*.test.js` when changing upload, preview, or browser behavior. Use `test/fixtures/sample.md` for upload scenarios unless a case needs a dedicated fixture.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries, for example `Add markdown upload e2e test` and `Avoid favicon 404`. Keep commits scoped to one concern. Pull requests should include a concise description, the commands run (`npm run lint`, `npm test`, and e2e when relevant), and screenshots only when UI output changes.

## Agent-Specific Instructions

Before editing, inspect the affected source and tests. Keep patches small, avoid broad refactors, and do not introduce package dependencies for simple parser or fixture changes. Always report which checks were run and any checks skipped.

For the GitHub issue bugfix agent workflow, use `/Users/emln/dev/b4i/ht_llm/configs/markdown-viewer-local.json` as the config path for this fixture.
