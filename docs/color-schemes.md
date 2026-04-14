# Color schemes

**The complete color reference for Grove.** Every primitive palette, every semantic token, every theme × mode combination, every syntax highlighting shade, and the print-mode coercion table. This is a lookup doc — read top-to-bottom once to understand the shape of the system, then use the table of contents to jump to specific values.

For the *why* behind these choices — the architecture, the rules for adding new tokens, the rationale for multi-theme — see [styleguide.md](./styleguide.md). For spacing, radius, typography, and motion metrics, see [spacing.md](./spacing.md).

---

## How themes work

Grove uses two HTML attributes on `<html>` to select a theme:

```html
<html data-theme="grove" data-mode="light">
```

| Attribute    | Values                    | Effect                               |
| ------------ | ------------------------- | ------------------------------------ |
| `data-theme` | `grove`, `classic-blue`   | Picks the palette (hues + neutrals). |
| `data-mode`  | `light`, `dark`           | Picks the brightness inversion.      |

Semantic tokens are defined under compound selectors:

```scss
[data-theme="grove"][data-mode="light"]       { /* Grove light */ }
[data-theme="grove"][data-mode="dark"]        { /* Grove dark  */ }
[data-theme="classic-blue"][data-mode="light"] { /* Classic Blue light */ }
[data-theme="classic-blue"][data-mode="dark"]  { /* Classic Blue dark  */ }
```

Four configurations total. Switching themes is instant and requires no component CSS change because every component reads from semantic tokens only.

- **Grove** (default) — emerald primary on warm stone neutrals. Source: `frontend/src/styles/themes/_grove.scss`.
- **Classic Blue** (legacy) — blue primary on cool slate neutrals. Preserved as an opt-in theme after the rebrand. Source: `frontend/src/styles/themes/_classic-blue.scss`.

---

## Primitive scales

Primitive tokens live in `frontend/src/styles/_tokens.scss` and are defined on `:root` — they are palette-agnostic and always present. Component CSS must never reference these directly; theme files use them to build semantic tokens.

### Blue (used by Classic Blue)

| Token         | Hex       | Token         | Hex       |
| ------------- | --------- | ------------- | --------- |
| `--blue-50`   | `#eff6ff` | `--blue-500`  | `#3b82f6` |
| `--blue-100`  | `#dbeafe` | `--blue-600`  | `#2563eb` |
| `--blue-200`  | `#bfdbfe` | `--blue-700`  | `#1d4ed8` |
| `--blue-300`  | `#93c5fd` | `--blue-800`  | `#1e40af` |
| `--blue-400`  | `#60a5fa` | `--blue-900`  | `#1e3a8a` |
|               |           | `--blue-950`  | `#172554` |

### Slate (used by Classic Blue neutrals)

| Token          | Hex       | Token          | Hex       |
| -------------- | --------- | -------------- | --------- |
| `--slate-50`   | `#f8fafc` | `--slate-500`  | `#64748b` |
| `--slate-100`  | `#f1f5f9` | `--slate-600`  | `#475569` |
| `--slate-200`  | `#e2e8f0` | `--slate-700`  | `#334155` |
| `--slate-300`  | `#cbd5e1` | `--slate-800`  | `#1e293b` |
| `--slate-400`  | `#94a3b8` | `--slate-900`  | `#0f172a` |
|                |           | `--slate-950`  | `#020617` |

### Emerald (used by Grove)

| Token            | Hex       | Token            | Hex       |
| ---------------- | --------- | ---------------- | --------- |
| `--emerald-50`   | `#ecfdf5` | `--emerald-500`  | `#10b981` |
| `--emerald-100`  | `#d1fae5` | `--emerald-600`  | `#059669` |
| `--emerald-200`  | `#a7f3d0` | `--emerald-700`  | `#047857` |
| `--emerald-300`  | `#6ee7b7` | `--emerald-800`  | `#065f46` |
| `--emerald-400`  | `#34d399` | `--emerald-900`  | `#064e3b` |
|                  |           | `--emerald-950`  | `#022c22` |

### Stone (used by Grove neutrals)

