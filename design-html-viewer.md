# HTML / SVG Preview with Source Toggle — Design

## Context

Grove currently renders files by dispatching in `DocumentShellComponent` based on `previewKindFor(ext)` (`frontend/src/app/core/constants/file-types.ts:81`). Today:

- `.html` files fall into the text branch and are shown as syntax-highlighted code via `<md-node>` with a ` ```html ` code fence (`document-shell.component.ts:147`).
- `.svg` files render as an `<img>` **and** the source code stacked underneath, via the template `@case ("svg")` branch (`document-shell.component.html:154–160`).

The user wants:

1. HTML files to render as actual HTML inside grove, inheriting grove's theme styling.
2. A toggle in the navigation bar to flip between **preview** and **source**. Source view keeps today's syntax-highlighted behavior.
3. SVGs to follow the same pattern: preview (image) OR source (code), not both stacked.
4. In preview mode, content bleeds edge-to-edge — no padding between the navbar / sidebar borders and the rendered HTML.
5. The renderer shipped as its own component, designed so additional file kinds (markdown source view, JSON tree, CSV table, mermaid diagrams, …) can slot in later without re-opening `DocumentShellComponent`.

### Trust model

Grove ships as an npm package that is integrated into a repo's CI workflow to deploy that repo's own grove instance (server mode for local dev, static wiki bundle for GitHub Pages). Each deployed instance serves **exactly one repo's docs**, and the operator of the instance is the same party that owns the repo. There is no third-party hosting scenario.

That does **not** make HTML content trusted. Two threat actors remain:

1. **PR contributors.** A malicious contributor proposes `malicious.html`; a maintainer previews the PR branch locally before merge; the file executes in the maintainer's browser with access to adjacent docs through grove's own asset pipeline (`/_content/...`). This is the highest-risk path — maintainer boxes often hold more sensitive state than the published wiki.
2. **Visitors of the published wiki.** Once merged, the file runs for every visitor. Impact is defacement / phishing / redirect; grove has no auth so cookie theft is not a factor, but reputational harm is.

### Isolation strategy

Two independent layers — **XSS is handled by sanitization, style bleed is handled by Shadow DOM**. The two concerns must not be conflated.

- **Sanitization — DOMPurify.** Strips `<script>`, inline `on*` handlers, `javascript:` / `data:` URLs by default. We additionally forbid `<iframe>`, `<object>`, `<embed>`, and `<link>` so an attacker cannot smuggle execution via a sibling file in the same docs folder. `<style>` blocks stay allowed so authors can hand-style their pages. This is the only line of defence against script execution.
- **Style isolation — Shadow DOM.** A rendered author's `body { background: red }` must not leak out and break grove's chrome. Shadow DOM gives iframe-level style encapsulation while letting grove's theme CSS custom properties cross freely (they inherit through shadow boundaries) — so no postMessage plumbing, no manual token injection on theme change, no broken Angular routing. **Shadow DOM is not a security boundary**: shadow roots share the document's JS context, cookies, and fetch origin with the host. Only sanitization makes the content safe.

`DomSanitizer.bypassSecurityTrustHtml` is still called, but the "explicit sanitization" that justifies it is **DOMPurify running in the same function**, not the shadow root.

---

## Architecture

### Two new components + one small utility

```
frontend/src/app/shared/file-preview/
├── file-preview.component.ts        NEW — dispatcher, switches on (kind × mode)
├── file-preview.component.html      NEW
├── file-preview.component.scss      NEW
├── file-preview.component.spec.ts   NEW
├── html-preview.component.ts        NEW — Shadow DOM host for user HTML
├── html-preview.component.html      NEW
├── html-preview.component.scss      NEW
└── html-preview.component.spec.ts   NEW

