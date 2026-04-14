# Grove style guide

**The visual and structural design system that Grove uses to render wiki content and chrome.** This document is the narrative reference — it explains *why* the system looks the way it does, what every element is called, and how the pieces fit together. For the concrete metric tables (every hex value, every rem, every pixel) see the two companion docs:

- [Color schemes](./color-schemes.md) — primitive palettes, semantic tokens, all four theme × mode configurations, print overrides, and the full highlight.js map.
- [Spacing, type, motion](./spacing.md) — the spacing, radius, typography, shadow, and motion scales.

Grove is a single-page Angular application, so everything rendered inside it — from markdown body copy to the file browser shell — is governed by the same stylesheet. The design goals are unchanged from the project's origin:

1. **Semantic tokens, not hex values.** Components reference `--color-bg-surface`, never `#ffffff`. Theming works by reassigning tokens, not by editing components.
2. **Dark mode as a first-class mode**, not a grudging afterthought. Every color pairing passes WCAG AA contrast in both directions.
3. **Multiple themes** through the `[data-theme]` × `[data-mode]` attribute pair — currently Grove (Emerald + Stone) and Classic Blue (Blue + Slate).
4. **Readable prose over decoration.** 16px base, 65ch measure, generous vertical rhythm, semibold (600) headings.
5. **Print that actually prints.** Dark mode collapses to dark ink on white paper; app chrome disappears; code blocks wrap instead of clipping.
6. **Accessibility baked in**, not bolted on: `:focus-visible` everywhere, `prefers-reduced-motion`, semantic landmarks, 2px minimum focus rings.

---

## Stylesheet architecture

Every rule in Grove lives under `frontend/src/`. The entry point is `styles.scss`, which imports the layers in a strict order:

```scss
@use "./styles/tokens";             // 1. primitive tokens
@use "./styles/themes/classic-blue"; // 2. theme: Classic Blue (legacy)
@use "./styles/themes/grove";        // 3. theme: Grove (default)
@use "./styles/base";                // 4. resets, focus, scrollbar, print
@use "./styles/components";          // 5. global utilities
```

The order matters. Primitives must exist before themes can reference them; themes must exist before base and component rules can consume the semantic aliases.

**Three tiers, no shortcuts:**

- **Primitive tokens** (`styles/_tokens.scss`) — raw palette values, spacing steps, radius, shadow, motion, typography. Global on `:root`, palette-agnostic, never referenced directly from component CSS.
- **Semantic tokens** (`styles/themes/_grove.scss`, `styles/themes/_classic-blue.scss`) — meaningful names like `--color-bg-surface`, `--color-text-primary`, `--color-border-default` that map primitives into roles. Scoped to `[data-theme][data-mode]` selectors.
- **Components** — everything else. Component CSS only reads semantic tokens. When you write `background: var(--color-bg-surface)` in a component, that single rule works across all four theme × mode combinations for free.

Component rules live in two places:

- **Global utilities** — `styles/_base.scss` (resets, focus, scrollbar, reduced motion, print) and `styles/_components.scss` (`.wiki-content`, `.surface-card`, `.empty-state`, `.scrollable`).
- **Component-scoped partials** — `app/shared/doclang/dl-node/_blocks.scss`, `_inline.scss`, `_code.scss`, `_mermaid.scss` (the markdown renderer), plus per-component `.scss` files under `app/features/` and `app/shared/`.

The doclang partials all load through `dl-node.component.scss` via `@use`, so they inherit the component's view encapsulation. That's why class names inside the markdown body use the `dl-` prefix (`.dl-code`, `.dl-bold`, `.dl-link-screen`, `.dl-fs-xl`) — they can't collide with anything outside the doclang renderer.

---

## The theming contract

Grove's HTML root carries two attributes that together select a theme:

```html
<html data-theme="grove" data-mode="light">
```

| Attribute   | Values                        | Role                        |
| ----------- | ----------------------------- | --------------------------- |
| `data-theme` | `grove`, `classic-blue`       | Palette (hues + neutrals)   |
| `data-mode`  | `light`, `dark`               | Brightness inversion        |

The theme stylesheets define their semantic tokens under compound selectors:

```scss
[data-theme="grove"][data-mode="light"] { /* … */ }
[data-theme="grove"][data-mode="dark"]  { /* … */ }
```

Switching is instant — the theme-switcher component writes both attributes into `document.documentElement` and every color in the viewport updates in the next repaint, without any component CSS change. That's the payoff of pure token reassignment.

`_tokens.scss` also exports two legacy aliases:

```scss
--color-text: var(--color-text-primary);
--color-text-tertiary: var(--color-text-muted);
```

These forward stale references from older code. In new code, always prefer the canonical semantic names — the aliases exist only to keep pre-rebrand stylesheets compiling.

**The rule for component CSS is strict: reference semantic tokens, never primitives, never hex values.** Writing `color: var(--slate-500)` in a component ties it to the Classic Blue theme and breaks Grove; writing `color: #64748b` breaks both themes and dark mode simultaneously. If you need a shade that doesn't exist as a semantic token, add one to both themes instead of inlining a primitive.

---

## Typography

### Font stacks

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans',
             Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
--font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
             'Liberation Mono', monospace;
```

The sans-serif stack is GitHub Primer's production stack — battle-tested across every platform Grove is likely to run on. Monospace leads with `ui-monospace` so the OS picks the best platform-native option.

### Body copy

```css
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);   /* 1rem / 16px */
  line-height: var(--line-height-normal); /* 1.6 */
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}

.wiki-content > * { max-width: 65ch; margin: 0 auto; }
.wiki-content.wide > * { max-width: 100ch; }
```

**16px is the base, always.** Tables, code blocks, callouts, and lists can shrink text locally (code blocks drop to 85%, for example), but the body copy baseline is non-negotiable. The 65ch measure puts line length in the 45–75ch sweet spot recommended for long-form reading, and `wide` mode opens it up to 100ch for reference pages that need wider tables.

### Headings

All six heading levels share the same base:

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-sans);
  font-weight: var(--font-weight-semibold); /* 600 */
  color: var(--color-text-heading);
  line-height: var(--line-height-tight);    /* 1.25 */
}
```

**Semibold (600), not bold (700).** This is a deliberate choice — semibold renders cleaner on screen at large sizes, it's the convention GitHub Primer uses, and it gives a calmer, more documentation-like tone. The larger sizes (h1, h2) get `letter-spacing: -0.025em` to optically tighten the wider glyph gaps that appear at display sizes.