| Token          | Hex       | Token          | Hex       |
| -------------- | --------- | -------------- | --------- |
| `--stone-50`   | `#fafaf9` | `--stone-500`  | `#78716c` |
| `--stone-100`  | `#f5f5f4` | `--stone-600`  | `#57534e` |
| `--stone-200`  | `#e7e5e4` | `--stone-700`  | `#44403c` |
| `--stone-300`  | `#d6d3d1` | `--stone-800`  | `#292524` |
| `--stone-400`  | `#a8a29e` | `--stone-900`  | `#1c1917` |
|                |           | `--stone-950`  | `#0c0a09` |

---

## Semantic token categories

Every theme × mode block defines tokens in six groups. Knowing the group shapes before diving into the tables makes the reassignments easier to scan.

| Group                 | Purpose                                                             | Token prefix              |
| --------------------- | ------------------------------------------------------------------- | ------------------------- |
| Backgrounds           | Page, surface, inset, elevated, emphasis, code blocks, tables, sidebar, hover | `--color-bg-*`         |
| Text                  | Primary, secondary, muted, heading, on-emphasis, link, link-hover, code, code-inline | `--color-text-*`  |
| Borders               | Default, strong, muted, focus, code-inline                          | `--color-border-*`        |
| Status                | Success, warning, error, info × `-bg`, `-border`, `-text`, `-icon`   | `--color-{status}-*`      |
| Accent overlays       | Focus ring, link underline, active nav item, modal backdrop         | `--color-focus-ring`, `--color-link-underline`, `--color-bg-active-item`, `--color-bg-backdrop` |
| Syntax highlighting   | highlight.js token colors                                           | `--hljs-*`                |

Dark mode blocks additionally override the **shadow scale** (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) with higher-opacity values because shadows don't read well against dark surfaces.

---

## Grove theme (default)

### Grove — light mode

Selector: `[data-theme="grove"][data-mode="light"]`. Source: `frontend/src/styles/themes/_grove.scss:14-80`.

**Backgrounds**

| Token                        | Resolves to       | Hex       |
| ---------------------------- | ----------------- | --------- |
| `--color-bg-page`            | `var(--stone-50)` | `#fafaf9` |
| `--color-bg-surface`         | —                 | `#ffffff` |
| `--color-bg-inset`           | `var(--stone-100)`| `#f5f5f4` |
| `--color-bg-elevated`        | —                 | `#ffffff` |
| `--color-bg-emphasis`        | `var(--emerald-600)` | `#059669` |
| `--color-bg-code-block`      | `var(--stone-100)`| `#f5f5f4` |
| `--color-bg-code-inline`     | `var(--emerald-50)` | `#ecfdf5` |
| `--color-bg-table-header`    | `var(--stone-50)` | `#fafaf9` |
| `--color-bg-table-stripe`    | `var(--stone-50)` | `#fafaf9` |
| `--color-bg-blockquote`      | —                 | `transparent` |
| `--color-bg-hover`           | —                 | `rgba(0, 0, 0, 0.04)` |
| `--color-bg-sidebar`         | `var(--stone-50)` | `#fafaf9` |

**Text**

| Token                         | Resolves to           | Hex       |
| ----------------------------- | --------------------- | --------- |
| `--color-text-primary`        | `var(--stone-900)`    | `#1c1917` |
| `--color-text-secondary`      | `var(--stone-600)`    | `#57534e` |
| `--color-text-muted`          | `var(--stone-500)`    | `#78716c` |
| `--color-text-heading`        | `var(--stone-800)`    | `#292524` |
| `--color-text-on-emphasis`    | —                     | `#ffffff` |
| `--color-text-link`           | `var(--emerald-700)`  | `#047857` |
| `--color-text-link-hover`     | `var(--emerald-900)`  | `#064e3b` |
| `--color-text-code`           | `var(--stone-800)`    | `#292524` |
| `--color-text-code-inline`    | `var(--emerald-800)`  | `#065f46` |

**Borders**