frontend/src/app/core/utils/
├── resolve-content-url.ts           NEW — extracted from dl-node.component.ts:106
└── resolve-content-url.spec.ts      NEW
```

### Responsibilities

**`FilePreviewComponent`** — pure dispatcher. Stateless. Given a `kind` (image, video, audio, pdf, svg, html, text) and a `mode` (`preview` | `source`), renders the right child. Lives in `shared/` because it may be reused by hypothetical future features (e.g. an inline preview card in search results). Standalone, `ChangeDetectionStrategy.OnPush`.

**`HtmlPreviewComponent`** — the only place `ViewEncapsulation.ShadowDom` is used in the codebase. Renders user HTML inside a shadow root so outer grove styles stay on grove's side and inner user styles stay on the user's side. Theme tokens cross freely via CSS custom property inheritance. Standalone, `ChangeDetectionStrategy.OnPush`.

**`resolveContentUrl(routeSegments, rawPath)`** — pulls the relative-path resolution already present in `DlNodeComponent.resolveRelativeToDoc` (`dl-node.component.ts:106–118`) into a shared util. Needed twice: `DlNodeComponent` stays as-is but switches to the util; `HtmlPreviewComponent` uses it when rewriting `<img src>` / `<a href>` / `<link href>` / etc. inside the user's HTML.

### Data flow

```
DocumentShellComponent
├── signal viewerMode: 'preview' | 'source'      (reset to 'preview' on each nav)
├── computed hasDualView(extension)               (true for html, svg; future: md, json, csv…)
├── fetches sourceText (always, for source mode)
├── fetches mediaUrl (for svg/image/video/audio/pdf)
└── template:
    navbar → segmented toggle, visible iff hasDualView()
    content → <app-file-preview
                  [kind]="fileType"
                  [mode]="viewerMode()"
                  [filePath]="currentPath"
                  [extension]="extension"
                  [sourceText]="markdown"      (raw text, used for source mode)
                  [mediaUrl]="mediaUrl"
                />
    .wiki-content gets .wiki-content--bleed when viewerMode==='preview' && hasDualView()
```

`FilePreviewComponent` then decides:

| `kind` | `mode === 'preview'` | `mode === 'source'` |
|---|---|---|
| `html` | `<app-html-preview [html]="sourceText" [assetBase]="parentDir">` | `<md-node [markdown]="fencedSource">` |
| `svg`  | `<img [src]="mediaUrl" class="bleed-img">` | `<md-node [markdown]="fencedSource">` |
| `image` / `video` / `audio` / `pdf` | existing native element | n/a (toggle hidden) |
| `text` | `<md-node [markdown]="markdown">` | same (future: markdown dual view) |

Where `fencedSource` is ` ```${extension}\n${sourceText}\n``` ` — the same string `DocumentShellComponent` builds today at `document-shell.component.ts:147`, just relocated to the child.

---

## `HtmlPreviewComponent` internals

The critical component. Full sketch:

```ts
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-html-preview',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="host" [innerHTML]="trustedHtml()"></div>`,
  styleUrl: './html-preview.component.scss',
})
export class HtmlPreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);

  readonly html = input.required<string>();
  readonly assetBase = input.required<string>();  // parent dir of the current file

  readonly trustedHtml = computed(() => {
    // Sanitization FIRST — strips scripts, on* handlers, javascript:/data: URLs,
    // iframes, objects, embeds, and <link>. <style> is kept for author CSS.
    const safe = sanitizeUserHtml(this.html());
    // Relative URL rewriting runs on already-safe markup.
    const rewritten = rewriteUserHtml(safe, this.assetBase());
    // bypassSecurityTrustHtml is safe here because DOMPurify is the explicit
    // sanitizer; Shadow DOM only handles style isolation.
    return this.sanitizer.bypassSecurityTrustHtml(rewritten);
  });

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) return;
    // Explicit scheme allowlist: relative, http(s), mailto. Defence-in-depth on
    // top of DOMPurify which already rejects javascript:/vbscript:/data:.
    if (/^(https?:|mailto:)/i.test(href)) return;  // let the browser handle
    if (/^[a-z]+:/i.test(href)) { event.preventDefault(); return; }  // refuse everything else
    event.preventDefault();
    this.router.navigateByUrl(href);
  }
}
```

### `sanitizeUserHtml(html)` — DOMPurify configuration

```ts
export function sanitizeUserHtml(raw: string): string {
  return DOMPurify.sanitize(raw, {
    // DOMPurify default FORBID_ATTR already includes every on* handler.
    // Default ALLOWED_URI_REGEXP already rejects javascript:, vbscript:, data:
    // (except for whitelisted images).
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link'],
    // <style> is intentionally kept so authors can hand-style their pages.
    ADD_TAGS: [],
    // Allow relative URLs, http(s), mailto, and fragments — mirrors the
    // click-interceptor's allowlist.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z][a-z0-9+.-]*[^:a-z0-9+.-]|#)/i,
    RETURN_TRUSTED_TYPE: false,
  });
}
```

### `rewriteUserHtml(safeHtml, base)` — what it does

1. Parse the **already sanitized** string via `new DOMParser().parseFromString(safeHtml, 'text/html')`.
2. Walk nodes that hold URLs:
   - `img[src]`, `img[srcset]`, `source[src]`, `video[src]`, `video[poster]`, `audio[src]`, `track[src]`, `a[href]`. (No `script`, `iframe`, `object`, `embed`, `link` — DOMPurify already removed them.)
3. For each, if the URL is relative (not absolute, not a scheme, not starting with `/`, not a fragment), rewrite it through `resolveContentUrl(base, rawPath)` → `/_content/<resolved>`. `a[href]` that resolves to another markdown/html/asset inside the docs tree gets `/<resolved>` (no `_content/` prefix — those are grove routes).
4. Serialize: extract `doc.body.innerHTML` plus any `<style>` from `doc.head`, concatenated. This supports both full-document and fragment authoring.
5. Return the concatenated string. It is set via `[innerHTML]` inside the shadow root.

Both `sanitizeUserHtml` and `rewriteUserHtml` are pure functions, easy to unit-test with fixtures (once a test runner is stood up — see §Verification plan).

### Shadow root CSS (`html-preview.component.scss`)

```scss
:host {
  display: block;
  // CSS custom properties from :root cross shadow boundary automatically.
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  padding: 0;
  margin: 0;
  min-height: 100%;
}

