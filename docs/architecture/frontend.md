# Frontend layer

Grove's frontend is a single Angular 19 standalone application
with exactly one route and one feature component. All the
complexity lives in the **DocLang renderer** — see
[doclang.md](./doclang.md).

## Module map

```mermaid
flowchart TD
  MAIN["main.ts"] --> CFG["app.config.ts"]
  CFG --> RT["app.routes.ts"]
  RT --> DS["DocumentShellComponent"]

  DS --> DSV[DocumentService]
  DS --> CSV[CapabilitiesService]
  DS --> THSV[ThemeService]
  DS --> MD[MdNodeComponent]
  DS --> GM[GroveMarkComponent]
  DS --> TS[ThemeSwitcherComponent]
  DS --> WF[WikiFooterComponent]

  MD --> DL[DlNodeComponent]

  DL --> HL[HighlightService]
  DL --> KX[KatexService]
  DL --> MM[MermaidService]

  subgraph "core/"
    DSV
    CSV
    THSV
    UT["utils/<br/>url-safety<br/>title-from-segment"]
    FT["constants/<br/>file-types<br/>theme.constants"]
  end

  subgraph "features/"
    DS
  end

  subgraph "shared/"
    MD
    DL
    HL
    KX
    MM
    GM
    TS
    WF
  end
```