| Token                          | Resolves to            | Hex       |
| ------------------------------ | ---------------------- | --------- |
| `--color-border-default`       | `var(--stone-200)`     | `#e7e5e4` |
| `--color-border-strong`        | `var(--stone-300)`     | `#d6d3d1` |
| `--color-border-muted`         | `var(--stone-100)`     | `#f5f5f4` |
| `--color-border-focus`         | `var(--emerald-500)`   | `#10b981` |
| `--color-border-code-inline`   | `var(--emerald-200)`   | `#a7f3d0` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(16, 185, 129, 0.2)`       |
| `--color-link-underline`  | `rgba(4, 120, 87, 0.4)`         |
| `--color-bg-active-item`  | `rgba(16, 185, 129, 0.1)`       |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.4)`            |

### Grove — dark mode

Selector: `[data-theme="grove"][data-mode="dark"]`. Source: `frontend/src/styles/themes/_grove.scss:84-162`.

**Backgrounds**

| Token                        | Resolves to             | Hex / value              |
| ---------------------------- | ----------------------- | ------------------------ |
| `--color-bg-page`            | `var(--stone-950)`      | `#0c0a09`                |
| `--color-bg-surface`         | `var(--stone-800)`      | `#292524`                |
| `--color-bg-inset`           | `var(--stone-950)`      | `#0c0a09`                |
| `--color-bg-elevated`        | `var(--stone-700)`      | `#44403c`                |
| `--color-bg-emphasis`        | `var(--emerald-500)`    | `#10b981`                |
| `--color-bg-code-block`      | `var(--stone-800)`      | `#292524`                |
| `--color-bg-code-inline`     | `var(--stone-700)`      | `#44403c`                |
| `--color-bg-table-header`    | `var(--stone-700)`      | `#44403c`                |
| `--color-bg-table-stripe`    | —                       | `rgba(255, 255, 255, 0.03)` |
| `--color-bg-blockquote`      | —                       | `rgba(52, 211, 153, 0.08)`  |
| `--color-bg-hover`           | —                       | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-sidebar`         | `var(--stone-900)`      | `#1c1917`                |

**Text**

| Token                         | Resolves to           | Hex       |
| ----------------------------- | --------------------- | --------- |
| `--color-text-primary`        | `var(--stone-200)`    | `#e7e5e4` |
| `--color-text-secondary`      | `var(--stone-400)`    | `#a8a29e` |
| `--color-text-muted`          | `var(--stone-500)`    | `#78716c` |
| `--color-text-heading`        | `var(--stone-100)`    | `#f5f5f4` |
| `--color-text-on-emphasis`    | —                     | `#ffffff` |
| `--color-text-link`           | `var(--emerald-400)`  | `#34d399` |
| `--color-text-link-hover`     | `var(--emerald-300)`  | `#6ee7b7` |
| `--color-text-code`           | `var(--stone-200)`    | `#e7e5e4` |
| `--color-text-code-inline`    | `var(--emerald-300)`  | `#6ee7b7` |

**Borders**

| Token                          | Resolves to            | Hex / value               |
| ------------------------------ | ---------------------- | ------------------------- |
| `--color-border-default`       | `var(--stone-700)`     | `#44403c`                 |
| `--color-border-strong`        | `var(--stone-600)`     | `#57534e`                 |
| `--color-border-muted`         | `var(--stone-800)`     | `#292524`                 |
| `--color-border-focus`         | `var(--emerald-400)`   | `#34d399`                 |
| `--color-border-code-inline`   | —                      | `rgba(52, 211, 153, 0.3)` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(52, 211, 153, 0.25)`      |
| `--color-link-underline`  | `rgba(52, 211, 153, 0.4)`       |
| `--color-bg-active-item`  | `rgba(52, 211, 153, 0.15)`      |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.6)`            |

**Shadows (dark-mode override)**

| Token           | Value                               |
| --------------- | ----------------------------------- |
| `--shadow-sm`   | `0 1px 2px rgba(0, 0, 0, 0.3)`      |
| `--shadow-md`   | `0 4px 6px rgba(0, 0, 0, 0.4)`      |
| `--shadow-lg`   | `0 10px 15px rgba(0, 0, 0, 0.5)`    |

---

## Classic Blue theme (legacy)

### Classic Blue — light mode

