# Design spec — proposing a new palette

**Audience:** a designer proposing a new color scheme for Grove.
**Prerequisite knowledge:** none. This document is self-contained.
You do **not** need to read any source code to produce a complete
proposal.

**Deliverable:** a filled-in palette template (see
[§8](#8-deliverable-template)) returned to the developer who will
then wire it up using [adding-a-theme.md](./adding-a-theme.md).

---

## 1. Purpose and audience

Grove currently ships seven themes — **Grove** (emerald + stone),
**Classic Blue** (blue + slate), **Blossom** (rose + mauve),
**Saffron** (amber + sand), **Iris** (violet + zinc), **Ember**
(orange + neutral), and **Cove** (teal + sage) — each available in
light and dark mode. This spec exists so that a designer can
propose an eighth theme without touching the codebase.

You are not being asked to:

- Write CSS.
- Choose typography or spacing — those are locked, see
  [spacing.md](./spacing.md).
- Handle implementation details (file names, storage keys, boot
  scripts).

You **are** being asked to:

- Pick a primary/accent hue family and a neutral hue family.
- Decide light and dark values independently (dark mode is first
  class, not an auto-inversion).
- Confirm your values meet Grove's accessibility targets
  ([§6](#6-constraints-the-designer-must-respect)).
- Return a filled template ([§8](#8-deliverable-template)).

---

## 2. How Grove's theming model works (conceptual)

Grove has exactly two theming axes:

| Axis | Values | Notes |
|---|---|---|
| **Palette** | Grove, Classic Blue, Blossom, Saffron, Iris, Ember, Cove, *(your proposal)* | A hue family — e.g. "emerald + stone". |
| **Mode** | light, dark | `system` is also exposed to users but resolves to light or dark at runtime. |

A **theme** is a specific palette × mode cell. Every proposal
must fill in **both** the light and the dark cell independently —
you cannot propose light only.

Components in Grove never reference hex values. They reference
**semantic tokens** like `--color-bg-page` (page background) or
`--color-text-link` (link text). A palette proposal is, at its
core, a mapping from these semantic tokens to hex values — once
per cell.

The `system` mode follows the OS `prefers-color-scheme` preference.
You don't need to design for it separately; the runtime picks
either your light or your dark values.

---

## 3. Primitive vs semantic — two layers

Grove uses two layers of color:

**Primitive scales.** Palette-agnostic, 11-shade ramps —
`<name>-50` (lightest) through `<name>-950` (darkest). Grove's
current scales:

| Scale | Used by |
|---|---|
| `emerald-50`…`emerald-950` | Grove (accent) |
| `stone-50`…`stone-950` | Grove (neutral) |
| `blue-50`…`blue-950` | Classic Blue (accent) |
| `slate-50`…`slate-950` | Classic Blue (neutral) |
| `rose-50`…`rose-950` | Blossom (accent) |
| `mauve-50`…`mauve-950` | Blossom (neutral, tinted dark cascade) |
| `amber-50`…`amber-950` | Saffron (accent) |
| `sand-50`…`sand-950` | Saffron (neutral, tinted dark cascade) |
| `violet-50`…`violet-950` | Iris (accent) |
| `zinc-50`…`zinc-950` | Iris (neutral, symmetric) |
| `orange-50`…`orange-950` | Ember (accent) |
| `neutral-50`…`neutral-950` | Ember (neutral, symmetric) |
| `teal-50`…`teal-950` | Cove (accent) |
| `sage-50`…`sage-950` | Cove (neutral, tinted dark cascade) |

**Semantic tokens.** Role-named CSS custom properties assigned
*from* primitive scales per theme × mode. Example from Grove Light:

```
--color-bg-page: var(--stone-50);
--color-text-primary: var(--stone-900);
--color-text-link: var(--emerald-700);
```

The same semantic token (`--color-text-link`) in Grove Dark
points to a different primitive (`--emerald-400`) so that the
link stays readable on a dark background.

### You have two ways to deliver a palette

**Option A — Primitive scales (recommended).** You deliver two
11-shade scales (one accent, one neutral), plus four status hues
(success/warning/error/info). The developer maps them to semantic
tokens by copying the Grove or Classic Blue structure.

**Option B — Semantic tokens (full control).** You fill in every
semantic token directly for both light and dark modes. More work
but gives you per-token control.

Most designers should pick **Option A**. Only use Option B if the
default mapping produces a result you dislike.

---

## 4. The semantic token inventory

Every semantic token Grove currently defines, grouped by function.
Each row lists:

- **Token** — the CSS custom property name.
- **Controls** — plain-English description.
- **Where seen** — a concrete UI location.

You don't have to fill in every token directly if you use
**Option A** — just deliver the primitive scales. This inventory
still tells you **what semantic roles your scales need to cover**,
which matters for picking shades at the ends of the ramp.

### 4.1 Backgrounds

| Token | Controls | Where seen |
|---|---|---|
| `--color-bg-page` | Top-level page background, behind everything. | The area outside the sidebar and article card. |
| `--color-bg-surface` | Raised surface — cards, popovers, the article body. | The article card itself; the theme-switcher popover. |
| `--color-bg-inset` | Recessed background — code blocks, inputs. | The fill color of a code block. |
| `--color-bg-elevated` | Higher-than-surface layer — menus, dialogs. | The theme switcher's floating menu. |
| `--color-bg-emphasis` | Strong accent fill — primary buttons, active highlights. | The "active" state of a selected button. |
| `--color-bg-code-block` | Fenced code block background. | `\`\`\`ts …\`\`\`` blocks. |
| `--color-bg-code-inline` | Inline code background. | `` `like this` `` inside prose. |
| `--color-bg-table-header` | Table header row background. | The top row of any markdown table. |
| `--color-bg-table-stripe` | Zebra-striping for table body rows. | Alternating rows in tables. |
| `--color-bg-blockquote` | Blockquote fill. | `> quoted` markdown blocks. |
| `--color-bg-hover` | Hover overlay (usually semi-transparent). | Hovered sidebar links. |
| `--color-bg-sidebar` | Sidebar column background. | The left nav panel. |

### 4.2 Text

| Token | Controls | Where seen |
|---|---|---|
| `--color-text-primary` | Default body text. | All prose paragraphs. |
| `--color-text-secondary` | Quiet prose — captions, metadata. | Breadcrumbs, file dates. |
| `--color-text-muted` | Even quieter — placeholder, hint. | Empty-state copy. |
| `--color-text-heading` | Heading text (h1–h6). | Article headings. |
| `--color-text-on-emphasis` | Text on top of `--color-bg-emphasis`. | Label inside a filled primary button. |
| `--color-text-link` | Hyperlink text. | `[links](…)` in prose. |
| `--color-text-link-hover` | Hovered hyperlink text. | Links under the cursor. |
| `--color-text-code` | Text inside a fenced code block (base). | Non-highlighted code. |
| `--color-text-code-inline` | Text inside inline code. | `` `variable` `` text. |

### 4.3 Borders

| Token | Controls | Where seen |
|---|---|---|
| `--color-border-default` | Standard border. | Table cell borders, card edges. |
| `--color-border-strong` | Heavier border for emphasis. | The outer edge of code blocks. |
| `--color-border-muted` | Barely-there divider. | Subtle row separators. |
| `--color-border-focus` | Keyboard-focus outline color. | The ring around a focused link or button. |
| `--color-border-code-inline` | 1px outline on inline code. | Border of `` `code` ``. |

### 4.4 Status — 4 hues × 4 roles = 16 tokens

For each of `success`, `warning`, `error`, `info`:

| Role | Token | Controls |
|---|---|---|
| Background | `--color-<status>-bg` | Fill of a callout box. |
| Border | `--color-<status>-border` | Edge of the callout. |
| Text | `--color-<status>-text` | Text inside the callout. |
| Icon | `--color-<status>-icon` | Leading icon color. |

These appear in note/warning/error/info admonition boxes in
rendered markdown.

### 4.5 Accent overlays

| Token | Controls | Where seen |
|---|---|---|
| `--color-focus-ring` | Soft outer glow around focused elements. | Usually a ~20% alpha of the accent hue. |
| `--color-link-underline` | Underline color for hyperlinks. | Often a lighter shade of `--color-text-link`. |
| `--color-bg-active-item` | Fill for the currently-selected sidebar item. | A tinted highlight that says "you are here". |
| `--color-bg-backdrop` | Full-screen modal overlay. | The dimmed layer behind dialogs. |

### 4.6 Syntax highlighting (highlight.js)

Grove re-themes highlight.js per theme × mode. **You do not need
to hand-pick every single one** — a developer can derive defaults
from your accent + neutral scales. But if you care about how code
looks, you can override these directly:

| Token | Highlights |
|---|---|
| `--hljs-base-text` | Default code color (fallback). |
| `--hljs-base-bg` | Base code-block background (usually matches `--color-bg-code-block`). |
| `--hljs-keyword` | Language keywords (`if`, `for`, `return`). |
| `--hljs-title` | Function and class names. |
| `--hljs-title-class` | Class names specifically. |
| `--hljs-title-function` | Function names specifically. |
| `--hljs-string` | String literals. |
| `--hljs-number` | Numeric literals. |
| `--hljs-literal` | `true`, `false`, `null`, `undefined`. |
| `--hljs-regexp` | Regular expression literals. |
| `--hljs-type` | Type annotations. |
| `--hljs-built-in` | Built-in identifiers. |
| `--hljs-class` | Class references in prose (rarely used). |
| `--hljs-attr` | HTML/JSX attribute names. |
| `--hljs-variable` | Variable references. |
| `--hljs-property` | Object property names. |
| `--hljs-params` | Function parameters. |
| `--hljs-tag` | HTML tag names. |
| `--hljs-name` | Markup element names. |
| `--hljs-comment` | Comments — must remain readable on code-block background. |
| `--hljs-punctuation` | Brackets, semicolons, commas. |
| `--hljs-operator` | `+`, `-`, `=>`, etc. |
| `--hljs-meta` | Preprocessor directives, decorators. |

### 4.7 Shadows (dark mode only override)

Dark mode deepens the shadow values (`--shadow-sm`, `--shadow-md`,
`--shadow-lg`) because default shadows are invisible on dark
surfaces. If you propose a dark mode, the developer will copy
Grove's dark shadow override — you don't need to pick these.

---

## 5. Reference values from existing themes

Use these as concrete anchors. For the complete table of every
token for every theme × mode, see
[color-schemes.md](./color-schemes.md).

### 5.1 Grove — emerald + stone

| Token | Light | Dark |
|---|---|---|
| `--color-bg-page` | `#fafaf9` (stone-50) | `#0c0a09` (stone-950) |
| `--color-bg-surface` | `#ffffff` | `#292524` (stone-800) |
| `--color-bg-sidebar` | `#fafaf9` (stone-50) | `#1c1917` (stone-900) |
| `--color-text-primary` | `#1c1917` (stone-900) | `#e7e5e4` (stone-200) |
| `--color-text-heading` | `#292524` (stone-800) | `#f5f5f4` (stone-100) |
| `--color-text-link` | `#047857` (emerald-700) | `#34d399` (emerald-400) |
| `--color-border-focus` | `#10b981` (emerald-500) | `#34d399` (emerald-400) |
| `--color-success-text` | `#065f46` | `#6ee7b7` |
| `--color-error-text` | `#991b1b` | `#fca5a5` |

### 5.2 Classic Blue — blue + slate

| Token | Light | Dark |
|---|---|---|
| `--color-bg-page` | `#f8fafc` (slate-50) | `#0f172a` |
| `--color-bg-surface` | `#ffffff` | `#1e293b` (slate-800) |
| `--color-bg-sidebar` | `#f8fafc` (slate-50) | `#0f172a` (slate-900) |
| `--color-text-primary` | `#0f172a` (slate-900) | `#e2e8f0` (slate-200) |
| `--color-text-heading` | `#1e293b` (slate-800) | `#f1f5f9` (slate-100) |
| `--color-text-link` | `#2563eb` (blue-600) | `#60a5fa` (blue-400) |
| `--color-border-focus` | `#3b82f6` (blue-500) | `#60a5fa` (blue-400) |

Notice:

- **Page backgrounds are very light or very dark**, never
  mid-range — we need maximum contrast against body text.
- **Surfaces are "flatter"** — white in light, mid-dark in dark,
  so cards feel raised but not stark.
- **Link color shifts from 600/700 in light to 300/400 in dark** —
  dark mode needs lighter accents to stay readable.
- **Heading color is very close to, but not equal to, body text** —
  slight weight change for hierarchy without harshness.

---

## 6. Constraints the designer must respect

These are hard requirements. A proposal that fails any of them
won't ship.

### 6.1 Accessibility (WCAG 2.1 AA, AAA for body)

| Pair | Minimum |
|---|---|
| `--color-text-primary` on `--color-bg-page` | **7:1** (AAA body) |
| `--color-text-primary` on `--color-bg-surface` | **7:1** (AAA body) |
| `--color-text-secondary` on `--color-bg-surface` | 4.5:1 (AA body) |
| `--color-text-heading` on `--color-bg-page` | 4.5:1 (AA large) |
| `--color-text-link` on `--color-bg-page` | 4.5:1 |
| `--color-text-on-emphasis` on `--color-bg-emphasis` | 4.5:1 |
| `--color-border-focus` on `--color-bg-page` | 3:1 (non-text UI) |
| `--color-border-focus` on `--color-bg-surface` | 3:1 |
| `--hljs-comment` on `--color-bg-code-block` | 4.5:1 |
| `--color-<status>-text` on `--color-<status>-bg` | 4.5:1 (each status) |

Verify with a contrast checker (WebAIM, Stark, Figma plugins) on
**both** light and dark cells. Check every row above for each.

### 6.2 Dark mode is first class

Do **not** auto-invert light to dark. Pick each dark value
independently. Reasons:

- Pure inverts produce washed-out results — primitive `950` is
  not the same brightness as `50` flipped.
- Semantic token assignments differ per mode (e.g. Grove Light
  uses `emerald-700` for links, but Grove Dark uses `emerald-400`).

### 6.3 Focus rings must be visible

`--color-border-focus` must be ≥ 3:1 against **both**
`--color-bg-page` and `--color-bg-surface`. A focus ring invisible
on one of those surfaces is a keyboard-user regression.

### 6.4 Status colors must be distinguishable

All four status hues (success/warning/error/info) must be:

- Distinguishable from each other to users with deuteranopia and
  protanopia (check with a colorblind simulator).
- Distinguishable from `--color-text-primary` so that a colored
  callout is obviously "status-colored".

It's fine (and common) to reuse Grove's status hues — they're
tuned and tested. Only change them if your theme has a strong
reason to.

### 6.5 Print mode reuses your light palette

Grove's print stylesheet coerces dark mode to light for printing,
but extreme saturation still prints badly. Avoid neons. If your
light-mode background is pure white and your text is pure black,
print is fine. Anything toward mid-saturation should be
paper-checked.

### 6.6 You cannot add new token names

You fill in values for the fixed set of tokens listed in
[§4](#4-the-semantic-token-inventory). You cannot add a new
semantic token — that's a code change and a developer's decision.

---

## 7. Existing themes as reference — the why

Understanding why the current themes look the way they do helps
you stake out a distinctive design space.

**Grove (emerald + stone)** — warm, nature-toned. Grove is the
default. The goal was a calm, "paper-under-trees" reading
experience for long-form docs. Emerald reads as alive and organic;
stone is a warm neutral that avoids the clinical feel of pure
gray. Dark mode uses deep stone (`stone-950`) rather than pure
black to preserve the earthy palette at night. Links are
`emerald-700` in light (saturated enough to stand out, dark enough
for AAA) and `emerald-400` in dark (bright enough to glow
slightly).

**Classic Blue (blue + slate)** — cool, professional. Classic Blue
was the original palette and is preserved for users who prefer a
conventional technical-doc look. Slate neutrals are cooler than
stone; blue primary is the default "link color" of the web. The
dark mode uses `#0f172a` (a mid-dark navy) rather than slate-950
to match the blue identity.

**Blossom (rose + mauve)** — soft, romantic, editorial. Inspired
by Rosé Pine's "love" and "rose" accents and Catppuccin's
rosewater tones. Cherry-blossom rather than bubblegum. Mauve
neutrals carry a pink-purple undertone that prevents the clinical
feel of pure gray alongside rose accents. Error state uses pure
Red (not rose) so "something went wrong" stays visually distinct
from the accent.

**Saffron (amber + sand)** — warm, papery, comfortable. Kindle
sepia elevated with a richer amber-gold accent. Spiritual heir to
Gruvbox's warm-on-warm formula. Sand neutrals carry a yellow-brown
undertone that creates an "aged paper" feel for long reading
sessions. Warning state shifts to Orange (not amber) to avoid
conflation with the accent hue.

**Iris (violet + zinc)** — elegant, creative, modern. Taps the
purple-pastel aesthetic that dominates Catppuccin and Dracula. In
contrast to the tinted-neutral themes, Iris uses deliberately
untinted zinc — the personality comes entirely from the violet
accent, not atmospheric neutral tinting. Dark mode uses `#18181B`
(Material's "near-black") rather than pure black to avoid harshness.

**Ember (orange + neutral)** — bold, energetic, focused. Monokai
and Ayu warmth reimagined with orange as the *primary* accent (it
is usually a secondary in editor themes). Against a true-neutral
gray backdrop, the orange reads as warm without the "everything
warm" saturation of Gruvbox — warm-accent-on-neutral contrast
creates energetic clarity rather than retro cozy.

**Cove (teal + sage)** — calm, oceanic, zen. The quiet space
between Grove's emerald and Classic Blue's blue. Teal sits at the
blue-green boundary (~175°) where Nord's arctic frost lives; sage
neutrals carry a green undertone that evokes sea glass and coastal
mist. Info state overrides to Indigo so it doesn't blur into the
teal accent.

**Design space you might fill next:** high-contrast monochrome,
a cream-and-brown "book" theme, a solarized homage, a muted
blueprint/drafting theme, a high-key neon cyberpunk…

---

## 8. Deliverable template

Return a filled copy of **one** of the forms below. Form A is
recommended unless you have a strong reason for Form B.

### Form A — Primitive scales (recommended)

```yaml
theme_name: ""                    # short slug, lowercase, hyphen-separated (e.g. "dusk", "sunset")
theme_label: ""                   # display name (e.g. "Dusk", "Sunset")
theme_description: >              # 1-3 sentences — the "why" a user would pick this
  ""

accent_scale:                     # 11 shades — pick a hue family (e.g. violet, rose, teal)
  50:  "#"                        #   lightest — used as tinted backgrounds in light mode
  100: "#"
  200: "#"
  300: "#"
  400: "#"                        # link color in dark mode
  500: "#"                        # focus ring base
  600: "#"                        # emphasis fill in light mode
  700: "#"                        # link color in light mode
  800: "#"
  900: "#"
  950: "#"                        # darkest

neutral_scale:                    # 11 shades — warm or cool gray
  50:  "#"                        # page bg in light mode
  100: "#"                        # inset / code block bg in light mode
  200: "#"                        # border-default in light mode; text-primary in dark mode
  300: "#"                        # border-strong in light mode
  400: "#"                        # text-secondary in dark mode
  500: "#"                        # text-muted (both modes)
  600: "#"                        # text-secondary in light mode
  700: "#"                        # border-default in dark mode; surface in dark mode
  800: "#"                        # text-heading in light mode; surface in dark mode
  900: "#"                        # text-primary in light mode; sidebar in dark mode
  950: "#"                        # page bg in dark mode

status_hues:
  success_light_bg:     "#"       # pale green fill (existing: #ecfdf5)
  success_light_text:   "#"       # dark green text (existing: #065f46)
  success_dark_text:    "#"       # light green text on dark bg (existing: #6ee7b7)

  warning_light_bg:     "#"
  warning_light_text:   "#"
  warning_dark_text:    "#"

  error_light_bg:       "#"
  error_light_text:     "#"
  error_dark_text:      "#"

  info_light_bg:        "#"       # normally tinted with the accent hue
  info_light_text:      "#"
  info_dark_text:       "#"

notes: >
  Anything the developer should know — "link color should feel
  slightly desaturated", "prefer pure white surfaces", etc.
```

### Form B — Semantic tokens (full control)

If you want per-token control, fill in this schema. Each token
needs **both** a light and a dark value.

```yaml
theme_name: ""
theme_label: ""
theme_description: ""

light:
  # Backgrounds
  color_bg_page:             "#"
  color_bg_surface:          "#"
  color_bg_inset:            "#"
  color_bg_elevated:         "#"
  color_bg_emphasis:         "#"
  color_bg_code_block:       "#"
  color_bg_code_inline:      "#"
  color_bg_table_header:     "#"
  color_bg_table_stripe:     "#"
  color_bg_blockquote:       "#"    # or "transparent"
  color_bg_hover:            "#"    # typically rgba
  color_bg_sidebar:          "#"

  # Text
  color_text_primary:        "#"
  color_text_secondary:      "#"
  color_text_muted:          "#"
  color_text_heading:        "#"
  color_text_on_emphasis:    "#"
  color_text_link:           "#"
  color_text_link_hover:     "#"
  color_text_code:           "#"
  color_text_code_inline:    "#"

  # Borders
  color_border_default:      "#"
  color_border_strong:       "#"
  color_border_muted:        "#"
  color_border_focus:        "#"
  color_border_code_inline:  "#"

  # Status — success
  color_success_bg:          "#"
  color_success_border:      "#"
  color_success_text:        "#"
  color_success_icon:        "#"
  # Status — warning
  color_warning_bg:          "#"
  color_warning_border:      "#"
  color_warning_text:        "#"
  color_warning_icon:        "#"
  # Status — error
  color_error_bg:            "#"
  color_error_border:        "#"
  color_error_text:          "#"
  color_error_icon:          "#"
  # Status — info
  color_info_bg:             "#"
  color_info_border:         "#"
  color_info_text:           "#"
  color_info_icon:           "#"

  # Accent overlays
  color_focus_ring:          "#"   # typically rgba
  color_link_underline:      "#"   # typically rgba
  color_bg_active_item:      "#"   # typically rgba
  color_bg_backdrop:         "#"   # typically rgba

  # Syntax highlighting (optional — developer can derive from accent + neutral)
  hljs_base_text:            "#"
  hljs_base_bg:              "#"
  hljs_keyword:              "#"
  hljs_title:                "#"
  hljs_title_class:          "#"
  hljs_title_function:       "#"
  hljs_string:               "#"
  hljs_number:               "#"
  hljs_literal:              "#"
  hljs_regexp:               "#"
  hljs_type:                 "#"
  hljs_built_in:             "#"
  hljs_class:                "#"
  hljs_attr:                 "#"
  hljs_variable:             "#"
  hljs_property:             "#"
  hljs_params:               "#"
  hljs_tag:                  "#"
  hljs_name:                 "#"
  hljs_comment:              "#"
  hljs_punctuation:          "#"
  hljs_operator:             "#"
  hljs_meta:                 "#"

dark:
  # … same schema as light, with dark-mode values …
```

---

## 9. What happens next

Once you return a filled template, a developer uses
[adding-a-theme.md](./adding-a-theme.md) to convert it into a
working theme. The conversion is mechanical — your values become
a new `_<theme-name>.scss` file, the theme name gets registered in
a TypeScript constants file, the boot script is updated, and the
palette appears in the theme-switcher.

If you have questions while filling in the template, note them in
the `notes` field — the developer will resolve them during
implementation.

---

## See also

- [overview.md](./overview.md) — the design section landing page
- [color-schemes.md](./color-schemes.md) — every current token
  value, for reference
- [styleguide.md](./styleguide.md) — narrative rationale for the
  current design
- [spacing.md](./spacing.md) — the spacing, typography, and
  motion scales (out of scope for palette work)
- [themes.md](./themes.md) — how themes are applied at runtime
- [adding-a-theme.md](./adding-a-theme.md) — the developer-side
  walkthrough that turns your template into a working theme
