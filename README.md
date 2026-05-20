# Markdown Viewer Test Repo

Small browser app used as a target repository for the GitHub issue bugfix agent.

## Run

```bash
npm run dev
```

Open `http://127.0.0.1:3000`, upload a `.md` file and preview formatted Markdown.

## Checks

```bash
npm run lint
npm test
```

The agent can infer these commands from `package.json`, so a config does not need explicit `lintCommand` or `testCommand`.