Selector: `[data-theme="classic-blue"][data-mode="light"]`. Source: `frontend/src/styles/themes/_classic-blue.scss:11-75`.

**Backgrounds**

| Token                        | Resolves to       | Hex       |
| ---------------------------- | ----------------- | --------- |
| `--color-bg-page`            | `var(--slate-50)` | `#f8fafc` |
| `--color-bg-surface`         | —                 | `#ffffff` |
| `--color-bg-inset`           | `var(--slate-100)`| `#f1f5f9` |
| `--color-bg-elevated`        | —                 | `#ffffff` |
| `--color-bg-emphasis`        | `var(--blue-600)` | `#2563eb` |
| `--color-bg-code-block`      | `var(--slate-100)`| `#f1f5f9` |
| `--color-bg-code-inline`     | `var(--blue-50)`  | `#eff6ff` |
| `--color-bg-table-header`    | `var(--slate-50)` | `#f8fafc` |
| `--color-bg-table-stripe`    | `var(--slate-50)` | `#f8fafc` |
| `--color-bg-blockquote`      | —                 | `transparent` |
| `--color-bg-hover`           | —                 | `rgba(0, 0, 0, 0.04)` |
| `--color-bg-sidebar`         | `var(--slate-50)` | `#f8fafc` |

**Text**

| Token                         | Resolves to         | Hex       |
| ----------------------------- | ------------------- | --------- |
| `--color-text-primary`        | `var(--slate-900)`  | `#0f172a` |
| `--color-text-secondary`      | `var(--slate-600)`  | `#475569` |
| `--color-text-muted`          | `var(--slate-500)`  | `#64748b` |
| `--color-text-heading`        | `var(--slate-800)`  | `#1e293b` |
| `--color-text-on-emphasis`    | —                   | `#ffffff` |
| `--color-text-link`           | `var(--blue-600)`   | `#2563eb` |
| `--color-text-link-hover`     | `var(--blue-800)`   | `#1e40af` |
| `--color-text-code`           | `var(--slate-800)`  | `#1e293b` |
| `--color-text-code-inline`    | `var(--blue-800)`   | `#1e40af` |

**Borders**

| Token                          | Resolves to          | Hex       |
| ------------------------------ | -------------------- | --------- |
| `--color-border-default`       | `var(--slate-200)`   | `#e2e8f0` |
| `--color-border-strong`        | `var(--slate-300)`   | `#cbd5e1` |
| `--color-border-muted`         | `var(--slate-100)`   | `#f1f5f9` |
| `--color-border-focus`         | `var(--blue-500)`    | `#3b82f6` |
| `--color-border-code-inline`   | `var(--blue-200)`    | `#bfdbfe` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(59, 130, 246, 0.2)`       |
| `--color-link-underline`  | `rgba(37, 99, 235, 0.4)`        |
| `--color-bg-active-item`  | `rgba(59, 130, 246, 0.1)`       |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.4)`            |

### Classic Blue — dark mode

Selector: `[data-theme="classic-blue"][data-mode="dark"]`. Source: `frontend/src/styles/themes/_classic-blue.scss:79-156`.

**Backgrounds**

| Token                        | Resolves to           | Hex / value              |
| ---------------------------- | --------------------- | ------------------------ |
| `--color-bg-page`            | —                     | `#0f172a`                |
| `--color-bg-surface`         | `var(--slate-800)`    | `#1e293b`                |
| `--color-bg-inset`           | —                     | `#0f172a`                |
| `--color-bg-elevated`        | `var(--slate-700)`    | `#334155`                |
| `--color-bg-emphasis`        | `var(--blue-500)`     | `#3b82f6`                |
| `--color-bg-code-block`      | `var(--slate-800)`    | `#1e293b`                |
| `--color-bg-code-inline`     | `var(--slate-700)`    | `#334155`                |
| `--color-bg-table-header`    | `var(--slate-700)`    | `#334155`                |
| `--color-bg-table-stripe`    | —                     | `rgba(255, 255, 255, 0.03)` |
| `--color-bg-blockquote`      | —                     | `rgba(96, 165, 250, 0.08)`  |
| `--color-bg-hover`           | —                     | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-sidebar`         | `var(--slate-900)`    | `#0f172a`                |

