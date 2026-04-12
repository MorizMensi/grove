# How it works

A conceptual tour. For the low-level source layout, see
[ARCHITECTURE](./ARCHITECTURE.md).

## The four layers

```
CLI  →  Express  →  Angular SPA  →  Doclang renderer
```

1. **CLI** (`server/bin/file-viewer.ts`)
   - Parses argv, validates the folder, chooses a port.
   - Calls `createApp(docsDir)` and `.listen(port)`.

2. **Express** (`server/index.ts`)
   - Mounts three JSON APIs: `/api/documents` (listing),
     `/api/capabilities` (platform probe), `/api/open` (external
     tool). Everything JSON is validated with zod.
   - Statically serves the built Angular bundle (the SPA).
   - Statically serves the docs folder at `/_content/`, so the SPA
     can fetch raw markdown via relative URLs.
   - Falls back to `index.html` for all unknown paths (the SPA
     catch-all), so client-side routes like `/some/deep/page`
     always land on the SPA.

3. **Angular SPA** (`frontend/src/app/`)
   - A single standalone component, `DocumentShellComponent`,
     handles every URL under the flat catch-all route `/**`.
   - It reads the current URL segments, decides whether to show a
     directory listing or a file preview, and fetches accordingly:
     - Directory → `GET /api/documents?path=…`
     - File content → `GET /_content/<path>.<ext>` (relative URL,
       resolves via `<base href>`)
   - A tiny `CapabilitiesService` caches `/api/capabilities` so the
     action buttons know which platforms they work on.

4. **Doclang renderer** (`frontend/src/app/shared/doclang/`)
   - The raw markdown is fed into `<md-node>`.
   - `md-to-doclang.ts` parses it with remark (GFM + math) and
     converts the mdast tree into a canonical *DocLang* `DlNode`
     tree — Grove's internal document format.
   - `<dl-node>` recursively renders the DocLang tree into DOM.
     Headings, code blocks, tables, lists, inline formatting,
     images, links, math blocks, and mermaid diagrams all come out
     of the same recursive component.
   - Highlighting (`highlight.service`), KaTeX rendering
     (`katex.service`), and Mermaid rendering (`mermaid.service`)
     are all lazy-loaded and cached.

## Why DocLang?

Every markdown renderer eventually needs a structured intermediate
form: raw text in one side, DOM out the other. Grove's `DlNode`
tree is that intermediate. It's a flat recursive structure with
typed nodes for headings, paragraphs, code blocks, tables, etc.,
plus a small set of styling hints (color, background, icon,
alignment).

Using an explicit tree instead of server-rendering HTML buys us
three things:

1. **Safety** — every link and image URL is filtered through
   `isSafeUrl()` during both conversion and render. Unsafe schemes
   (`javascript:`, `data:`, `file:`, `vbscript:`) never make it to
   the DOM.
2. **Re-render without re-parse** — navigation between files
   re-renders the tree without re-hitting the parser.
3. **Non-markdown sources** — the same renderer can consume other
   formats in the future (JSON descriptions, wiki syntax, etc.)
   without touching the rendering code.

## Wiki mode

When Grove is built with the `wiki` Angular configuration, the
bundle has two compile-time differences:

- `DocumentService` reads directory listings from a pre-computed
  `wiki-manifest.json` instead of `GET /api/documents`.
- `CapabilitiesService` returns a static `{terminal: false,
  zed: false, claude: false}` object, so the action buttons never
  render.

Everything else — routing, rendering, styling — is the same code
path. That's why `https://morizmensi.github.io/grove/` looks
identical to `grove ~/notes` on your laptop.

The `grove build-wiki` CLI subcommand ties the two modes together:
it walks a docs folder, generates a manifest, copies the pre-built
wiki bundle, rewrites the `<base href>` placeholder, and produces
a ready-to-upload GitHub Pages artifact.

## Next

For source file layout, the Express routing table, and the build
output tree, read the [architecture reference](./ARCHITECTURE.md).
