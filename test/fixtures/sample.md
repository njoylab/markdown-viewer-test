# Release Notes

This document checks **bold text**, *italic text*, inline `code`, and a [public link](https://example.com).

## Highlights

- Upload works from a local `.md` file.
- Markdown is rendered as formatted HTML.
- Unsafe HTML like `<script>alert("xss")</script>` is escaped.

## Steps

1. Open the Markdown Viewer.
2. Upload this file.
3. Confirm that headings, lists, links and code blocks are visible.

```js
const status = "rendered";
console.log(status);
```

### Expected Result

The preview should show formatted content without executing raw HTML.