**Text**

| Token                         | Resolves to         | Hex       |
| ----------------------------- | ------------------- | --------- |
| `--color-text-primary`        | `var(--slate-200)`  | `#e2e8f0` |
| `--color-text-secondary`      | `var(--slate-400)`  | `#94a3b8` |
| `--color-text-muted`          | `var(--slate-500)`  | `#64748b` |
| `--color-text-heading`        | `var(--slate-100)`  | `#f1f5f9` |
| `--color-text-on-emphasis`    | —                   | `#ffffff` |
| `--color-text-link`           | `var(--blue-400)`   | `#60a5fa` |
| `--color-text-link-hover`     | `var(--blue-300)`   | `#93c5fd` |
| `--color-text-code`           | `var(--slate-200)`  | `#e2e8f0` |
| `--color-text-code-inline`    | `var(--blue-300)`   | `#93c5fd` |

**Borders**

| Token                          | Resolves to          | Hex / value               |
| ------------------------------ | -------------------- | ------------------------- |
| `--color-border-default`       | `var(--slate-700)`   | `#334155`                 |
| `--color-border-strong`        | `var(--slate-600)`   | `#475569`                 |
| `--color-border-muted`         | `var(--slate-800)`   | `#1e293b`                 |
| `--color-border-focus`         | `var(--blue-400)`    | `#60a5fa`                 |
| `--color-border-code-inline`   | —                    | `rgba(96, 165, 250, 0.3)` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(96, 165, 250, 0.25)`      |
| `--color-link-underline`  | `rgba(96, 165, 250, 0.4)`       |
| `--color-bg-active-item`  | `rgba(96, 165, 250, 0.15)`      |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.6)`            |

**Shadows (dark-mode override)**

| Token           | Value                               |
| --------------- | ----------------------------------- |
| `--shadow-sm`   | `0 1px 2px rgba(0, 0, 0, 0.3)`      |
| `--shadow-md`   | `0 4px 6px rgba(0, 0, 0, 0.4)`      |
| `--shadow-lg`   | `0 10px 15px rgba(0, 0, 0, 0.5)`    |

---

## Status colors

Both themes define the four status colors (success, warning, error, info) in both modes. In light mode they're flat Tailwind hex values. In dark mode they're `rgba(…)` overlays with semi-transparent fills so the tint picks up whatever dark background sits under them.

### Light mode (both themes share these values)

| Token                     | Hex       |
| ------------------------- | --------- |
| `--color-success-bg`      | `#ecfdf5` |
| `--color-success-border`  | `#6ee7b7` |
| `--color-success-text`    | `#065f46` |
| `--color-success-icon`    | `#059669` |
| `--color-warning-bg`      | `#fffbeb` |
| `--color-warning-border`  | `#fcd34d` |
| `--color-warning-text`    | `#92400e` |
| `--color-warning-icon`    | `#d97706` |
| `--color-error-bg`        | `#fef2f2` |
| `--color-error-border`    | `#fca5a5` |
| `--color-error-text`      | `#991b1b` |
| `--color-error-icon`      | `#dc2626` |

`--color-info-*` is theme-dependent in light mode:

| Token                     | Grove light           | Classic Blue light    |
| ------------------------- | --------------------- | --------------------- |
| `--color-info-bg`         | `#ecfdf5` (emerald-50)| `#eff6ff` (blue-50)   |
| `--color-info-border`     | `#6ee7b7` (emerald-300)| `#93c5fd` (blue-300) |
| `--color-info-text`       | `#065f46` (emerald-800)| `#1e40af` (blue-800) |
| `--color-info-icon`       | `#059669` (emerald-600)| `#2563eb` (blue-600) |

