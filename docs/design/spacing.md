# Spacing, type, and motion

**The metric reference for Grove.** Every spacing step, every radius, every font size, every shadow, every duration, every responsive breakpoint. This doc is the sibling of [color-schemes.md](./color-schemes.md) — colors on one side, numbers on the other. For narrative context (why headings are semibold, how the cascade is structured, where rules live), see [styleguide.md](./styleguide.md).

All primitive tokens live in `frontend/src/styles/_tokens.scss`.

---

## Base unit

Grove uses a **4px atomic step** expressed in rem. `1rem = 16px` (the browser default), and `var(--space-1)` is `0.25rem = 4px`. Every spacing, radius, and font-size value is a multiple of this step.

**16px is the body-text baseline.** Tables, code blocks, and callouts can shrink text locally (code blocks drop to 85%, `.dl-fs-sm` to 0.875rem), but body paragraph text is always 16px. All font sizes use `rem` so user browser zoom and custom default sizes work proportionally.

---

## Spacing scale

Source: `_tokens.scss:35-40`.

| Token         | rem       | px   | Typical use                                              |
| ------------- | --------- | ---- | -------------------------------------------------------- |
| `--space-0`   | `0`       | 0    | Zero (e.g., resetting a margin)                          |
| `--space-1`   | `0.25rem` | 4    | List item spacing, copy button padding, inline gaps      |
| `--space-2`   | `0.5rem`  | 8    | h2 padding-bottom, tight flex gaps, code header vertical |
| `--space-3`   | `0.75rem` | 12   | h1 padding-bottom, blockquote vertical, table cell Y     |
| `--space-4`   | `1rem`    | 16   | **Default block margin-bottom**, code block padding, table cell X |
| `--space-5`   | `1.25rem` | 20   | (available, rarely used)                                 |
| `--space-6`   | `1.5rem`  | 24   | h1 bottom margin, h4 top margin                           |
| `--space-8`   | `2rem`    | 32   | h3 top margin, `hr` vertical margin, content area Y padding |
| `--space-10`  | `2.5rem`  | 40   | Content area horizontal padding                          |
| `--space-12`  | `3rem`    | 48   | h2 top margin (largest section break)                    |
| `--space-16`  | `4rem`    | 64   | Reserved for hero sections, not currently used           |

**The default block margin-bottom is 16px (`--space-4`).** Paragraphs, lists, code blocks, tables, blockquotes, and images all share this value as their bottom margin. That consistency is what establishes Grove's vertical rhythm — every block puts the same amount of air under itself, so a document reads as a single column of evenly-paced blocks rather than a jumble of custom gaps.

---

## Vertical rhythm rules

Two rules govern spacing between blocks:

1. **Everything gets 16px below itself.** Paragraphs, lists, tables, blockquotes, code blocks, images, `.math-block`, `.mermaid-diagram`. This is the baseline rhythm unit.
2. **Headings use a 2:1 top-to-bottom ratio.** A heading gets twice as much space above it as below, so it binds visually to the content that follows rather than floating between two equal gaps.

Concrete heading margins from `_blocks.scss:15-52`:

| Element | Top margin     | Bottom margin  | Extra                                                    |
| ------- | -------------- | -------------- | -------------------------------------------------------- |
| `h1`    | `0`            | `--space-6` (24px) | `padding-bottom: --space-3` (12px) + 1px bottom border |
| `h2`    | `--space-12` (48px) | `--space-4` (16px) | `padding-bottom: --space-2` (8px) + 1px bottom border |
| `h3`    | `--space-8` (32px) | `--space-4` (16px) | —                                                   |
| `h4`    | `--space-6` (24px) | `--space-3` (12px) | —                                                   |
| `h5`    | `--space-4` (16px) | `--space-2` (8px)  | —                                                   |
| `h6`    | `--space-4` (16px) | `--space-2` (8px)  | `text-transform: uppercase; letter-spacing: 0.05em` |

H1 starts at zero because it's the page title — no content exists above it. H2 gets a full 48px break because it signals the largest section change on a page. H3–H6 step the breaks down proportionally.