.host {
  // Sensible defaults for unstyled user HTML. The user's own <style> tags
  // appear later in the cascade and can override any of these.
  h1, h2, h3, h4 { color: var(--color-text-heading); }
  a { color: var(--color-text-link); }
  code, pre { font-family: var(--font-mono); }
  img, svg, video { max-width: 100%; }
  // Top-level margin reset so first element doesn't gap the navbar border.
  > *:first-child { margin-top: 0; }
  > *:last-child  { margin-bottom: 0; }
}
```

### Known limitations

1. **No JavaScript execution, ever.** DOMPurify strips `<script>` and every `on*` handler. `javascript:` URLs are blocked at parse time and re-checked by the router click interceptor. This is deliberate — there is no "open as iframe" escape hatch in v1. If a future file kind genuinely needs interactive JS (e.g. a live WebGL demo) it will go through its own dedicated preview component with explicit `<iframe sandbox>` containment.
2. **No `<iframe>`, `<object>`, `<embed>`, or external `<link rel=stylesheet>`.** All four are stripped by `FORBID_TAGS`. Authors who want to embed external media get `<img>`, `<video>`, `<audio>`, and `<a>`. `<style>` blocks remain allowed for inline CSS.
3. **Printing a Shadow DOM subtree is inconsistent across browsers.** Chromium/WebKit print shadow content correctly; older Firefox had gaps. The existing `@media print` block in `document-shell.component.scss:332` hides navbar/sidebar. If the preview prints incompletely in Firefox, the documented workaround is **toggle to Source before printing**. A follow-up ticket can explore a light-DOM clone during `beforeprint`, but it is not in v1.
4. **Large HTML files (>5MB) may cause DOM slowness.** `DOMParser` + `[innerHTML]` is synchronous. This is the same constraint as existing markdown rendering in grove, so it is not a regression, but document it so it is not a surprise. A future optimization can stream parse or virtualize — not in v1.
5. **Shadow DOM is style isolation, not a security boundary.** Every JS-safety guarantee comes from DOMPurify. A future maintainer who removes or loosens the sanitization step — for example by skipping DOMPurify for "trusted fragments" — reopens every XSS path. This constraint is restated at the `HtmlPreviewComponent` call site as a code comment for emphasis.

---

## Navbar toggle

### Placement

Inside the existing `.action-buttons` pill (`document-shell.component.html:22–59`), rendered **only** when `hasDualView()` is true. A new segmented control appended after the existing action buttons (or before — TBD during implementation, whichever reads better; both are one-line changes).

### Markup

```html
@if (hasDualView()) {
  <div class="viewer-toggle" role="group" aria-label="Viewer mode">
    <button
      type="button"
      class="viewer-toggle__btn"
      [class.viewer-toggle__btn--active]="viewerMode() === 'preview'"
      [attr.aria-pressed]="viewerMode() === 'preview'"
      (click)="setViewerMode('preview')">
      <i class="bi bi-eye" aria-hidden="true"></i>
      <span>Preview</span>
    </button>
    <button
      type="button"
      class="viewer-toggle__btn"
      [class.viewer-toggle__btn--active]="viewerMode() === 'source'"
      [attr.aria-pressed]="viewerMode() === 'source'"
      (click)="setViewerMode('source')">
      <i class="bi bi-code-slash" aria-hidden="true"></i>
      <span>Source</span>
    </button>
  </div>
}
```

### Styles

New block in `document-shell.component.scss` paired with `.action-buttons`:

```scss
.viewer-toggle {
  display: inline-flex;
  gap: 2px;
  background: var(--color-bg-inset);
  border-radius: var(--radius-full);
  padding: 2px;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: background var(--duration-fast) var(--easing-default),
                color      var(--duration-fast) var(--easing-default);

    &:hover { color: var(--color-text-secondary); }
    &--active {
      background: var(--color-bg-page);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-xs);
    }
    &:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    @media (max-width: 767px) {
      span { display: none; }  // icon-only on mobile
    }
  }
}
```

Keyboard: native `<button>` focus/space/enter. `aria-pressed` communicates state. `role="group"` groups the two buttons for screen readers.

---

## Zero-margin bleed

Add a single modifier class:

```scss
.wiki-content--bleed {
  padding: 0;
  // Source view keeps normal padding because code needs breathing room;
  // this class is only applied when viewerMode === 'preview' && hasDualView.
}
```

Template binding: `<div class="wiki-content wide" [class.wiki-content--bleed]="viewerMode() === 'preview' && hasDualView()">`.

`HtmlPreviewComponent`'s `:host` is `display: block; padding: 0; margin: 0; min-height: 100%` so the shadow root host fills the content area flush. SVG preview mode uses a simple full-bleed `<img>`:

```scss
// in file-preview.component.scss
.svg-bleed {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

The mobile padding override (`document-shell.component.scss:327`) already uses `var(--space-4)`; the `--bleed` modifier overrides it on all breakpoints.

---

## `file-types.ts` changes

```ts
export type PreviewKind =
  | 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'svg' | 'html';  // + html

const HTML_EXTENSIONS = new Set(['html', 'htm']);

export function previewKindFor(extension: string): PreviewKind | null {
  const ext = extension.toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (PDF_EXTENSIONS.has(ext))   return 'pdf';
  if (ext === 'svg')             return 'svg';
  if (HTML_EXTENSIONS.has(ext))  return 'html';
  return null;
}

// New: which kinds can toggle between preview and source.
const DUAL_VIEW_KINDS: ReadonlySet<PreviewKind> = new Set(['html', 'svg']);

export function hasDualViewFor(extension: string): boolean {
  const kind = previewKindFor(extension.toLowerCase());
  return kind !== null && DUAL_VIEW_KINDS.has(kind);
}
```

The `DUAL_VIEW_KINDS` set is the single point of extension for adding markdown, json, csv, mermaid, etc. later.

---

## `DocumentShellComponent` changes

1. **Convert `extension` to a signal.** The existing `extension: string` field becomes `readonly extension = signal<string>('')`. Every current read site (`this.extension`) becomes `this.extension()`. This is a small mechanical change and is required so `hasDualView` can be a `computed`.

2. **Add new signals:**
   ```ts
   readonly viewerMode = signal<'preview' | 'source'>('preview');
   readonly hasDualView = computed(() => hasDualViewFor(this.extension()));
   ```

3. **Add a new `sourceText` field** separate from `markdown`:
   ```ts
   sourceText: string | null = null;  // raw unfenced source for dual-view kinds
   // markdown stays reserved for actual .md content
   ```
   The `.md` path keeps writing to `this.markdown`. The non-md path (html, svg, other text) writes raw content to `this.sourceText`. The child `FilePreviewComponent` wraps it into a code fence on demand for source mode, so the wrapper string is no longer built inside `DocumentShellComponent`.

4. **Reset `viewerMode` and `sourceText` to defaults** inside the route subscription, alongside the other per-navigation resets (around `document-shell.component.ts:80`).

5. **Update `loadFileWithExtension`:**
   - For `kind === 'html'`: set `this.fileType = 'html'`, fetch raw source via `documentService.getFileContent(filePath, extension)`, store into `this.sourceText`. Do not set `mediaUrl`.
   - For `kind === 'svg'`: no change in data fetching, but store the raw text into `this.sourceText` (today it goes into `this.markdown` as a fenced code block — that string-building logic moves to the child).
   - For `kind === 'text'` / markdown: unchanged; continues to populate `this.markdown`.

6. **Add `setViewerMode(mode)` method** that sets the signal.

7. **Template:** replace the `@switch (fileType)` block in `.wiki-content` with a single `<app-file-preview>` instance, passing `extension()`, `viewerMode()`, `sourceText`, `markdown`, `mediaUrl`, and `currentPath`. Add the segmented control in the `.action-buttons` row.

---

## Extracted utility

`frontend/src/app/core/utils/resolve-content-url.ts`:

```ts
/**
 * Resolve a relative path inside a document against the current document's
 * directory. Pure function — no Angular dependency. Produces a normalized
 * path string WITHOUT the /_content/ prefix (callers add that if needed,
 * because asset URLs and route URLs differ in prefix).
 *
 * Fails closed on attempted traversal past the docs root: returns `null`
 * so callers can either drop the URL or fall back to a visible error.
 */
export function resolveRelative(
  dirSegments: readonly string[],
  rawPath: string,
): string | null {
  const combined = [...dirSegments, ...rawPath.split('/')];
  const normalized: string[] = [];
  for (const seg of combined) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (normalized.length === 0) return null;  // fail closed on traversal
      normalized.pop();
      continue;
    }
    normalized.push(seg);
  }
  return normalized.join('/');
}
```

`DlNodeComponent.resolveRelativeToDoc` (`dl-node.component.ts:106`) becomes a one-line call into this, with the existing fallback behavior preserved when `null` is returned. `HtmlPreviewComponent`'s `rewriteUserHtml` drops attributes whose rewritten URL is `null`, so a malicious `<img src="../../../../etc/passwd">` becomes `<img>` instead of a broken path that the server then has to reject.

---

## Docs updates

The plan touches enough public surface that five existing doc pages will be stale the moment it ships. Every one of them must be updated as part of the same change, not as a follow-up. A few of these pages have `<!-- AUTO-GENERATED -->` blocks; those blocks are regenerated from source code, so updating the source (e.g. `PreviewKind`, `previewKindFor`, `FILETYPE_ICONS`) and re-running the doc generator is enough — don't hand-edit between the markers.

1. **`docs/reference/file-types.md`** — the Mermaid diagram and the preview-kind table today show `svg → <img> + adjacent md-node`. That dual-render behavior is going away. HTML is not listed at all today. The regenerated table needs:
   - `html → FilePreviewComponent (Shadow DOM preview / code fence source)`
   - `svg → FilePreviewComponent (<img> preview / code fence source)` — no more "simultaneous visual + source view"
   Since the table is auto-generated from `PreviewKind` + `previewKindFor`, the source edit in §`file-types.ts` changes takes care of this; just re-run the doc generator after merging.
2. **`docs/architecture/security.md:175–183`** — this page enumerates every `bypassSecurityTrust*` site in grove. Add a new entry for `HtmlPreviewComponent` with its own rationale (not a reuse of the KaTeX/Mermaid boilerplate): *"Input sanitized by DOMPurify in the same function. `FORBID_TAGS` drops `<script>`, `<iframe>`, `<object>`, `<embed>`, `<link>`; default `FORBID_ATTR` drops all `on*` handlers; default `ALLOWED_URI_REGEXP` drops `javascript:` / `vbscript:` / unsafe `data:`. Shadow DOM is for style isolation only."*
3. **`docs/architecture/frontend.md`** — add a short section on the `FilePreviewComponent` dispatcher pattern and the `DUAL_VIEW_KINDS` extension point (the main architectural concept this change introduces). Cross-link to the security doc for the sanitization rationale.
4. **`docs/architecture/wiki-mode.md`** — add a one-paragraph note: "HTML preview behaves identically in server and wiki modes. Sanitization runs client-side via DOMPurify, which has no server dependency, so the wiki-bundle static deploy enjoys the same guarantees as the live-server path."
5. **`docs/usage.md` and `docs/how-it-works.md`** — user-facing pages. Mention the preview/source toggle in the navbar, which file kinds have dual view, and that HTML is rendered with the current theme.

No new doc page is required — the existing information architecture covers the feature.

## Critical files

Modify:

- `frontend/package.json` — add `dompurify` (`^3.x`) and `@types/dompurify` (`^3.x`) dependencies.
- `frontend/src/app/core/constants/file-types.ts` — add `html` kind and `hasDualViewFor`; `DUAL_VIEW_KINDS` export.
- `frontend/src/app/features/document-shell/document-shell.component.ts` — `extension` becomes a signal, new `viewerMode` / `hasDualView` / `sourceText`, delegation to `<app-file-preview>`.
- `frontend/src/app/features/document-shell/document-shell.component.html` — navbar toggle, `<app-file-preview>` in content.
- `frontend/src/app/features/document-shell/document-shell.component.scss` — `.viewer-toggle`, `.wiki-content--bleed`.
- `frontend/src/app/shared/doclang/dl-node.component.ts` (`:106`) — switch to the extracted util, handle `null` return from traversal-fail-closed.
- Regenerate docs via the existing update-docs pipeline so `docs/reference/file-types.md` picks up the new kind automatically.
- `docs/architecture/security.md`, `docs/architecture/frontend.md`, `docs/architecture/wiki-mode.md`, `docs/usage.md`, `docs/how-it-works.md` — hand-edits per §Docs updates.

Create:

- `frontend/src/app/shared/file-preview/file-preview.component.{ts,html,scss}` (spec files deferred until test infra exists)
- `frontend/src/app/shared/file-preview/html-preview.component.{ts,html,scss}`
- `frontend/src/app/shared/file-preview/sanitize-user-html.ts`
- `frontend/src/app/shared/file-preview/rewrite-user-html.ts`
- `frontend/src/app/core/utils/resolve-content-url.ts`
- `docs/test-fixtures/html-preview.html` — the manual-smoke-test fixture, including the three hostile XSS probe lines.
- `design-html-viewer.md` at the repo root (copy of this document, minus the plan-workflow framing) — the artifact the user explicitly asked for.

---

## What else could benefit from this architecture

Once `FilePreviewComponent` + `DUAL_VIEW_KINDS` exist, every new file kind is a <50 line change. Concrete candidates, ordered by payoff:

1. **Markdown source view.** `.md` already renders as preview today (the whole point of grove). Adding a "view source" toggle lets users copy/inspect the raw markdown without leaving grove. Tiny change: add `md` to `DUAL_VIEW_KINDS`, pass raw source to `FilePreviewComponent`'s source branch. Biggest UX win for the smallest lift.
2. **Mermaid** (`.mmd`). Grove already has `mermaid.service.ts`. Preview = rendered diagram, source = fenced text. Would reuse the existing service.
3. **JSON tree** (`.json`). Preview = expandable tree (collapsible keys, syntax-highlighted values), source = raw. Needs a small tree component but no new dependencies.
4. **CSV / TSV table** (`.csv`, `.tsv`). Preview = native HTML `<table>` with sticky header, source = raw. Also a small component, no deps.
5. **GraphViz** (`.dot`, `.gv`) via viz.js WASM. Preview = SVG, source = dot.
6. **PlantUML** (`.puml`). Needs a server-side renderer or the public plantuml.com service (adds network trust).
7. **Jupyter notebook** (`.ipynb`). Preview = rendered cells (code blocks, markdown, outputs), source = raw JSON. Largest lift of the set.
8. **YAML / TOML** (`.yml`, `.yaml`, `.toml`). Preview = structured collapsible view, source = raw.
9. **XML** (`.xml`). Preview = DOM tree browser, source = syntax-highlighted.
10. **GeoJSON** (`.geojson`). Preview = Leaflet map, source = JSON. Adds a map dep.
11. **OpenAPI** (`.openapi.yaml`, `swagger.json`). Preview = Swagger UI iframe, source = yaml/json. Fits naturally because Swagger UI is happiest inside an iframe.

## Related cross-cutting features to consider (future, not v1)

- **Copy source** button that appears when `mode === 'source'` (clipboard API, one line).
- **Keyboard shortcut** (`⌘E` / `Ctrl+E`) to flip `viewerMode`, registered on the host.
- **URL deep-link** via `?view=source` query param — `viewerMode` is already a signal, wiring is trivial when wanted.
- **Sticky per-extension preference** via a small `ViewerPreferenceService` writing to `localStorage` (analog of `ThemeService`). Not in v1 because the user explicitly likes "no hidden state".
- **Open raw in new tab** — link to `/_content/<path>` so the raw file opens in a browser tab.
- **Download** button.
- **Split view** (preview + source side by side) — possible once the component is in place, purely a `FilePreviewComponent` layout variant.
- **Word-wrap toggle** in source mode.

---

## Resolved decisions

Items left open in the original draft, all now decided:

1. **Toggle placement in `.action-buttons`.** → After the existing terminal/zed/claude/edit buttons, separated by a small gap, so the file-specific control is visually distinct from the always-available actions.
2. **`sourceText` vs reusing `markdown` field.** → New `sourceText: string | null` field. `markdown` stays reserved for actual markdown. See §`DocumentShellComponent` changes.
3. **Refactor `DlNodeComponent.resolveRelativeToDoc` immediately.** → Yes, same change. The extracted util lives in `frontend/src/app/core/utils/resolve-content-url.ts` and returns `string | null` (traversal-fail-closed).
4. **`extension` field → signal?** → Yes, convert. Required for `hasDualView` to be a `computed`.
5. **Trust model and sanitization approach.** → DOMPurify is the sanitizer; Shadow DOM is style-only. See §Trust model and §Isolation strategy.

## Open decisions that still need user input

1. **Test-runner strategy (PLN-01).** Recommendation: ship v1 with manual smoke tests, file a follow-up to introduce Vitest, port the "future unit tests" list at that time. Alternative: introduce Jasmine+Karma in this same change via `ng generate @schematics/angular:application` — bigger blast radius, delays the feature.
2. **`<style>` block strictness.** Recommendation: allow (as planned). Alternative: strip `<style>` entirely and force authors to rely on grove's theme variables only.
3. **External `<img>` hosts.** Recommendation: allow `http(s)` hosts so authors can embed diagrams.io / shields.io / etc. Alternative: restrict to same-origin + relative only.

---

## Verification plan

### Test-infra reality check

At time of writing, grove has **zero unit-test infrastructure**: no jasmine, karma, jest, vitest, or playwright in `frontend/package.json` or the repo root; no `.spec.ts` files outside `node_modules/`; no `test` npm script. The original draft of this plan listed Karma + Jasmine specs — those cannot run today.

v1 of this feature therefore ships with **manual smoke tests only**. Standing up a test runner is tracked as a separate follow-up (see §Follow-ups below); once it exists, the specs listed under "Future unit tests" below move into `.spec.ts` files next to their subjects.

### Manual smoke tests (must all pass before merge)

Prepare a fixture file `docs/test-fixtures/html-preview.html` containing:

- `<h1>`, `<p>`, a `<style>` block with custom rules
- A relative `<img src="./diagram.png">`
- A relative `<a href="./notes.md">`
- An external `<a href="https://example.com">`
- A **hostile probe line** — `<img src=x onerror="window.__XSS_CANARY=true">` — so that after the preview renders, `window.__XSS_CANARY` must still be `undefined`. This is the one test that is genuinely load-bearing for the sanitization claim.
- A second hostile probe — `<a href="javascript:window.__XSS_CANARY2=true">link</a>` — clicked during the smoke test, followed by a console check.
- A third hostile probe — `<iframe src="./notes.md"></iframe>` — must not appear in the rendered DOM at all.

Manual steps:

1. Navigate to the fixture. Renders with grove's background, font, and link color. Inner `<style>` block styles inner elements. Relative image loads. Clicking the internal link routes via Angular router. Clicking the external link opens normally.
2. Open DevTools console. Verify `window.__XSS_CANARY === undefined`. Click the `javascript:` link. Verify `window.__XSS_CANARY2 === undefined`. Inspect the shadow root and confirm `<iframe>` is absent.
3. Toggle to Source → see syntax-highlighted HTML (including the hostile probes as plain code). Toggle back → instant return to preview (no re-fetch).
4. Flip palette Grove ↔ Classic Blue in preview → colors update live. Flip light ↔ dark → same. Confirms Shadow DOM token inheritance.
5. Open a `.svg` → shows image only (not stacked code). Toggle to Source → code fence. Confirms the svg regression fix.
6. Open a `.html` on mobile → segmented control collapses to icons only, content bleeds edge-to-edge.
7. Print preview in Chrome and Firefox. Chrome must render the shadow content; Firefox may gap — documented workaround is "toggle to Source before printing".
8. Open a non-dual-view file (`.png`) → toggle is NOT shown in the navbar.
9. Hostile traversal probe — fixture containing `<img src="../../../../etc/passwd">`. After preview, the `<img>` either has no `src` attribute (dropped by `resolveRelative`-fail-closed) or points to a path inside the docs root. It must NOT produce a URL that escapes the docs root.

### Future unit tests (add once a runner exists)

Carry-over from the original plan, pending a test-infra follow-up:

- `resolve-content-url.spec.ts` — happy path, `.`, `..`, double `..`, traversal-past-root → `null`, empty segments.
- `sanitize-user-html.spec.ts` — `<script>` removed; `onerror` attribute removed; `javascript:` URL removed; `<iframe>`, `<object>`, `<embed>`, `<link>` removed; `<style>` preserved.
- `file-preview.component.spec.ts` — for each `(kind, mode)` combo, asserts the correct child is instantiated.
- `html-preview.component.spec.ts` —
  - Shadow root exists on the host element.
  - User HTML appears inside the shadow root, not in light DOM.
  - `<img src="./pic.png">` is rewritten to `/_content/<base>/pic.png`.
  - `<a href="./other.md">` click is intercepted and calls `Router.navigateByUrl`.
  - `<a href="https://external.com">` click is NOT intercepted.
  - `<a href="javascript:void(0)">` click is intercepted and refused.
  - Computed style of a shadow-rooted element reflects grove's `--color-text-primary` (proves CSS custom property inheritance).
- `document-shell.component.spec.ts` — `viewerMode` resets on every new file URL; `hasDualView` computes correctly for `html`, `svg`, `md`, random binary.

### Build / type / lint gates

`npm run build` must stay green after the change (both `build:frontend` and `build:server`). `npm run build:wiki` must also succeed — wiki-mode has no server, so the sanitizer and renderer must work in a pure static bundle. DOMPurify is a client-side library and has no server dependency; this is expected to Just Work but is part of the smoke checklist.

`DomSanitizer.bypassSecurityTrustHtml` usage is isolated to `HtmlPreviewComponent` with a prominent code comment stating: **"The explicit sanitizer required to justify this call is `sanitizeUserHtml` (DOMPurify) earlier in the same function. Shadow DOM provides only style isolation. Removing the sanitizer reopens every XSS path."** This is the single load-bearing invariant of the whole feature.

## Follow-ups (post-v1)

- **Stand up a test runner.** Recommendation: Vitest — lighter than Karma, better DX in Angular 19, runs the same ESM path as the production build. Port the "future unit tests" list above once it exists.
- **Firefox Shadow DOM print.** Investigate a light-DOM clone during `beforeprint` if the Source-mode workaround proves too awkward.
- **Copy-source button**, **`⌘E` shortcut**, **deep-link `?view=source`** — see the "Related cross-cutting features" section below.
- **Sticky per-extension preference** — intentionally skipped for v1 per "no hidden state" preference.