### Dark mode (both themes share most values)

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-success-bg`      | `rgba(5, 150, 105, 0.15)`       |
| `--color-success-border`  | `rgba(52, 211, 153, 0.4)`       |
| `--color-success-text`    | `#6ee7b7`                       |
| `--color-success-icon`    | `#34d399`                       |
| `--color-warning-bg`      | `rgba(217, 119, 6, 0.15)`       |
| `--color-warning-border`  | `rgba(251, 191, 36, 0.4)`       |
| `--color-warning-text`    | `#fcd34d`                       |
| `--color-warning-icon`    | `#fbbf24`                       |
| `--color-error-bg`        | `rgba(220, 38, 38, 0.15)`       |
| `--color-error-border`    | `rgba(248, 113, 113, 0.4)`      |
| `--color-error-text`      | `#fca5a5`                       |
| `--color-error-icon`      | `#f87171`                       |

`--color-info-*` is theme-dependent in dark mode:

| Token                     | Grove dark                      | Classic Blue dark               |
| ------------------------- | ------------------------------- | ------------------------------- |
| `--color-info-bg`         | `rgba(52, 211, 153, 0.15)`      | `rgba(96, 165, 250, 0.15)`      |
| `--color-info-border`     | `rgba(52, 211, 153, 0.4)`       | `rgba(96, 165, 250, 0.4)`       |
| `--color-info-text`       | `#6ee7b7` (emerald-300)         | `#93c5fd` (blue-300)            |
| `--color-info-icon`       | `#34d399` (emerald-400)         | `#60a5fa` (blue-400)            |

---

## Print overrides

When printing from dark mode, `_base.scss` forces every semantic token back to grayscale values inside `@media print html[data-mode="dark"]`. This guarantees dark ink on white paper regardless of what the user saw on screen. Source: `frontend/src/styles/_base.scss:66-119`.

| Token                          | Print value  |
| ------------------------------ | ------------ |
| `--color-bg-page`              | `#ffffff`    |
| `--color-bg-surface`           | `#ffffff`    |
| `--color-bg-inset`             | `#ffffff`    |
| `--color-bg-elevated`          | `#ffffff`    |
| `--color-bg-code-block`        | `#f5f5f5`    |
| `--color-bg-code-inline`       | `#f5f5f5`    |
| `--color-bg-table-header`      | `#f5f5f5`    |
| `--color-bg-table-stripe`      | `#fafafa`    |
| `--color-bg-blockquote`        | `transparent`|
| `--color-bg-hover`             | `transparent`|
| `--color-bg-sidebar`           | `#ffffff`    |
| `--color-text-primary`         | `#000000`    |
| `--color-text-secondary`       | `#333333`    |
| `--color-text-muted`           | `#666666`    |
| `--color-text-heading`         | `#000000`    |
| `--color-text-code`            | `#000000`    |
| `--color-text-code-inline`     | `#000000`    |
| `--color-text-link`            | `#000000`    |
| `--color-text-link-hover`      | `#000000`    |
| `--color-border-default`       | `#cccccc`    |
| `--color-border-strong`        | `#999999`    |
| `--color-border-muted`         | `#eeeeee`    |
| `--color-border-code-inline`   | `#cccccc`    |
| `--shadow-xs`                  | `none`       |
| `--shadow-sm`                  | `none`       |
| `--shadow-md`                  | `none`       |
| `--shadow-lg`                  | `none`       |

Light mode doesn't need overrides — its tokens already print correctly. Only the dark-mode override block runs.

---

## Syntax highlighting (hljs)

Grove's code blocks use highlight.js token classes (`.hljs-keyword`, `.hljs-string`, and so on) mapped to CSS custom properties in each theme × mode. The mapping lives in `frontend/src/app/shared/doclang/dl-node/_code.scss` as `::ng-deep .hljs-* { color: var(--hljs-*); }` rules. See `_code.scss:62-143` for the complete mapping.

Color palettes are chosen deliberately non-green for keyword/string tokens in the Grove theme so they remain distinguishable from literal green `<tag>` and name tokens.

### Grove — light mode hljs