Heading margins follow the 2:1 top-to-bottom ratio so that each heading visually binds to the content that follows it rather than floating between two equally-spaced blocks. H1 has zero top margin (it's the page title), h6 gets uppercase treatment with positive letter-spacing because its size is no longer big enough to carry hierarchy on its own. See [spacing.md](./spacing.md#heading-scale) for the full margin table.

H1 and H2 also get a 1px bottom border from `--color-border-default`, which acts as a page-section divider without the noise of a rule.

---

## Block elements

### Code blocks

```css
pre {
  margin: 0 0 var(--space-4) 0;
  padding: var(--space-4);               /* 16px */
  background: var(--color-bg-code-block);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);       /* 8px */
  overflow-x: auto;
  font-size: 85%;
  line-height: 1.5;
  tab-size: 2;
}
```

The 85% size is GitHub's convention — code at 13.6px (16 × 0.85) reads comfortably next to 16px body text without dominating the page. `overflow-x: auto` keeps long lines scrollable instead of wrapping mid-token.

**Language label and copy button.** Code fences that ship with a language get wrapped in a `.code-block-wrapper` that carries a header row:

```html
<div class="code-block-wrapper">
  <div class="code-block-header">
    <span class="language-label">typescript</span>
    <button class="copy-btn">Copy</button>
  </div>
  <pre><code class="hljs">…</code></pre>
</div>
```

The wrapper owns the border and radius; the inner `pre` is neutralized (`margin: 0; border: 0; border-radius: 0;`) so the two rounded corners are unbroken. The `.copy-btn` is a plain `<button>` — transparent by default, `--color-bg-hover` on hover, `--color-success-icon` on the `.copied` class after a successful clipboard write.

**Line numbers** are rendered in pure CSS via `code[data-line-numbers]::before`. The pseudo-element reads `attr(data-line-numbers)` (a newline-joined string of line numbers passed in by the template) and positions it in a 2.5em gutter with a right border. The gutter color comes from `--hljs-comment` so it stays visually recessive. At 480px and below the gutter shrinks to 1.8em to claw back horizontal space.

**Syntax highlighting** is driven by highlight.js class names (`.hljs-keyword`, `.hljs-string`, `.hljs-title.class_`, and so on). Every color lives in a `--hljs-*` CSS variable defined per theme × mode. That means re-theming the syntax colors is a find-and-replace on a single file, not a rewrite of rules. The full token map is in [color-schemes.md](./color-schemes.md#syntax-highlighting-hljs).

### Tables

```css
.table-wrapper {
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overflow-x: auto;
  margin-bottom: var(--space-4);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-variant-numeric: tabular-nums;
}
```

Tables are always wrapped. The wrapper exists for one non-negotiable reason: `border-radius` does not clip children when `border-collapse: collapse` is set, and a rounded table needs one of the two approaches to round at all. Grove picks `border-collapse: separate` + wrapper-clipping because it lets the header `background` reach the wrapper edge cleanly.

Other table rules worth knowing:

- `font-variant-numeric: tabular-nums` so columns of numbers line up.
- `thead th` is semibold, smaller than body copy (`--font-size-sm`), and uses `--color-text-secondary` to avoid competing with row content.
- `tbody tr:nth-child(even)` gets a `--color-bg-table-stripe` background for zebra striping. The light-mode stripe is a very subtle 2–3% tint; dark mode uses a 3% white overlay.
- `tbody tr:hover` uses `--color-bg-hover` so interactive tables light up under the cursor. On non-interactive content it still works — there's nothing to click, but the cursor hint is harmless.
- `tbody tr:last-child td` drops its bottom border so the last row meets the wrapper's radius cleanly.

### Blockquotes

```css
blockquote {
  margin: 0 0 var(--space-4) 0;
  padding: var(--space-3) var(--space-4);
  border-left: 4px solid var(--color-border-strong);
  background: var(--color-bg-blockquote);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: var(--color-text-secondary);
}
```

Left border + transparent background in light mode, left border + 8%-opacity emerald tint in dark mode (Grove) or 8%-opacity blue tint (Classic Blue). The border-radius is right-side only so the left edge sits flush against the accent bar. Nested blockquotes drop to `--color-border-default` to avoid stacking heavy bars.

The status color tokens (`--color-{success,warning,error,info}-bg`, `-border`, `-text`, `-icon`) are reserved for callout/admonition variants — see [color-schemes.md](./color-schemes.md#status-colors) for the full matrix. Any component that wants to render a "note" or "warning" box should consume those tokens rather than defining its own status palette.

### Lists

```css
ul, ol { margin: 0 0 var(--space-4) 0; padding-left: 2em; }
li       { margin-bottom: var(--space-1); }
ul ul, ul ol, ol ul, ol ol { padding-left: 1.5em; margin-bottom: 0; }
li::marker { color: var(--color-text-muted); }

ul { list-style-type: disc; }
ul ul { list-style-type: circle; }
ul ul ul { list-style-type: square; }
ol { list-style-type: decimal; }
ol ol { list-style-type: lower-alpha; }
ol ol ol { list-style-type: lower-roman; }
```

Nested lists shrink their indent from 2em to 1.5em so deep trees don't drift off the right edge, and the list marker cycles through shapes as depth increases (disc → circle → square for `ul`, decimal → lower-alpha → lower-roman for `ol`). Markers use `--color-text-muted` to stay quieter than the item text.

### Horizontal rules

```css
hr {
  margin: var(--space-8) 0;          /* 32px vertical */
  border: 0;
  border-top: 1px solid var(--color-border-default);
}
```

Generous 32px vertical margin so a rule actually reads as a section break, not a decorative line. Same color as heading bottom borders so the visual language is consistent.

### Images

```css
img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-sm);
}
```

Images are treated like cards: rounded, outlined, lifted. The same rule covers markdown image syntax and media previews inside the document shell. In print, images get `break-inside: avoid` so they never split across pages.

### Math (KaTeX)

```css
.math-block  { text-align: center; overflow-x: auto; margin: var(--space-4) 0; }
.math-inline { display: inline; }
```

Block-level math (`$$…$$`) centers and allows horizontal scrolling when an equation is wider than the measure. Inline math (`$…$`) just flows with surrounding text. The actual glyph rendering comes from `katex/dist/katex.min.css`, which is loaded through `angular.json` — Grove doesn't restyle KaTeX internals.

---

## Inline elements

### Inline code pill

```css
.dl-code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  padding: 0.15em 0.4em;              /* horizontal > vertical */
  background: var(--color-bg-code-inline);
  color: var(--color-text-code-inline);
  border: 1px solid var(--color-border-code-inline);
  border-radius: var(--radius-md);
  white-space: break-spaces;
  word-wrap: break-word;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
```

Inline code is a **pill**, not a background tint. Horizontal padding exceeds vertical so the shape reads as a self-contained token rather than an oversized stripe, and `box-decoration-break: clone` means the background survives line wraps — each line gets its own pill rather than a ragged continuous stripe.

The background and text color are theme-tinted (`--emerald-50`/`--emerald-800` in Grove light, `--blue-50`/`--blue-800` in Classic Blue light) so inline code picks up the accent hue. In dark mode both themes use a neutral stone/slate background with an emerald/blue text color — tinting the text instead of the background keeps dark inline code readable.

### Color swatch

```css
.color-swatch {
  display: inline-block;
  width: 0.7em;
  height: 0.7em;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-muted);
  margin-left: 0.3em;
  box-shadow: var(--shadow-xs);
}
```

When inline code contains a hex value (`` `#3b82f6` ``), the doclang renderer appends a `.color-swatch` circle showing the literal color. `em` units scale it with surrounding text, and a 1px `--color-border-muted` outline ensures it's visible against any background — including `#ffffff` inline code against a white page.

### Links

```css
a {
  color: var(--color-text-link);
  text-decoration: underline;
  text-decoration-color: var(--color-link-underline);
  text-underline-offset: 0.15em;
  transition: color var(--duration-normal) var(--easing-default),
              text-decoration-color var(--duration-normal) var(--easing-default);
}
a:hover { color: var(--color-text-link-hover); text-decoration-color: currentColor; }
a:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
```

Links use the subtle-to-full underline pattern: the rest state has a translucent underline (`--color-link-underline`, 40% opacity), and hover promotes it to `currentColor` (fully opaque). That preserves the WCAG requirement — links must be distinguishable by more than color alone — without the visual weight of a solid underline on every link in a dense paragraph.

**Headings that contain links** swap the relationship around: the link inherits the heading color, suppresses its underline, and only reveals the underline on hover. That keeps anchor-linked headings from looking like regular body links.

**Print-safe link variants.** The markdown renderer emits every link twice — once as `.dl-link-screen` using Angular's `routerLink` (SPA-safe navigation) and once as `.dl-link-print` using a plain `<a href="#slug">` (bare fragment anchor for PDF export). CSS toggles which one is visible:

```css
.dl-link-print { display: none; }

@media print {
  .dl-link-screen { display: none; }
  .dl-link-print  { display: inline; }
}
```

This is the native-first additive approach: both elements exist in the DOM, and CSS picks the right one for the medium. No JavaScript `beforeprint` handler, no dependency on Angular router internals at print time. If you need to change link behavior in the future, add or remove variants — never replace `routerLink` with manual click handlers.

### Emphasis and formatting

```css
.dl-bold         { font-weight: var(--font-weight-semibold); }
.dl-italic       { font-style: italic; }
.dl-underline    { text-decoration: underline; text-underline-offset: 0.15em; }
.dl-strikethrough { text-decoration: line-through; opacity: 0.7; }
.dl-underline.dl-strikethrough { text-decoration: underline line-through; opacity: 0.7; }

sup { font-size: 0.75em; line-height: 0; vertical-align: super; }
sub { font-size: 0.75em; line-height: 0; vertical-align: sub; }
```

Note that `.dl-bold` maps to semibold (600) rather than bold (700) — the same philosophy as headings. `line-height: 0` on superscript and subscript prevents them from disrupting the parent line's vertical rhythm (without it a `sup` would push the entire line height upward).

The combination of `.dl-underline` and `.dl-strikethrough` is handled explicitly: the combined selector sets `text-decoration: underline line-through` because CSS can't otherwise merge two separate `text-decoration` properties.

### Font size utilities

`.dl-fs-xs` through `.dl-fs-3xl` give the markdown renderer a Tailwind-style paired-size scale (size + matching line-height). These are used inside the body — for example, a `<span class="dl-fs-sm">` for a small note — and are separate from the heading scale. See [spacing.md](./spacing.md#font-size-utilities) for the table.

### Bootstrap Icons

```css
.bi {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  fill: currentColor;
  flex-shrink: 0;
}
```

Icons size to surrounding text via `1em`, pick up text color via `currentColor`, and align with the specific `-0.125em` baseline offset that Bootstrap Icons' own documentation recommends. `flex-shrink: 0` keeps them from collapsing when they sit inside a flex container with tight budget.

---

## Diagrams (Mermaid)

```css
.mermaid-diagram {
  text-align: center;
  overflow-x: auto;
  margin: 0 0 var(--space-4) 0;
  padding: var(--space-4);
}

:host-context(html[data-mode="dark"]) .mermaid-diagram ::ng-deep svg {
  filter: invert(93%) hue-rotate(180deg);
}
```

Mermaid is rendered at its default light theme and then **filter-inverted in dark mode** via `invert(93%) hue-rotate(180deg)`. This is a pragmatic compromise, not an aesthetic choice: Mermaid's own dark theme is inconsistent and hard to customize per-renderer, so Grove takes the light output and inverts it at the SVG layer. 93% (rather than 100%) keeps the whites slightly warm instead of hard-blue, and the hue-rotate preserves the relative color relationships in the diagram (green stays roughly green, red stays roughly red).

If Mermaid's upstream dark theme improves, this rule can go away and be replaced with a Mermaid theme configuration.

---

## Application chrome

Everything outside the markdown body — the file browser, breadcrumbs, sidebar, theme switcher, footer — is the "chrome". These are Angular components, each with its own `.scss` partial, but they all obey the same token rules as the markdown renderer.

### Wiki content container

Defined in `styles/_components.scss`:

```css
.wiki-content > *       { max-width: 65ch; margin: 0 auto; }
.wiki-content.wide > *  { max-width: 100ch; }
```

The max-width applies per direct child, not to the container itself, so a full-bleed `<pre>` still clips at 65ch but a `.table-wrapper` can have its own inner width. Reference pages that need more horizontal room (for example, dense tables) add `.wide` to switch to 100ch.

`.surface-card`, `.empty-state`, and `.scrollable` are utility classes for common chrome needs: a bordered card, muted-text empty state, and a simple `overflow-y: auto` wrapper.

### Document shell

`document-shell.component.scss` defines the top-level app layout:

- `.breadcrumbs` — flex row at the top of the viewport, holds the `.brand` element (Grove logo + wordmark), the breadcrumb path, and `.header-tools` (right-aligned action buttons).
- `.brand` — semibold, slight negative letter-spacing, heading color. Contains a `grove-mark` SVG logo scaled to 1.25em.
- `.action-buttons` — pill-shaped container (`border-radius: var(--radius-full)`) holding `.action-btn` icon buttons. Tight spacing, hover/focus states driven by `--color-bg-hover`.
- `.entry-list` / `.entry-row` — directory browser: when the user navigates to a folder instead of a file, Grove lists the directory contents as clickable rows. Folder icons use `--color-text-secondary`; file icons use `--color-text-link`.
- `.media-preview`, `.media-preview-audio`, `.media-preview-pdf` — the image, audio, and PDF viewers. PDFs render in an iframe with `height: 80vh` and the same border + radius as images.

### Sidebar

```scss
.wiki-file-layout {
  display: grid;
  grid-template-columns: 0 minmax(0, 1fr);
}
.wiki-file-layout.sidebar-open {
  grid-template-columns: 260px minmax(0, 1fr);
}
```

The sidebar collapses to **zero width** when closed, not `display: none`, so the grid transition animates. 260px is the convention across Docusaurus, GitLab, and Tailwind Docs — wide enough for deep file trees without crowding the content area.

- `.wiki-sidebar` — fixed-width scroll container, border-right in `--color-border-default`, `--color-bg-sidebar` background.
- `.wiki-sidebar-label` — uppercase, small, letter-spaced, muted — the section header style.
- `.wiki-sidebar-item` — nav link row with hover and active states. The active state uses `--color-bg-active-item` (a 10% tint of the focus color), `--color-text-link`, and medium font weight.
- `.wiki-sidebar-backdrop` — full-screen overlay shown on mobile when the sidebar drawer is open. Uses `--color-bg-backdrop` which is 40% black in light mode and 60% in dark mode.

**Mobile behavior** (`max-width: 767px`): the sidebar becomes a fixed-position drawer at `translateX(-100%)`, slides in to `translateX(0)` when opened, and the backdrop catches taps to close.

### Theme switcher

`theme-switcher.component.scss` defines a popover that opens from an icon button in `.header-tools`:

- `.switcher-button` — border, rounded, muted text; hover and `[aria-expanded="true"]` states share the same styling.
- `.popover` — absolutely positioned under the button, `--color-bg-elevated` background, `--shadow-lg`, `z-index: 50`.
- Inside the popover: native `<fieldset>` / `<legend>` / `<label>` elements for theme and mode radio groups. Labels are flex rows with hover backgrounds. Radio inputs set `accent-color: var(--color-border-focus)` so the check color matches the theme's focus ring.

### Attribution footer

`wiki-footer.component.scss` defines a fixed pill in the bottom-left corner:

```scss
.wiki-attribution {
  position: fixed;
  bottom: var(--space-3);
  left: var(--space-3);
  background: color-mix(in srgb, var(--color-bg-page) 70%, transparent);
  backdrop-filter: blur(6px);
  border-radius: var(--radius-full);
  z-index: 10;
}
```

`color-mix` gives the background a 70%-opacity page-color fill, and `backdrop-filter: blur(6px)` produces the glass effect. The footer is hidden on mobile (viewport too small to afford a fixed element) and hidden in print.

---

## Dark mode and theming

Dark mode is pure token reassignment. Every semantic token listed under `[data-theme="…"][data-mode="light"]` has a counterpart under `[data-theme="…"][data-mode="dark"]`, and that counterpart is the *only* thing that changes. Component CSS never branches on mode.

A few key principles the dark palettes obey:

- **Never pure black.** `--color-bg-page` is `--stone-950` (`#0c0a09`) or `--slate-900` (`#0f172a`), never `#000000`.
- **Never pure white text.** `--color-text-primary` is `--stone-200` or `--slate-200`, slightly softened off-white.
- **Primary color shifts lighter.** `--color-text-link` drops from emerald-700 to emerald-400 — darker shades don't have enough contrast against a dark background to read.
- **Shadows get deeper.** `--shadow-sm` / `-md` / `-lg` are redefined inside each dark block with higher opacity (0.3 / 0.4 / 0.5 vs. 0.04–0.08 in light mode) because shadows are harder to perceive on dark surfaces.
- **Subtle tints are rgba, not flat colors.** Blockquote backgrounds, table stripes, and active-item highlights all use `rgba(…)` overlays so they pick up whatever dark surface sits under them.

For the full token-by-token matrix see [color-schemes.md](./color-schemes.md).

---

## Print support

Print is a genuine target, not an afterthought. Two layers of rules cooperate:

**Layer 1 — force light in `_base.scss`.** Inside `@media print`, `html[data-mode="dark"]` reassigns every semantic token to grayscale values (`--color-bg-*` → white/near-white, `--color-text-*` → black/gray, shadows → none). A document rendered in dark mode on screen prints as dark ink on white paper, not black-on-black.

**Layer 2 — hide chrome and relax containers.** Each component's print media query hides elements that make no sense on paper and relaxes overflow:

- `document-shell.component.scss`: hides breadcrumbs, sidebar, sidebar toggle, backdrop, action buttons. Content padding switches to `0 1cm` (a print margin).
- `wiki-footer.component.scss`: hides the glassmorphic attribution pill.
- `_code.scss`: `pre` switches to `white-space: pre-wrap; word-wrap: break-word;` so lines wrap instead of clipping off the page edge. Line numbers and the copy button are hidden. Code blocks get `break-inside: avoid` so they don't split mid-block.
- `_blocks.scss`: `h1–h4` get `break-after: avoid` so headings stay with the content they introduce. Images get `break-inside: avoid`. `.table-wrapper` gets `overflow: visible` so long tables aren't clipped.
- `_inline.scss`: screen links hide, print links show (see [print-safe link variants](#links)).

The result: a browser Print → Save as PDF on any Grove page produces a clean, readable document without running a separate export pipeline.

---

## Accessibility

Grove targets **WCAG 2.1 AA** across both themes, in both modes. Several rules enforce this:

### Focus visibility

```css
*:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
*:focus:not(:focus-visible) { outline: none; }
```

`:focus-visible` rather than `:focus` means keyboard users get a 2px outline offset by 2px (WCAG 2.2 SC 2.4.13 wants at least 2px thickness and 3:1 contrast), while mouse users don't see a persistent ring around every clicked button. `--color-border-focus` is the theme's primary color (emerald-500 or blue-500 light, emerald-400 or blue-400 dark) so the ring is always visible against `--color-bg-page`.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Users who opt out of motion get instant transitions and no animations. Grove's transitions are already quiet (100–300ms) but this guarantees they disappear completely when requested.

### Scroll margin for fragment links

```css
[id] { scroll-margin-top: 1rem; }
```

Every element with an `id` leaves a 1rem breathing gap between the top of the viewport and its top edge when scrolled to via `#fragment`. Without this, anchor links land with the heading pressed against the very top of the window.

### Semantic HTML (the renderer's responsibility)

The CSS assumes the renderer emits proper landmarks — headings in hierarchical order, `<main>` around the content area, `<nav aria-label="…">` around the sidebar, `alt` text on meaningful images, `aria-hidden="true"` on decorative icons. The style guide can't enforce this at the CSS layer, but every Grove component is written with these assumptions in mind.

### rem units and user zoom

All font sizes use `rem` so users who override their browser's default font size (or zoom) get a proportional layout. The only exceptions are `px` values used for visual properties that shouldn't scale with text size (border thickness, shadow offsets, the 260px sidebar width, the 480/768px breakpoints).

---

## Responsive breakpoints

```css
@media (max-width: 768px) { /* sidebar → drawer, tighter content padding */ }
@media (max-width: 767px) { /* document-shell: mobile drawer + backdrop */ }
@media (max-width: 480px) { /* code blocks: narrower line-number gutter */ }
```

Grove has **two meaningful breakpoints**:

- **768px** — the boundary between the desktop layout (sidebar as grid column) and mobile (sidebar as drawer overlay). Content padding shrinks, action button spacing tightens.
- **480px** — extra-narrow phones where the 3.5em line-number gutter in code blocks crowds out actual code. Drops to 2.5em with a 1.8em inner gutter.

Between and below these breakpoints the layout is fluid: the 65ch content measure means prose always hits its ideal line length on any width wider than `65ch ≈ 640px`, and narrower viewports just let paragraphs fill the available space.

---

## Extending the system

### Adding a new theme

1. Copy `styles/themes/_grove.scss` to `styles/themes/_mytheme.scss`.
2. Rename both selectors: `[data-theme="grove"]` → `[data-theme="mytheme"]` in both light and dark blocks.
3. Reassign every `--color-*`, `--hljs-*`, and accent overlay (`--color-focus-ring`, `--color-link-underline`, `--color-bg-active-item`, `--color-bg-backdrop`).
4. Pick new primitive scales if needed — add them to `_tokens.scss`.
5. Import the new theme in `styles.scss` (order: after Grove is fine).
6. Teach the theme switcher component to offer the new `data-theme` value.

That's it — no component CSS changes. Every pre/table/heading/blockquote automatically picks up the new colors because they only reference semantic tokens.

### Adding a new semantic token

1. Add it under **both** themes, in **both** light and dark blocks of each.
2. If it affects printing, add a print override in the `@media print html[data-mode="dark"]` block of `_base.scss`.
3. Reference it from component CSS.

Never add a semantic token to one theme without adding it to the other — a missing token will fall through to `undefined`, not to a reasonable default.

### The rule

Component CSS references semantic tokens only. Theme files reference primitive tokens. Primitive tokens are raw values. Anything that blurs this separation makes theming and dark mode fragile.