---

## Radius scale

Source: `_tokens.scss:42-45`.

| Token           | Value    | Typical use                                                  |
| --------------- | -------- | ------------------------------------------------------------ |
| `--radius-sm`   | `4px`    | Small chips, highlight marks, diff addition/deletion rows    |
| `--radius-md`   | `6px`    | Inline code pills, blockquote right corners, buttons         |
| `--radius-lg`   | `8px`    | Code blocks, table wrappers, images, `.surface-card`         |
| `--radius-xl`   | `12px`   | Larger cards, hero images                                    |
| `--radius-2xl`  | `16px`   | Oversized containers                                         |
| `--radius-full` | `9999px` | Pills, circles, `.color-swatch`, `.wiki-attribution` footer  |

The jump from `sm` to `md` to `lg` (4 → 6 → 8) is deliberately small — each step is only 2px, which keeps the visual language consistent across components of different sizes. Components that need *a lot* more rounding should go to `xl` or `2xl` rather than introducing a new value.

---

## Typography scale

Source: `_tokens.scss:65-85`.

### Font families

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans',
             Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
--font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
             'Liberation Mono', monospace;
```

Both stacks lead with platform-native fonts (`-apple-system` / `ui-monospace`) and fall through to well-supported alternatives.

### Font sizes

Approximate Major Third (1.25) scale, tuned:

| Token                | rem        | px     |
| -------------------- | ---------- | ------ |
| `--font-size-2xs`    | `0.625rem` | 10     |
| `--font-size-xs`     | `0.75rem`  | 12     |
| `--font-size-sm`     | `0.875rem` | 14     |
| `--font-size-base`   | `1rem`     | 16     |
| `--font-size-lg`     | `1.125rem` | 18     |
| `--font-size-xl`     | `1.25rem`  | 20     |
| `--font-size-2xl`    | `1.5rem`   | 24     |
| `--font-size-3xl`    | `1.875rem` | 30     |
| `--font-size-4xl`    | `2.25rem`  | 36     |

`--font-size-2xs` (10px) is the smallest allowed. It's used for very secondary labels only — not body text, not even captions. `--font-size-base` (16px) is the minimum for primary content.

### Line heights

| Token                   | Value  | Use                                                  |
| ----------------------- | ------ | ---------------------------------------------------- |
| `--line-height-tight`   | `1.25` | Headings (large text, less leading needed)           |
| `--line-height-normal`  | `1.6`  | Body paragraphs, default wiki content                |
| `--line-height-relaxed` | `1.75` | Reserved for long-form content that needs more air   |

### Font weights

| Token                    | Value  | Use                                                 |
| ------------------------ | ------ | --------------------------------------------------- |
| `--font-weight-normal`   | `400`  | Body copy                                           |
| `--font-weight-medium`   | `500`  | Active nav items, syntax-highlighting keywords      |
| `--font-weight-semibold` | `600`  | **Headings, `.dl-bold`, table headers, labels**     |
| `--font-weight-bold`     | `700`  | Rarely used — semibold is the bold in this system   |

**Headings use semibold (600), not bold (700).** This is a deliberate choice matching GitHub Primer: semibold renders cleaner at display sizes and gives a calmer tone to documentation. `.dl-bold` also maps to 600 so markdown `**bold**` matches heading weight.

---

## Heading scale

Concrete sizes and treatments pulled from `_blocks.scss:15-52`:

| Element | Size token          | px    | Weight | Letter-spacing | Notes                                      |
| ------- | ------------------- | ----- | ------ | -------------- | ------------------------------------------ |
| `h1`    | `--font-size-4xl`   | 36    | 600    | `-0.025em`     | Page title, bottom border, zero top margin |
| `h2`    | `--font-size-3xl`   | 30    | 600    | `-0.025em`     | Bottom border, 48px top margin             |
| `h3`    | `--font-size-2xl`   | 24    | 600    | normal         | 32px top margin                            |
| `h4`    | `--font-size-xl`    | 20    | 600    | normal         | 24px top margin                            |
| `h5`    | `--font-size-base`  | 16    | 600    | normal         | 16px top margin                            |
| `h6`    | `--font-size-sm`    | 14    | 600    | `0.05em` + uppercase | Uses `--color-text-secondary`        |

Negative letter-spacing on h1 and h2 optically tightens the wider glyph gaps that appear at display sizes — at 30–36px, text without this feels visually loose. Positive letter-spacing on h6 (plus uppercase) turns it into a caps label, which is the only way 14px can still read as a heading and not body text.

All headings share `line-height: var(--line-height-tight)` (1.25). Large text needs less vertical breathing room than body copy.

---

## Font size utilities

Inline size utilities used inside the markdown body, defined in `_inline.scss:117-123`. These are Tailwind-style paired-scale values (each size has a matching line-height) and are distinct from the heading scale.

| Class          | font-size   | line-height | px    |
| -------------- | ----------- | ----------- | ----- |
| `.dl-fs-xs`    | `0.75rem`   | `1rem`      | 12/16 |
| `.dl-fs-sm`    | `0.875rem`  | `1.25rem`   | 14/20 |
| `.dl-fs-base`  | `1rem`      | `1.5rem`    | 16/24 |
| `.dl-fs-lg`    | `1.125rem`  | `1.75rem`   | 18/28 |
| `.dl-fs-xl`    | `1.25rem`   | `1.75rem`   | 20/28 |
| `.dl-fs-2xl`   | `1.5rem`    | `2rem`      | 24/32 |
| `.dl-fs-3xl`   | `1.875rem`  | `2.25rem`   | 30/36 |

Note that `.dl-fs-xl` and `.dl-fs-lg` share the same 28px line-height — the 20px size gets slightly tighter leading than 24px. Larger text takes progressively tighter leading, which is the standard Tailwind approach.

Use these for ad-hoc size changes inside content (for example, an inline note rendered with `.dl-fs-sm`). Don't use them as heading replacements — prefer real `h1–h6` with semantic markup.

---

## Shadow scale

Source: `_tokens.scss:47-52`.

### Light mode (default)

| Token           | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| `--shadow-xs`   | `0 1px 2px rgba(0, 0, 0, 0.04)`                                    |
| `--shadow-sm`   | `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)`     |
| `--shadow-md`   | `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` |
| `--shadow-lg`   | `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03)` |

Light shadows are intentionally soft (3–8% opacity) — enough to separate surfaces from the page but not enough to read as heavy.

### Dark mode override

Each theme's dark block redefines three of the shadow tokens with deeper opacity so they're actually visible against dark surfaces:

| Token           | Dark value                              |
| --------------- | --------------------------------------- |
| `--shadow-sm`   | `0 1px 2px rgba(0, 0, 0, 0.3)`          |
| `--shadow-md`   | `0 4px 6px rgba(0, 0, 0, 0.4)`          |
| `--shadow-lg`   | `0 10px 15px rgba(0, 0, 0, 0.5)`        |

`--shadow-xs` keeps its light value even in dark mode — at 4% opacity it's barely visible against dark backgrounds, which is fine for its typical use (the color swatch outline).

### Usage

| Token           | Typical use                                           |
| --------------- | ----------------------------------------------------- |
| `--shadow-xs`   | Color swatches, other 1px lifts                       |
| `--shadow-sm`   | Images, surface cards                                 |
| `--shadow-md`   | Elevated containers (not currently used heavily)      |
| `--shadow-lg`   | Popovers (theme switcher), mobile sidebar drawer      |

---

## Motion

Source: `_tokens.scss:54-63`.

### Durations

| Token                | Value   | Use                                                  |
| -------------------- | ------- | ---------------------------------------------------- |
| `--duration-fast`    | `100ms` | Quick hover changes (copy button, icon buttons)      |
| `--duration-normal`  | `150ms` | Link color + underline transitions, sidebar items    |
| `--duration-slow`    | `300ms` | Sidebar drawer slide-in, larger layout transitions   |

### Easing

```css
--easing-default: cubic-bezier(0.4, 0, 0.2, 1);
```

Material Design's "ease-out" curve — starts fast, ends slow. Used for every transition in the system. Nothing springs, nothing bounces; transitions are quiet and get out of the way.

### Compound shorthand

```css
--transition-fast:   var(--duration-fast) var(--easing-default);
--transition-normal: var(--duration-normal) var(--easing-default);
--transition-slow:   var(--duration-slow) var(--easing-default);
```

These combine duration + easing so a component can write `transition: background var(--transition-normal)` without repeating the easing function.

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

When the user has `prefers-reduced-motion: reduce` set, every transition and animation collapses to 0.01ms (effectively instant). Grove's transitions are already short, but this guarantees they disappear entirely for users who opt out.

---

## Layout metrics

| Metric                     | Value              | Source                                   |
| -------------------------- | ------------------ | ---------------------------------------- |
| Content measure (default)  | `65ch`             | `_components.scss:19`                    |
| Content measure (`.wide`)  | `100ch`            | `_components.scss:24`                    |
| Desktop sidebar width      | `260px`            | `document-shell.component.scss`          |
| Mobile drawer width        | `280px`            | `document-shell.component.scss`          |
| Content area Y padding     | `var(--space-8)`   | `document-shell.component.scss`          |
| Content area X padding     | `var(--space-10)`  | `document-shell.component.scss`          |
| Print content padding      | `0 1cm`            | `document-shell.component.scss @media print` |
| Scroll margin on `[id]`    | `1rem`             | `_base.scss:53`                          |
| Focus outline thickness    | `2px`              | `_base.scss:33`                          |
| Focus outline offset       | `2px`              | `_base.scss:34`                          |

**Why 65ch?** Typography research puts the ideal line length for long-form reading at 45–75 characters per line. 65ch is the middle of that band. Anything wider forces the eye to track back too far on line returns; anything narrower creates ragged right edges and too many line breaks.

**Why 260px sidebar?** Docusaurus, GitLab, and Tailwind Docs converged on this width independently. It's wide enough to show 2–3 levels of nested file paths without truncation and narrow enough not to dominate a 1280px laptop screen.

---

## Responsive breakpoints

Grove has **two meaningful breakpoints**. Everything between and beyond them is fluid.

| Breakpoint          | Behavior                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| `max-width: 768px`  | `.surface-card` padding shrinks from 16 to 12; `document-shell` sidebar becomes an overlay drawer with backdrop at 767px |
| `max-width: 480px`  | Code block padding shrinks from 16 to 8; line-number gutter shrinks from 3.5em / 2.5em to 2.5em / 1.8em |

Between and below these, the layout is fluid: the `65ch` content measure means prose always hits its ideal line length on any viewport wider than ~640px (where `65ch` ≈ `640px` at default font size), and narrower viewports just let paragraphs fill the available space.

Both breakpoints use `max-width` rather than `min-width` — this is a mobile-last stylesheet, not a mobile-first one. The desktop layout is the baseline, and narrower screens layer in overrides.

---

## Container padding reference

Frequently-referenced padding values pulled together so they're easy to audit:

| Element                  | Padding                                    |
| ------------------------ | ------------------------------------------ |
| `pre` (code block)       | `var(--space-4)` (16px all sides)          |
| `pre` @ max-width 480px  | `var(--space-2)` (8px all sides)           |
| `th`, `td`               | `var(--space-3) var(--space-4)` (12/16)    |
| `blockquote`             | `var(--space-3) var(--space-4)` (12/16)    |
| `.surface-card`          | `var(--space-4)` (16px)                    |
| `.surface-card` @ 768px  | `var(--space-3)` (12px)                    |
| `.code-block-header`     | `var(--space-2) var(--space-4)` (8/16)     |
| `.copy-btn`              | `var(--space-1) var(--space-2)` (4/8)      |
| `.mermaid-diagram`       | `var(--space-4)` (16px)                    |
| `.dl-code` (inline code) | `0.15em 0.4em` (em-relative, not space token) |

Inline code uses `em` units because it should scale with surrounding text. Everything else uses space tokens so the rhythm holds across the system.