| Token                    | Hex       | Meaning                        |
| ------------------------ | --------- | ------------------------------ |
| `--hljs-base-text`       | `#44403c` | default code text (stone-700)  |
| `--hljs-base-bg`         | `#f5f5f4` | code block background          |
| `--hljs-keyword`         | `#7c3aed` | violet — keywords              |
| `--hljs-title`           | `#047857` | emerald-700 — titles           |
| `--hljs-title-class`     | `#047857` | emerald-700 — class titles     |
| `--hljs-title-function`  | `#047857` | emerald-700 — function titles  |
| `--hljs-string`          | `#b45309` | amber-700 — strings            |
| `--hljs-number`          | `#0891b2` | cyan-600 — numbers             |
| `--hljs-literal`         | `#7c3aed` | violet — literals              |
| `--hljs-regexp`          | `#db2777` | rose-600 — regexes             |
| `--hljs-type`            | `#c2410c` | orange-800 — types             |
| `--hljs-built-in`        | `#0891b2` | cyan-600 — built-ins           |
| `--hljs-class`           | `#047857` | emerald-700 — class names      |
| `--hljs-attr`            | `#0891b2` | cyan-600 — attributes          |
| `--hljs-variable`        | `#b45309` | amber-700 — variables          |
| `--hljs-property`        | `#0369a1` | cyan-700 — properties          |
| `--hljs-params`          | `#44403c` | stone-700 — parameters         |
| `--hljs-tag`             | `#0d9488` | teal-600 — HTML tags           |
| `--hljs-name`            | `#0d9488` | teal-600 — XML/JSX names       |
| `--hljs-comment`         | `#78716c` | stone-500 — comments           |
| `--hljs-punctuation`     | `#78716c` | stone-500 — punctuation        |
| `--hljs-operator`        | `#78716c` | stone-500 — operators          |
| `--hljs-meta`            | `#78716c` | stone-500 — meta tokens        |

### Grove — dark mode hljs

| Token                    | Value / hex           |
| ------------------------ | --------------------- |
| `--hljs-base-text`       | `var(--stone-300)` = `#d6d3d1` |
| `--hljs-base-bg`         | `var(--stone-800)` = `#292524` |
| `--hljs-keyword`         | `#a78bfa` (violet-400) |
| `--hljs-title`           | `#34d399` (emerald-400) |
| `--hljs-title-class`     | `#34d399` |
| `--hljs-title-function`  | `#34d399` |
| `--hljs-string`          | `#fbbf24` (amber-400)  |
| `--hljs-number`          | `#22d3ee` (cyan-400)   |
| `--hljs-literal`         | `#a78bfa` |
| `--hljs-regexp`          | `#f472b6` (rose-400)   |
| `--hljs-type`            | `#fb923c` (orange-400) |
| `--hljs-built-in`        | `#22d3ee` |
| `--hljs-class`           | `#34d399` |
| `--hljs-attr`            | `#22d3ee` |
| `--hljs-variable`        | `#fbbf24` |
| `--hljs-property`        | `#38bdf8` (sky-400)    |
| `--hljs-params`          | `var(--stone-300)` = `#d6d3d1` |
| `--hljs-tag`             | `#2dd4bf` (teal-400)   |
| `--hljs-name`            | `#2dd4bf` |
| `--hljs-comment`         | `#78716c` (stone-500)  |
| `--hljs-punctuation`     | `var(--stone-400)` = `#a8a29e` |
| `--hljs-operator`        | `var(--stone-400)` = `#a8a29e` |
| `--hljs-meta`            | `var(--stone-400)` = `#a8a29e` |

### Classic Blue — light mode hljs

| Token                    | Hex       |
| ------------------------ | --------- |
| `--hljs-base-text`       | `#334155` (slate-700) |
| `--hljs-base-bg`         | `#f1f5f9` (slate-100) |
| `--hljs-keyword`         | `#7c3aed` (violet-600) |
| `--hljs-title`           | `#2563eb` (blue-600)   |
| `--hljs-title-class`     | `#0284c7` (sky-600)    |
| `--hljs-title-function`  | `#2563eb` |
| `--hljs-string`          | `#0d9488` (teal-600)   |
| `--hljs-number`          | `#2563eb` |
| `--hljs-literal`         | `#7c3aed` |
| `--hljs-regexp`          | `#db2777` |
| `--hljs-type`            | `#c2410c` |
| `--hljs-built-in`        | `#0891b2` |
| `--hljs-class`           | `#0284c7` |
| `--hljs-attr`            | `#0891b2` |
| `--hljs-variable`        | `#b45309` |
| `--hljs-property`        | `#0369a1` |
| `--hljs-params`          | `#334155` |
| `--hljs-tag`             | `#059669` (emerald-600) |
| `--hljs-name`            | `#059669` |
| `--hljs-comment`         | `#94a3b8` (slate-400)  |
| `--hljs-punctuation`     | `#64748b` (slate-500)  |
| `--hljs-operator`        | `#64748b` |
| `--hljs-meta`            | `#64748b` |