Source: [`frontend/src/app/`](https://github.com/MorizMensi/grove/tree/main/frontend/src/app)

## Routing

There is exactly one route:

```ts
// frontend/src/app/app.routes.ts
export const routes: Routes = [
  {
    path: '**',
    loadComponent: () =>
      import('./features/document-shell/document-shell.component')
        .then(m => m.DocumentShellComponent),
  },
];
```

The catch-all wildcard (`'**'`) hands every URL to
`DocumentShellComponent`, which inspects the URL segments itself
and decides what to render. This keeps the router config trivial
and lets deep links like `/architecture/server` work without any
per-page route config.

`withInMemoryScrolling({ anchorScrolling: 'enabled' })` is set in
`app.config.ts`, which enables `#fragment` scrolling when
navigating via the router. The document shell also has a manual
fragment retry (`scrollToFragment()`) for the first markdown
render, because the fragment target may not exist at the moment
the navigation completes — see
[anchor navigation](#anchor-navigation) below.

## DocumentShellComponent

File:
[`frontend/src/app/features/document-shell/document-shell.component.ts`](https://github.com/MorizMensi/grove/blob/main/frontend/src/app/features/document-shell/document-shell.component.ts)

The component is a state machine over its `mode` field:

```mermaid
stateDiagram-v2
  [*] --> loading: URL change
  loading --> directory: listDirectory ok
  loading --> file: loadFileWithExtension ok
  loading --> not_found: both failed
  directory --> loading: navigate
  file --> loading: navigate
  not_found --> loading: navigate
  file --> file: fragment scroll
```

### Resolution algorithm

```mermaid
flowchart TD
  URL[URL segments joined as filePath] --> EXT{"?extension set?"}
  EXT -->|yes & not md| MEDIA[loadFileWithExtension(ext)]
  EXT -->|no or md| LIST["listDirectory(filePath)"]
  LIST -->|ok| DIR[render directory listing]
  LIST -->|error| FB[loadFileWithExtension('md')]
  FB --> KIND{"previewKindFor(ext)"}
  KIND -->|image/video/audio/pdf| MEDIA2[set mediaUrl, fileType]
  KIND -->|svg| BOTH[set mediaUrl + fetch adjacent md]
  KIND -->|null / 'text'| TEXT["getFileContent(path, ext)"]
  TEXT --> MD{"ext == md?"}
  MD -->|yes| RENDER[md-node renders markdown]
  MD -->|no| FENCE[wrap content in fenced code block]
```

The **directory-or-file** guess is deliberate:

1. First try `listDirectory(path)` — cheap and succeeds when the
   URL really is a directory.
2. On failure, assume the path is a file and fetch
   `_content/<path>.md` (or the extension from `?extension=…`).

This is why the URL for `docs/getting-started.md` is just
`/getting-started` with no extension query param.

### Media files

Non-markdown files live inside the same URL namespace; the
extension is preserved via a `?extension=<ext>` query param that
`entryQueryParams()` builds when rendering a listing. That way
the browser URL matches the file identity but the SPA still
knows which extension to render.

For PDF embedding, the URL is passed through Angular's
`DomSanitizer.bypassSecurityTrustResourceUrl` (required for
`<iframe src>`). Other media types — images, video, audio —
bind the URL directly because Angular doesn't mark them as
dangerous. See
[file-types reference](../reference/file-types.md) for the full
matrix.

### Action buttons

The header shows up to four buttons (Terminal / Zed / Claude /
Edit file) gated on `capabilities().supports.*`. The
`CapabilitiesService` either:

- Calls `GET /api/capabilities` in server mode.
- Hard-codes `{ terminal: false, zed: false, claude: false }` in
  wiki mode — see [wiki-mode.md](./wiki-mode.md).

Clicking a button fires `POST /api/open` with
`{ action, path: <folder or file> }`. In wiki mode the service
short-circuits to `EMPTY` so no network call is made.

## Services

### DocumentService

Source:
[`core/services/document.service.ts`](https://github.com/MorizMensi/grove/blob/main/frontend/src/app/core/services/document.service.ts)

Two runtime modes, selected via the environment file at build time:

```mermaid
flowchart LR
  ENV["environment.mode"] --> SRV{"server"}
  ENV --> WIK{"wiki"}

  SRV --> API["GET /api/documents?path=..."]
  SRV --> RAW1["GET _content/&lt;path&gt;.&lt;ext&gt;"]
  SRV --> OP["POST /api/open"]

  WIK --> MAN["GET wiki-manifest.json"]
  MAN --> DIRS["directories[path]"]
  WIK --> RAW2["GET _content/&lt;path&gt;.&lt;ext&gt;"]
  WIK --> NOOP["openExternal() → EMPTY"]
```

The manifest is loaded once, cached via `shareReplay(1)`, and
reused for every listing lookup. Raw file content uses the same
relative URL (`_content/<path>.<ext>`) in both modes — see
[wiki-mode.md](./wiki-mode.md) for why.

The service also owns a `siteName` signal; in wiki mode it picks
up `manifest.siteName` when the manifest loads. `DEFAULT_SITE_NAME`
is `"Grove"` for server mode.

### CapabilitiesService

Source:
[`core/services/capabilities.service.ts`](https://github.com/MorizMensi/grove/blob/main/frontend/src/app/core/services/capabilities.service.ts)

- **Optimistic default**: hides everything platform-gated and
  shows `zed` until the HTTP call lands. Prevents a flash of
  disabled buttons on boot.
- **Wiki default**: everything off. No HTTP call made.
- **On error**: keeps the optimistic default; `POST /api/open`
  would 501 if a button shouldn't have shown, which the server
  still validates.

### ThemeService

Source:
[`core/services/theme.service.ts`](https://github.com/MorizMensi/grove/blob/main/frontend/src/app/core/services/theme.service.ts)

Two signals — `palette` and `modeSelection` — plus a computed
`resolvedMode` signal that folds `system` into light/dark via
`prefers-color-scheme`. Writes apply `data-theme=<palette>` and
`data-mode=<light|dark>` to `<html>` and persist to
`localStorage`. See [themes.md](./themes.md) for the palette
catalog and SCSS token layout.

## Anchor navigation

Heading IDs are assigned at parse time, not at render time:

1. `md-to-doclang` converts the mdast tree to a DocLang tree.
2. `md-node.component.ts` calls `simplify(dlNode)` and then
   `assignHeadingIds(dlNode)` — the slug tracker walks the tree
   and assigns GitHub-compatible slugs (`slug.ts`).
3. `dl-node.component.ts` renders `<h1>`/`<h2>`/… with the `id`
   attribute.

Router navigation to `/some/page#anchor` triggers the Angular
`withInMemoryScrolling` logic, but the heading may not yet be in
the DOM when navigation completes (markdown is parsed
asynchronously). `DocumentShellComponent.scrollToFragment()`
retries `getElementById(fragment)` until it resolves or 2 seconds
elapse, then smooth-scrolls.

## See also

- [DocLang renderer deep dive](./doclang.md)
- [Wiki bundle mode](./wiki-mode.md)
- [Themes](./themes.md)
- [Security model](./security.md) — the URL filter used during
  markdown conversion and rendering
- [HTTP API reference](../reference/http-api.md)
- [File-types reference](../reference/file-types.md)
- [Back to architecture index](./index.md)