### Classic Blue — dark mode hljs

| Token                    | Hex       |
| ------------------------ | --------- |
| `--hljs-base-text`       | `#cbd5e1` (slate-300) |
| `--hljs-base-bg`         | `#1e293b` (slate-800) |
| `--hljs-keyword`         | `#a78bfa` (violet-400) |
| `--hljs-title`           | `#60a5fa` (blue-400)   |
| `--hljs-title-class`     | `#38bdf8` (sky-400)    |
| `--hljs-title-function`  | `#60a5fa` |
| `--hljs-string`          | `#86efac` (green-400)  |
| `--hljs-number`          | `#60a5fa` |
| `--hljs-literal`         | `#a78bfa` |
| `--hljs-regexp`          | `#f472b6` |
| `--hljs-type`            | `#fb923c` |
| `--hljs-built-in`        | `#22d3ee` |
| `--hljs-class`           | `#38bdf8` |
| `--hljs-attr`            | `#22d3ee` |
| `--hljs-variable`        | `#fbbf24` |
| `--hljs-property`        | `#7dd3fc` (sky-300)    |
| `--hljs-params`          | `#cbd5e1` |
| `--hljs-tag`             | `#34d399` (emerald-400) |
| `--hljs-name`            | `#34d399` |
| `--hljs-comment`         | `#64748b` |
| `--hljs-punctuation`     | `#94a3b8` |
| `--hljs-operator`        | `#94a3b8` |
| `--hljs-meta`            | `#94a3b8` |

### Additional hljs tokens

The stylesheet also references a handful of tokens that don't have explicit theme assignments — they fall through to their upstream defaults or are covered by the base text color: `--hljs-doctag`, `--hljs-formula`, `--hljs-section`, `--hljs-symbol`, `--hljs-bullet`, `--hljs-link`, `--hljs-template-variable`, `--hljs-subst`, `--hljs-selector-tag`, `--hljs-selector-class`, `--hljs-selector-id`, `--hljs-selector-attr`, `--hljs-selector-pseudo`, `--hljs-addition`, `--hljs-deletion`, `--hljs-addition-bg`, `--hljs-deletion-bg`, `--hljs-emphasis`, `--hljs-strong`.

If a specific language highlights oddly in a theme, define the missing token under both themes' light and dark blocks.

---

## Legacy aliases

`_tokens.scss` exposes two forwarders for pre-rebrand code:

```css
--color-text:           var(--color-text-primary);
--color-text-tertiary:  var(--color-text-muted);
```

Use the canonical names in new code. The aliases are a convenience so old component CSS keeps compiling — they're not the intended API.

---

## Choosing colors for new components

A short checklist when adding a component:

1. **Start from semantic tokens.** Every `color`, `background`, `border-color` should be a `var(--color-*)` lookup.
2. **Don't reach for primitives.** `var(--stone-500)` ties your component to one theme. `var(--color-text-muted)` works everywhere.
3. **Don't inline hex.** `#64748b` breaks both themes at once.
4. **If you need a shade that doesn't exist**, add a new semantic token. Then add it to **all four** theme × mode blocks (Grove light, Grove dark, Classic Blue light, Classic Blue dark). A missing token falls through to `undefined`, not to a sane default.
5. **If it affects printing**, add a print override in `_base.scss` under `@media print html[data-mode="dark"]`.
6. **Focus rings** use `--color-border-focus`. **Active nav items** use `--color-bg-active-item`. **Modal backdrops** use `--color-bg-backdrop`. Don't invent parallel overlays.
7. **Status** (success, warning, error, info) uses the four status token families. Don't pick fresh red/green hex values for one component.
