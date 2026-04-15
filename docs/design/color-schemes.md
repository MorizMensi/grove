# Color schemes

**The complete color reference for Grove.** Every primitive palette, every semantic token, every theme × mode combination, every syntax highlighting shade, and the print-mode coercion table. This is a lookup doc — read top-to-bottom once to understand the shape of the system, then use the table of contents to jump to specific values.

For the *why* behind these choices — the architecture, the rules for adding new tokens, the rationale for multi-theme — see [styleguide.md](./styleguide.md). For spacing, radius, typography, and motion metrics, see [spacing.md](./spacing.md).

---

## How themes work

Grove uses two HTML attributes on `<html>` to select a theme:

```html
<html data-theme="grove" data-mode="light">
```

| Attribute    | Values                                                                                | Effect                               |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------ |
| `data-theme` | `grove`, `classic-blue`, `blossom`, `saffron`, `iris`, `ember`, `cove`                | Picks the palette (hues + neutrals). |
| `data-mode`  | `light`, `dark`                                                                       | Picks the brightness inversion.      |

Semantic tokens are defined under compound selectors — one `[data-theme="<name>"][data-mode="light"]` block and one `[data-theme="<name>"][data-mode="dark"]` block per theme. With seven palettes × two modes, there are **fourteen configurations total**. Switching themes is instant and requires no component CSS change because every component reads from semantic tokens only.

- **Grove** (default) — emerald primary on warm stone neutrals. Source: `frontend/src/styles/themes/_grove.scss`.
- **Classic Blue** (legacy) — blue primary on cool slate neutrals. Preserved as an opt-in theme after the rebrand. Source: `frontend/src/styles/themes/_classic-blue.scss`.
- **Blossom** — rose primary on pink-tinted mauve neutrals. Soft, editorial. Error state uses pure red for semantic distinction. Source: `frontend/src/styles/themes/_blossom.scss`.
- **Saffron** — amber primary on yellow-tinted sand neutrals. Kindle-sepia warmth. Warning state overrides to orange to avoid conflation with the accent. Source: `frontend/src/styles/themes/_saffron.scss`.
- **Iris** — violet primary on deliberately-untinted zinc neutrals. Catppuccin/Dracula purple-pastel energy. Source: `frontend/src/styles/themes/_iris.scss`.
- **Ember** — orange primary on true-neutral gray. Monokai/Ayu warmth elevated to primary accent status. Source: `frontend/src/styles/themes/_ember.scss`.
- **Cove** — teal primary on green-tinted sage neutrals. Nord-arctic calm. Info state overrides to indigo to separate info from the teal accent. Source: `frontend/src/styles/themes/_cove.scss`.

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

  ### Mauve (used by Blossom neutrals)

  | Token           | Hex       | Token           | Hex       |
  | --------------- | --------- | --------------- | --------- |
  | `--mauve-50`    | `#FDF8FD` | `--mauve-500`   | `#B9B4BB` |
  | `--mauve-100`   | `#F9F4F9` | `--mauve-600`   | `#8E8A93` |
  | `--mauve-200`   | `#F1EDF1` | `--mauve-700`   | `#6F6B76` |
  | `--mauve-300`   | `#E8E3E8` | `--mauve-800`   | `#4A4650` |
  | `--mauve-400`   | `#D5D0D6` | `--mauve-900`   | `#1F1B25` |
  |                 |           | `--mauve-950`   | `#110E17` |

  Note: Mauve has a dark-mode cascade — see `:root[data-mode="dark"]` in `_tokens.scss` for the dark-mode values.

  ### Rose (used by Blossom accents)

  | Token          | Hex       | Token          | Hex       |
  | -------------- | --------- | -------------- | --------- |
  | `--rose-50`    | `#FFF1F2` | `--rose-500`   | `#F43F5E` |
  | `--rose-100`   | `#FFE4E6` | `--rose-600`   | `#E11D48` |
  | `--rose-200`   | `#FECDD3` | `--rose-700`   | `#BE123C` |
  | `--rose-300`   | `#FDA4AF` | `--rose-800`   | `#9F1239` |
  | `--rose-400`   | `#FB7185` | `--rose-900`   | `#881337` |
  |                |           | `--rose-950`   | `#4C0519` |

  ### Amber (used by Saffron accents)

  | Token          | Hex       | Token          | Hex       |
  | -------------- | --------- | -------------- | --------- |
  | `--amber-50`   | `#FFFBEB` | `--amber-500`  | `#F59E0B` |
  | `--amber-100`  | `#FEF3C7` | `--amber-600`  | `#D97706` |
  | `--amber-200`  | `#FDE68A` | `--amber-700`  | `#B45309` |
  | `--amber-300`  | `#FCD34D` | `--amber-800`  | `#92400E` |
  | `--amber-400`  | `#FBBF24` | `--amber-900`  | `#78350F` |
  |                |           | `--amber-950`  | `#451A03` |

  ### Sand (used by Saffron neutrals)

  | Token          | Hex       | Token          | Hex       |
  | -------------- | --------- | -------------- | --------- |
  | `--sand-50`    | `#FDFDFB` | `--sand-500`   | `#B8B5AE` |
  | `--sand-100`   | `#F9F8F5` | `--sand-600`   | `#8D8A84` |
  | `--sand-200`   | `#F2F0ED` | `--sand-700`   | `#6E6C66` |
  | `--sand-300`   | `#E9E7E2` | `--sand-800`   | `#49473F` |
  | `--sand-400`   | `#D6D3CC` | `--sand-900`   | `#1D1C18` |
  |                |           | `--sand-950`   | `#0E0E0C` |

  Note: Sand has a dark-mode cascade — see `:root[data-mode="dark"]` in `_tokens.scss` for the dark-mode values.

  ### Violet (used by Iris accents)

  | Token            | Hex       | Token            | Hex       |
  | ---------------- | --------- | ---------------- | --------- |
  | `--violet-50`    | `#F5F3FF` | `--violet-500`   | `#8B5CF6` |
  | `--violet-100`   | `#EDE9FE` | `--violet-600`   | `#7C3AED` |
  | `--violet-200`   | `#DDD6FE` | `--violet-700`   | `#6D28D9` |
  | `--violet-300`   | `#C4B5FD` | `--violet-800`   | `#5B21B6` |
  | `--violet-400`   | `#A78BFA` | `--violet-900`   | `#4C1D95` |
  |                  |           | `--violet-950`   | `#2E1065` |

  ### Zinc (used by Iris neutrals)

  | Token           | Hex       | Token           | Hex       |
  | --------------- | --------- | --------------- | --------- |
  | `--zinc-50`     | `#FAFAFA` | `--zinc-500`    | `#71717A` |
  | `--zinc-100`    | `#F4F4F5` | `--zinc-600`    | `#52525B` |
  | `--zinc-200`    | `#E4E4E7` | `--zinc-700`    | `#3F3F46` |
  | `--zinc-300`    | `#D4D4D8` | `--zinc-800`    | `#27272A` |
  | `--zinc-400`    | `#A1A1AA` | `--zinc-900`    | `#18181B` |
  |                 |           | `--zinc-950`    | `#09090B` |

  ### Orange (used by Ember accents)

  | Token            | Hex       | Token            | Hex       |
  | ---------------- | --------- | ---------------- | --------- |
  | `--orange-50`    | `#FFF7ED` | `--orange-500`   | `#F97316` |
  | `--orange-100`   | `#FFEDD5` | `--orange-600`   | `#EA580C` |
  | `--orange-200`   | `#FED7AA` | `--orange-700`   | `#C2410C` |
  | `--orange-300`   | `#FDBA74` | `--orange-800`   | `#9A3412` |
  | `--orange-400`   | `#FB923C` | `--orange-900`   | `#7C2D12` |
  |                  |           | `--orange-950`   | `#431407` |

  ### Neutral (used by Ember neutrals)

  | Token              | Hex       | Token              | Hex       |
  | ------------------ | --------- | ------------------ | --------- |
  | `--neutral-50`     | `#FAFAFA` | `--neutral-500`    | `#737373` |
  | `--neutral-100`    | `#F5F5F5` | `--neutral-600`    | `#525252` |
  | `--neutral-200`    | `#E5E5E5` | `--neutral-700`    | `#404040` |
  | `--neutral-300`    | `#D4D4D4` | `--neutral-800`    | `#262626` |
  | `--neutral-400`    | `#A3A3A3` | `--neutral-900`    | `#171717` |
  |                    |           | `--neutral-950`    | `#0A0A0A` |

  ### Teal (used by Cove accents)

  | Token          | Hex       | Token          | Hex       |
  | -------------- | --------- | -------------- | --------- |
  | `--teal-50`    | `#F0FDFA` | `--teal-500`   | `#14B8A6` |
  | `--teal-100`   | `#CCFBF1` | `--teal-600`   | `#0D9488` |
  | `--teal-200`   | `#99F6E4` | `--teal-700`   | `#0F766E` |
  | `--teal-300`   | `#5EEAD4` | `--teal-800`   | `#115E59` |
  | `--teal-400`   | `#2DD4BF` | `--teal-900`   | `#134E4A` |
  |                |           | `--teal-950`   | `#042F2E` |

  ### Sage (used by Cove neutrals)

  | Token          | Hex       | Token          | Hex       |
  | -------------- | --------- | -------------- | --------- |
  | `--sage-50`    | `#FBFDFC` | `--sage-500`   | `#A0A5A2` |
  | `--sage-100`   | `#F7F9F8` | `--sage-600`   | `#7C847F` |
  | `--sage-200`   | `#EFF1F0` | `--sage-700`   | `#5F6563` |
  | `--sage-300`   | `#E0E3E1` | `--sage-800`   | `#394139` |
  | `--sage-400`   | `#C2C6C3` | `--sage-900`   | `#141C18` |
  |                |           | `--sage-950`   | `#0A0F0D` |

  Note: Sage has a dark-mode cascade — see `:root[data-mode="dark"]` in `_tokens.scss` for the dark-mode values.

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

## Blossom theme (rose + mauve)

Cherry-blossom palette: rose accent on pink-tinted mauve neutrals. Error state uses pure red for semantic distinction from the accent.

### Blossom — light mode

Selector: `[data-theme="blossom"][data-mode="light"]`. Source: `frontend/src/styles/themes/_blossom.scss`.

**Backgrounds**

| Token                        | Resolves to           | Hex       |
| ---------------------------- | --------------------- | --------- |
| `--color-bg-page`            | `var(--mauve-50)`     | `#FDF8FD` |
| `--color-bg-surface`         | —                     | `#ffffff` |
| `--color-bg-inset`           | `var(--mauve-100)`    | `#F9F4F9` |
| `--color-bg-elevated`        | —                     | `#ffffff` |
| `--color-bg-emphasis`        | `var(--rose-600)`     | `#E11D48` |
| `--color-bg-code-block`      | `var(--mauve-100)`    | `#F9F4F9` |
| `--color-bg-code-inline`     | `var(--rose-50)`      | `#FFF1F2` |
| `--color-bg-table-header`    | `var(--mauve-50)`     | `#FDF8FD` |
| `--color-bg-table-stripe`    | `var(--mauve-50)`     | `#FDF8FD` |
| `--color-bg-blockquote`      | —                     | `transparent` |
| `--color-bg-hover`           | —                     | `rgba(0, 0, 0, 0.04)` |
| `--color-bg-sidebar`         | `var(--mauve-50)`     | `#FDF8FD` |

**Text**

| Token                         | Resolves to         | Hex       |
| ----------------------------- | ------------------- | --------- |
| `--color-text-primary`        | `var(--mauve-900)`  | `#1F1B25` |
| `--color-text-secondary`      | `var(--mauve-600)`  | `#8E8A93` |
| `--color-text-muted`          | `var(--mauve-500)`  | `#B9B4BB` |
| `--color-text-heading`        | `var(--mauve-800)`  | `#4A4650` |
| `--color-text-on-emphasis`    | —                   | `#ffffff` |
| `--color-text-link`           | `var(--rose-700)`   | `#BE123C` |
| `--color-text-link-hover`     | `var(--rose-900)`   | `#881337` |
| `--color-text-code`           | `var(--mauve-800)`  | `#4A4650` |
| `--color-text-code-inline`    | `var(--rose-800)`   | `#9F1239` |

**Borders**

| Token                          | Resolves to          | Hex       |
| ------------------------------ | -------------------- | --------- |
| `--color-border-default`       | `var(--mauve-200)`   | `#F1EDF1` |
| `--color-border-strong`        | `var(--mauve-300)`   | `#E8E3E8` |
| `--color-border-muted`         | `var(--mauve-100)`   | `#F9F4F9` |
| `--color-border-focus`         | `var(--rose-500)`    | `#F43F5E` |
| `--color-border-code-inline`   | `var(--rose-200)`    | `#FECDD3` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(244, 63, 94, 0.2)`        |
| `--color-link-underline`  | `rgba(190, 18, 60, 0.4)`        |
| `--color-bg-active-item`  | `rgba(244, 63, 94, 0.1)`        |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.4)`            |

### Blossom — dark mode

Selector: `[data-theme="blossom"][data-mode="dark"]`. Source: `frontend/src/styles/themes/_blossom.scss`.

Note: Mauve primitives cascade to their dark values via `:root[data-mode="dark"]`. `var(--mauve-50)` resolves to `#161618` in this block, not the light-mode `#FDF8FD`.

**Backgrounds**

| Token                        | Resolves to           | Hex / value              |
| ---------------------------- | --------------------- | ------------------------ |
| `--color-bg-page`            | `var(--mauve-50)`     | `#161618`                |
| `--color-bg-surface`         | `var(--mauve-200)`    | `#232326`                |
| `--color-bg-inset`           | `var(--mauve-50)`     | `#161618`                |
| `--color-bg-elevated`        | `var(--mauve-300)`    | `#2B2B2F`                |
| `--color-bg-emphasis`        | `var(--rose-500)`     | `#F43F5E`                |
| `--color-bg-code-block`      | `var(--mauve-200)`    | `#232326`                |
| `--color-bg-code-inline`     | `var(--mauve-300)`    | `#2B2B2F`                |
| `--color-bg-table-header`    | `var(--mauve-300)`    | `#2B2B2F`                |
| `--color-bg-table-stripe`    | —                     | `rgba(255, 255, 255, 0.03)` |
| `--color-bg-blockquote`      | —                     | `rgba(244, 63, 94, 0.08)`   |
| `--color-bg-hover`           | —                     | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-sidebar`         | `var(--mauve-100)`    | `#1C1C1F`                |

**Text**

| Token                         | Resolves to         | Hex       |
| ----------------------------- | ------------------- | --------- |
| `--color-text-primary`        | `var(--mauve-900)`  | `#DFDFE1` |
| `--color-text-secondary`      | `var(--mauve-700)`  | `#A09FA6` |
| `--color-text-muted`          | `var(--mauve-500)`  | `#504F57` |
| `--color-text-heading`        | `var(--mauve-950)`  | `#EDEDEF` |
| `--color-text-on-emphasis`    | —                   | `#ffffff` |
| `--color-text-link`           | `var(--rose-400)`   | `#FB7185` |
| `--color-text-link-hover`     | `var(--rose-300)`   | `#FDA4AF` |
| `--color-text-code`           | `var(--mauve-900)`  | `#DFDFE1` |
| `--color-text-code-inline`    | `var(--rose-300)`   | `#FDA4AF` |

**Borders**

| Token                          | Resolves to          | Hex / value               |
| ------------------------------ | -------------------- | ------------------------- |
| `--color-border-default`       | `var(--mauve-300)`   | `#2B2B2F`                 |
| `--color-border-strong`        | `var(--mauve-400)`   | `#3E3E44`                 |
| `--color-border-muted`         | `var(--mauve-200)`   | `#232326`                 |
| `--color-border-focus`         | `var(--rose-400)`    | `#FB7185`                 |
| `--color-border-code-inline`   | —                    | `rgba(244, 63, 94, 0.3)`  |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(244, 63, 94, 0.25)`       |
| `--color-link-underline`  | `rgba(244, 63, 94, 0.4)`        |
| `--color-bg-active-item`  | `rgba(244, 63, 94, 0.15)`       |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.6)`            |

**Shadows (dark-mode override)** — standard dark shadow stack (`0 1px 2px rgba(0,0,0,0.3)` / `0 4px 6px rgba(0,0,0,0.4)` / `0 10px 15px rgba(0,0,0,0.5)`). Same across all dark themes; see [Grove dark shadows](#grove--dark-mode) for the exact rule.

---

## Saffron theme (amber + sand)

Kindle-sepia warmth elevated with a gold accent. Warning state overrides to orange to avoid conflation with the amber accent.

### Saffron — light mode

Selector: `[data-theme="saffron"][data-mode="light"]`. Source: `frontend/src/styles/themes/_saffron.scss`.

**Backgrounds**

| Token                        | Resolves to          | Hex       |
| ---------------------------- | -------------------- | --------- |
| `--color-bg-page`            | `var(--sand-50)`     | `#FDFDFB` |
| `--color-bg-surface`         | —                    | `#ffffff` |
| `--color-bg-inset`           | `var(--sand-100)`    | `#F9F8F5` |
| `--color-bg-elevated`        | —                    | `#ffffff` |
| `--color-bg-emphasis`        | `var(--amber-700)`   | `#B45309` |
| `--color-bg-code-block`      | `var(--sand-100)`    | `#F9F8F5` |
| `--color-bg-code-inline`     | `var(--amber-50)`    | `#FFFBEB` |
| `--color-bg-table-header`    | `var(--sand-50)`     | `#FDFDFB` |
| `--color-bg-table-stripe`    | `var(--sand-50)`     | `#FDFDFB` |
| `--color-bg-blockquote`      | —                    | `transparent` |
| `--color-bg-hover`           | —                    | `rgba(0, 0, 0, 0.04)` |
| `--color-bg-sidebar`         | `var(--sand-50)`     | `#FDFDFB` |

**Text**

| Token                         | Resolves to        | Hex       |
| ----------------------------- | ------------------ | --------- |
| `--color-text-primary`        | `var(--sand-900)`  | `#1D1C18` |
| `--color-text-secondary`      | `var(--sand-600)`  | `#8D8A84` |
| `--color-text-muted`          | `var(--sand-500)`  | `#B8B5AE` |
| `--color-text-heading`        | `var(--sand-800)`  | `#49473F` |
| `--color-text-on-emphasis`    | —                  | `#ffffff` |
| `--color-text-link`           | `var(--amber-700)` | `#B45309` |
| `--color-text-link-hover`     | `var(--amber-900)` | `#78350F` |
| `--color-text-code`           | `var(--sand-800)`  | `#49473F` |
| `--color-text-code-inline`    | `var(--amber-800)` | `#92400E` |

**Borders**

| Token                          | Resolves to         | Hex       |
| ------------------------------ | ------------------- | --------- |
| `--color-border-default`       | `var(--sand-200)`   | `#F2F0ED` |
| `--color-border-strong`        | `var(--sand-300)`   | `#E9E7E2` |
| `--color-border-muted`         | `var(--sand-100)`   | `#F9F8F5` |
| `--color-border-focus`         | `var(--amber-600)`  | `#D97706` |
| `--color-border-code-inline`   | `var(--amber-200)`  | `#FDE68A` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(217, 119, 6, 0.2)`        |
| `--color-link-underline`  | `rgba(180, 83, 9, 0.4)`         |
| `--color-bg-active-item`  | `rgba(217, 119, 6, 0.1)`        |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.4)`            |

### Saffron — dark mode

Selector: `[data-theme="saffron"][data-mode="dark"]`. Source: `frontend/src/styles/themes/_saffron.scss`.

Note: Sand primitives cascade to their dark values via `:root[data-mode="dark"]`. `var(--sand-50)` resolves to `#161615` here.

**Backgrounds**

| Token                        | Resolves to          | Hex / value              |
| ---------------------------- | -------------------- | ------------------------ |
| `--color-bg-page`            | `var(--sand-50)`     | `#161615`                |
| `--color-bg-surface`         | `var(--sand-200)`    | `#232320`                |
| `--color-bg-inset`           | `var(--sand-50)`     | `#161615`                |
| `--color-bg-elevated`        | `var(--sand-300)`    | `#2B2B27`                |
| `--color-bg-emphasis`        | `var(--amber-500)`   | `#F59E0B`                |
| `--color-bg-code-block`      | `var(--sand-200)`    | `#232320`                |
| `--color-bg-code-inline`     | `var(--sand-300)`    | `#2B2B27`                |
| `--color-bg-table-header`    | `var(--sand-300)`    | `#2B2B27`                |
| `--color-bg-table-stripe`    | —                    | `rgba(255, 255, 255, 0.03)` |
| `--color-bg-blockquote`      | —                    | `rgba(251, 191, 36, 0.08)`  |
| `--color-bg-hover`           | —                    | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-sidebar`         | `var(--sand-100)`    | `#1C1C1A`                |

**Text**

| Token                         | Resolves to        | Hex       |
| ----------------------------- | ------------------ | --------- |
| `--color-text-primary`        | `var(--sand-900)`  | `#DCDCD8` |
| `--color-text-secondary`      | `var(--sand-700)`  | `#A1A09A` |
| `--color-text-muted`          | `var(--sand-500)`  | `#51504B` |
| `--color-text-heading`        | `var(--sand-950)`  | `#EDEDEC` |
| `--color-text-on-emphasis`    | —                  | `#ffffff` |
| `--color-text-link`           | `var(--amber-400)` | `#FBBF24` |
| `--color-text-link-hover`     | `var(--amber-300)` | `#FCD34D` |
| `--color-text-code`           | `var(--sand-900)`  | `#DCDCD8` |
| `--color-text-code-inline`    | `var(--amber-300)` | `#FCD34D` |

**Borders**

| Token                          | Resolves to         | Hex / value               |
| ------------------------------ | ------------------- | ------------------------- |
| `--color-border-default`       | `var(--sand-300)`   | `#2B2B27`                 |
| `--color-border-strong`        | `var(--sand-400)`   | `#3E3E3A`                 |
| `--color-border-muted`         | `var(--sand-200)`   | `#232320`                 |
| `--color-border-focus`         | `var(--amber-400)`  | `#FBBF24`                 |
| `--color-border-code-inline`   | —                   | `rgba(251, 191, 36, 0.3)` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(251, 191, 36, 0.25)`      |
| `--color-link-underline`  | `rgba(251, 191, 36, 0.4)`       |
| `--color-bg-active-item`  | `rgba(251, 191, 36, 0.15)`      |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.6)`            |

**Shadows (dark-mode override)** — same standard dark shadow stack as other themes.

---

## Iris theme (violet + zinc)

Violet accent on deliberately untinted zinc neutrals. Zinc is symmetric — dark mode references `var(--zinc-900)` directly rather than using a cascade (Grove-style with stone).

### Iris — light mode

Selector: `[data-theme="iris"][data-mode="light"]`. Source: `frontend/src/styles/themes/_iris.scss`.

**Backgrounds**

| Token                        | Resolves to          | Hex       |
| ---------------------------- | -------------------- | --------- |
| `--color-bg-page`            | `var(--zinc-50)`     | `#FAFAFA` |
| `--color-bg-surface`         | —                    | `#ffffff` |
| `--color-bg-inset`           | `var(--zinc-100)`    | `#F4F4F5` |
| `--color-bg-elevated`        | —                    | `#ffffff` |
| `--color-bg-emphasis`        | `var(--violet-600)`  | `#7C3AED` |
| `--color-bg-code-block`      | `var(--zinc-100)`    | `#F4F4F5` |
| `--color-bg-code-inline`     | `var(--violet-50)`   | `#F5F3FF` |
| `--color-bg-table-header`    | `var(--zinc-50)`     | `#FAFAFA` |
| `--color-bg-table-stripe`    | `var(--zinc-50)`     | `#FAFAFA` |
| `--color-bg-blockquote`      | —                    | `transparent` |
| `--color-bg-hover`           | —                    | `rgba(0, 0, 0, 0.04)` |
| `--color-bg-sidebar`         | `var(--zinc-50)`     | `#FAFAFA` |

**Text**

| Token                         | Resolves to         | Hex       |
| ----------------------------- | ------------------- | --------- |
| `--color-text-primary`        | `var(--zinc-900)`   | `#18181B` |
| `--color-text-secondary`      | `var(--zinc-600)`   | `#52525B` |
| `--color-text-muted`          | `var(--zinc-500)`   | `#71717A` |
| `--color-text-heading`        | `var(--zinc-800)`   | `#27272A` |
| `--color-text-on-emphasis`    | —                   | `#ffffff` |
| `--color-text-link`           | `var(--violet-700)` | `#6D28D9` |
| `--color-text-link-hover`     | `var(--violet-900)` | `#4C1D95` |
| `--color-text-code`           | `var(--zinc-800)`   | `#27272A` |
| `--color-text-code-inline`    | `var(--violet-800)` | `#5B21B6` |

**Borders**

| Token                          | Resolves to          | Hex       |
| ------------------------------ | -------------------- | --------- |
| `--color-border-default`       | `var(--zinc-200)`    | `#E4E4E7` |
| `--color-border-strong`        | `var(--zinc-300)`    | `#D4D4D8` |
| `--color-border-muted`         | `var(--zinc-100)`    | `#F4F4F5` |
| `--color-border-focus`         | `var(--violet-500)`  | `#8B5CF6` |
| `--color-border-code-inline`   | `var(--violet-200)`  | `#DDD6FE` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(139, 92, 246, 0.2)`       |
| `--color-link-underline`  | `rgba(109, 40, 217, 0.4)`       |
| `--color-bg-active-item`  | `rgba(139, 92, 246, 0.1)`       |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.4)`            |

### Iris — dark mode

Selector: `[data-theme="iris"][data-mode="dark"]`. Source: `frontend/src/styles/themes/_iris.scss`.

**Backgrounds**

| Token                        | Resolves to          | Hex / value              |
| ---------------------------- | -------------------- | ------------------------ |
| `--color-bg-page`            | `var(--zinc-900)`    | `#18181B`                |
| `--color-bg-surface`         | `var(--zinc-800)`    | `#27272A`                |
| `--color-bg-inset`           | `var(--zinc-950)`    | `#09090B`                |
| `--color-bg-elevated`        | `var(--zinc-700)`    | `#3F3F46`                |
| `--color-bg-emphasis`        | `var(--violet-500)`  | `#8B5CF6`                |
| `--color-bg-code-block`      | `var(--zinc-800)`    | `#27272A`                |
| `--color-bg-code-inline`     | `var(--zinc-700)`    | `#3F3F46`                |
| `--color-bg-table-header`    | `var(--zinc-700)`    | `#3F3F46`                |
| `--color-bg-table-stripe`    | —                    | `rgba(255, 255, 255, 0.03)` |
| `--color-bg-blockquote`      | —                    | `rgba(167, 139, 250, 0.08)` |
| `--color-bg-hover`           | —                    | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-sidebar`         | `var(--zinc-900)`    | `#18181B`                |

**Text**

| Token                         | Resolves to         | Hex       |
| ----------------------------- | ------------------- | --------- |
| `--color-text-primary`        | `var(--zinc-200)`   | `#E4E4E7` |
| `--color-text-secondary`      | `var(--zinc-400)`   | `#A1A1AA` |
| `--color-text-muted`          | `var(--zinc-500)`   | `#71717A` |
| `--color-text-heading`        | `var(--zinc-100)`   | `#F4F4F5` |
| `--color-text-on-emphasis`    | —                   | `#ffffff` |
| `--color-text-link`           | `var(--violet-400)` | `#A78BFA` |
| `--color-text-link-hover`     | `var(--violet-300)` | `#C4B5FD` |
| `--color-text-code`           | `var(--zinc-200)`   | `#E4E4E7` |
| `--color-text-code-inline`    | `var(--violet-300)` | `#C4B5FD` |

**Borders**

| Token                          | Resolves to          | Hex / value                |
| ------------------------------ | -------------------- | -------------------------- |
| `--color-border-default`       | `var(--zinc-700)`    | `#3F3F46`                  |
| `--color-border-strong`        | `var(--zinc-600)`    | `#52525B`                  |
| `--color-border-muted`         | `var(--zinc-800)`    | `#27272A`                  |
| `--color-border-focus`         | `var(--violet-400)`  | `#A78BFA`                  |
| `--color-border-code-inline`   | —                    | `rgba(167, 139, 250, 0.3)` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(167, 139, 250, 0.25)`     |
| `--color-link-underline`  | `rgba(167, 139, 250, 0.4)`      |
| `--color-bg-active-item`  | `rgba(167, 139, 250, 0.15)`     |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.6)`            |

**Shadows (dark-mode override)** — same standard dark shadow stack as other themes.

---

## Ember theme (orange + neutral)

Orange elevated to primary accent against true-neutral gray. Neutral is symmetric — dark mode references `var(--neutral-950)` directly.

### Ember — light mode

Selector: `[data-theme="ember"][data-mode="light"]`. Source: `frontend/src/styles/themes/_ember.scss`.

**Backgrounds**

| Token                        | Resolves to           | Hex       |
| ---------------------------- | --------------------- | --------- |
| `--color-bg-page`            | `var(--neutral-50)`   | `#FAFAFA` |
| `--color-bg-surface`         | —                     | `#ffffff` |
| `--color-bg-inset`           | `var(--neutral-100)`  | `#F5F5F5` |
| `--color-bg-elevated`        | —                     | `#ffffff` |
| `--color-bg-emphasis`        | `var(--orange-600)`   | `#EA580C` |
| `--color-bg-code-block`      | `var(--neutral-100)`  | `#F5F5F5` |
| `--color-bg-code-inline`     | `var(--orange-50)`    | `#FFF7ED` |
| `--color-bg-table-header`    | `var(--neutral-50)`   | `#FAFAFA` |
| `--color-bg-table-stripe`    | `var(--neutral-50)`   | `#FAFAFA` |
| `--color-bg-blockquote`      | —                     | `transparent` |
| `--color-bg-hover`           | —                     | `rgba(0, 0, 0, 0.04)` |
| `--color-bg-sidebar`         | `var(--neutral-50)`   | `#FAFAFA` |

**Text**

| Token                         | Resolves to           | Hex       |
| ----------------------------- | --------------------- | --------- |
| `--color-text-primary`        | `var(--neutral-900)`  | `#171717` |
| `--color-text-secondary`      | `var(--neutral-600)`  | `#525252` |
| `--color-text-muted`          | `var(--neutral-500)`  | `#737373` |
| `--color-text-heading`        | `var(--neutral-800)`  | `#262626` |
| `--color-text-on-emphasis`    | —                     | `#ffffff` |
| `--color-text-link`           | `var(--orange-700)`   | `#C2410C` |
| `--color-text-link-hover`     | `var(--orange-900)`   | `#7C2D12` |
| `--color-text-code`           | `var(--neutral-800)`  | `#262626` |
| `--color-text-code-inline`    | `var(--orange-800)`   | `#9A3412` |

**Borders**

| Token                          | Resolves to            | Hex       |
| ------------------------------ | ---------------------- | --------- |
| `--color-border-default`       | `var(--neutral-200)`   | `#E5E5E5` |
| `--color-border-strong`        | `var(--neutral-300)`   | `#D4D4D4` |
| `--color-border-muted`         | `var(--neutral-100)`   | `#F5F5F5` |
| `--color-border-focus`         | `var(--orange-500)`    | `#F97316` |
| `--color-border-code-inline`   | `var(--orange-200)`    | `#FED7AA` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(249, 115, 22, 0.2)`       |
| `--color-link-underline`  | `rgba(194, 65, 12, 0.4)`        |
| `--color-bg-active-item`  | `rgba(249, 115, 22, 0.1)`       |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.4)`            |

### Ember — dark mode

Selector: `[data-theme="ember"][data-mode="dark"]`. Source: `frontend/src/styles/themes/_ember.scss`.

**Backgrounds**

| Token                        | Resolves to            | Hex / value              |
| ---------------------------- | ---------------------- | ------------------------ |
| `--color-bg-page`            | `var(--neutral-950)`   | `#0A0A0A`                |
| `--color-bg-surface`         | `var(--neutral-800)`   | `#262626`                |
| `--color-bg-inset`           | `var(--neutral-950)`   | `#0A0A0A`                |
| `--color-bg-elevated`        | `var(--neutral-700)`   | `#404040`                |
| `--color-bg-emphasis`        | `var(--orange-500)`    | `#F97316`                |
| `--color-bg-code-block`      | `var(--neutral-800)`   | `#262626`                |
| `--color-bg-code-inline`     | `var(--neutral-700)`   | `#404040`                |
| `--color-bg-table-header`    | `var(--neutral-700)`   | `#404040`                |
| `--color-bg-table-stripe`    | —                      | `rgba(255, 255, 255, 0.03)` |
| `--color-bg-blockquote`      | —                      | `rgba(251, 146, 60, 0.08)`  |
| `--color-bg-hover`           | —                      | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-sidebar`         | `var(--neutral-900)`   | `#171717`                |

**Text**

| Token                         | Resolves to           | Hex       |
| ----------------------------- | --------------------- | --------- |
| `--color-text-primary`        | `var(--neutral-200)`  | `#E5E5E5` |
| `--color-text-secondary`      | `var(--neutral-400)`  | `#A3A3A3` |
| `--color-text-muted`          | `var(--neutral-500)`  | `#737373` |
| `--color-text-heading`        | `var(--neutral-100)`  | `#F5F5F5` |
| `--color-text-on-emphasis`    | —                     | `#ffffff` |
| `--color-text-link`           | `var(--orange-400)`   | `#FB923C` |
| `--color-text-link-hover`     | `var(--orange-300)`   | `#FDBA74` |
| `--color-text-code`           | `var(--neutral-200)`  | `#E5E5E5` |
| `--color-text-code-inline`    | `var(--orange-300)`   | `#FDBA74` |

**Borders**

| Token                          | Resolves to            | Hex / value                |
| ------------------------------ | ---------------------- | -------------------------- |
| `--color-border-default`       | `var(--neutral-700)`   | `#404040`                  |
| `--color-border-strong`        | `var(--neutral-600)`   | `#525252`                  |
| `--color-border-muted`         | `var(--neutral-800)`   | `#262626`                  |
| `--color-border-focus`         | `var(--orange-400)`    | `#FB923C`                  |
| `--color-border-code-inline`   | —                      | `rgba(251, 146, 60, 0.3)`  |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(251, 146, 60, 0.25)`      |
| `--color-link-underline`  | `rgba(251, 146, 60, 0.4)`       |
| `--color-bg-active-item`  | `rgba(251, 146, 60, 0.15)`      |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.6)`            |

**Shadows (dark-mode override)** — same standard dark shadow stack as other themes.

---

## Cove theme (teal + sage)

Teal accent on green-tinted sage neutrals — the calm, oceanic space between emerald and blue. Info state overrides to indigo to separate it from the teal accent.

### Cove — light mode

Selector: `[data-theme="cove"][data-mode="light"]`. Source: `frontend/src/styles/themes/_cove.scss`.

**Backgrounds**

| Token                        | Resolves to          | Hex       |
| ---------------------------- | -------------------- | --------- |
| `--color-bg-page`            | `var(--sage-50)`     | `#FBFDFC` |
| `--color-bg-surface`         | —                    | `#ffffff` |
| `--color-bg-inset`           | `var(--sage-100)`    | `#F7F9F8` |
| `--color-bg-elevated`        | —                    | `#ffffff` |
| `--color-bg-emphasis`        | `var(--teal-600)`    | `#0D9488` |
| `--color-bg-code-block`      | `var(--sage-100)`    | `#F7F9F8` |
| `--color-bg-code-inline`     | `var(--teal-50)`     | `#F0FDFA` |
| `--color-bg-table-header`    | `var(--sage-50)`     | `#FBFDFC` |
| `--color-bg-table-stripe`    | `var(--sage-50)`     | `#FBFDFC` |
| `--color-bg-blockquote`      | —                    | `transparent` |
| `--color-bg-hover`           | —                    | `rgba(0, 0, 0, 0.04)` |
| `--color-bg-sidebar`         | `var(--sage-50)`     | `#FBFDFC` |

**Text**

| Token                         | Resolves to        | Hex       |
| ----------------------------- | ------------------ | --------- |
| `--color-text-primary`        | `var(--sage-900)`  | `#141C18` |
| `--color-text-secondary`      | `var(--sage-600)`  | `#7C847F` |
| `--color-text-muted`          | `var(--sage-500)`  | `#A0A5A2` |
| `--color-text-heading`        | `var(--sage-800)`  | `#394139` |
| `--color-text-on-emphasis`    | —                  | `#ffffff` |
| `--color-text-link`           | `var(--teal-700)`  | `#0F766E` |
| `--color-text-link-hover`     | `var(--teal-900)`  | `#134E4A` |
| `--color-text-code`           | `var(--sage-800)`  | `#394139` |
| `--color-text-code-inline`    | `var(--teal-800)`  | `#115E59` |

**Borders**

| Token                          | Resolves to        | Hex       |
| ------------------------------ | ------------------ | --------- |
| `--color-border-default`       | `var(--sage-200)`  | `#EFF1F0` |
| `--color-border-strong`        | `var(--sage-300)`  | `#E0E3E1` |
| `--color-border-muted`         | `var(--sage-100)`  | `#F7F9F8` |
| `--color-border-focus`         | `var(--teal-600)`  | `#0D9488` |
| `--color-border-code-inline`   | `var(--teal-200)`  | `#99F6E4` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(20, 184, 166, 0.2)`       |
| `--color-link-underline`  | `rgba(15, 118, 110, 0.4)`       |
| `--color-bg-active-item`  | `rgba(20, 184, 166, 0.1)`       |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.4)`            |

### Cove — dark mode

Selector: `[data-theme="cove"][data-mode="dark"]`. Source: `frontend/src/styles/themes/_cove.scss`.

Note: Sage primitives cascade to their dark values via `:root[data-mode="dark"]`. `var(--sage-50)` resolves to `#141716` here.

**Backgrounds**

| Token                        | Resolves to         | Hex / value              |
| ---------------------------- | ------------------- | ------------------------ |
| `--color-bg-page`            | `var(--sage-50)`    | `#141716`                |
| `--color-bg-surface`         | `var(--sage-200)`   | `#222623`                |
| `--color-bg-inset`           | `var(--sage-50)`    | `#141716`                |
| `--color-bg-elevated`        | `var(--sage-300)`   | `#2D312E`                |
| `--color-bg-emphasis`        | `var(--teal-500)`   | `#14B8A6`                |
| `--color-bg-code-block`      | `var(--sage-200)`   | `#222623`                |
| `--color-bg-code-inline`     | `var(--sage-300)`   | `#2D312E`                |
| `--color-bg-table-header`    | `var(--sage-300)`   | `#2D312E`                |
| `--color-bg-table-stripe`    | —                   | `rgba(255, 255, 255, 0.03)` |
| `--color-bg-blockquote`      | —                   | `rgba(45, 212, 191, 0.08)`  |
| `--color-bg-hover`           | —                   | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-sidebar`         | `var(--sage-100)`   | `#191D1B`                |

**Text**

| Token                         | Resolves to        | Hex       |
| ----------------------------- | ------------------ | --------- |
| `--color-text-primary`        | `var(--sage-900)`  | `#DAE0DD` |
| `--color-text-secondary`      | `var(--sage-700)`  | `#99A29E` |
| `--color-text-muted`          | `var(--sage-500)`  | `#4F5553` |
| `--color-text-heading`        | `var(--sage-950)`  | `#ECF0EE` |
| `--color-text-on-emphasis`    | —                  | `#ffffff` |
| `--color-text-link`           | `var(--teal-400)`  | `#2DD4BF` |
| `--color-text-link-hover`     | `var(--teal-300)`  | `#5EEAD4` |
| `--color-text-code`           | `var(--sage-900)`  | `#DAE0DD` |
| `--color-text-code-inline`    | `var(--teal-300)`  | `#5EEAD4` |

**Borders**

| Token                          | Resolves to        | Hex / value               |
| ------------------------------ | ------------------ | ------------------------- |
| `--color-border-default`       | `var(--sage-300)`  | `#2D312E`                 |
| `--color-border-strong`        | `var(--sage-400)`  | `#3B403D`                 |
| `--color-border-muted`         | `var(--sage-200)`  | `#222623`                 |
| `--color-border-focus`         | `var(--teal-400)`  | `#2DD4BF`                 |
| `--color-border-code-inline`   | —                  | `rgba(45, 212, 191, 0.3)` |

**Accent overlays**

| Token                     | Value                           |
| ------------------------- | ------------------------------- |
| `--color-focus-ring`      | `rgba(45, 212, 191, 0.25)`      |
| `--color-link-underline`  | `rgba(45, 212, 191, 0.4)`       |
| `--color-bg-active-item`  | `rgba(45, 212, 191, 0.15)`      |
| `--color-bg-backdrop`     | `rgba(0, 0, 0, 0.6)`            |

**Shadows (dark-mode override)** — same standard dark shadow stack as other themes.

---

## Status colors

Every theme defines the four status colors (success, warning, error, info) in both modes. In light mode they're flat Tailwind hex values. In dark mode they're `rgba(…)` overlays with semi-transparent fills so the tint picks up whatever dark background sits under them.

**Per-theme overrides** — three themes deliberately replace one status family to preserve semantic distinction from their accent:

| Theme   | Overridden status | Replacement  | Why |
| ------- | ----------------- | ------------ | --- |
| Blossom | `--color-error-*` | Pure Red     | Keeps "something went wrong" visually distinct from the rose accent. |
| Saffron | `--color-warning-*` | Orange primitives | Amber warning would blur with the amber accent — switch to orange (`#EA580C` family). |
| Cove    | `--color-info-*` | Indigo (raw hex) | Teal info would blur with the teal accent — switch to indigo (`#6366F1` family). |

Grove, Classic Blue, Iris, and Ember use the baseline status hues described below without overrides.

### Light mode (shared across themes)

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

Notes on the overrides in light mode:

- **Saffron** warning uses Orange primitives: `--color-warning-bg: var(--orange-50)` (`#FFF7ED`), `--color-warning-border: var(--orange-300)` (`#FDBA74`), `--color-warning-text: var(--orange-800)` (`#9A3412`), `--color-warning-icon: var(--orange-600)` (`#EA580C`).
- **Blossom** error keeps the same hex as other themes — the override is semantic, not chromatic. A load-bearing comment in `_blossom.scss` flags that this is deliberately NOT `rose`.

`--color-info-*` is theme-dependent in light mode (each theme tints info with its accent family):

| Token             | Grove        | Classic Blue | Blossom     | Saffron     | Iris         | Ember         | Cove (Indigo) |
| ----------------- | ------------ | ------------ | ----------- | ----------- | ------------ | ------------- | ------------- |
| `--color-info-bg`       | `#ecfdf5` (emerald-50) | `#eff6ff` (blue-50)  | `#FFF1F2` (rose-50)  | `#FFFBEB` (amber-50) | `#F5F3FF` (violet-50) | `#FFF7ED` (orange-50) | `#eef2ff` |
| `--color-info-border`   | `#6ee7b7` (emerald-300) | `#93c5fd` (blue-300) | `#FDA4AF` (rose-300) | `#FCD34D` (amber-300) | `#C4B5FD` (violet-300) | `#FDBA74` (orange-300) | `#c7d2fe` |
| `--color-info-text`     | `#065f46` (emerald-800) | `#1e40af` (blue-800) | `#9F1239` (rose-800) | `#92400E` (amber-800) | `#5B21B6` (violet-800) | `#9A3412` (orange-800) | `#3730a3` |
| `--color-info-icon`     | `#059669` (emerald-600) | `#2563eb` (blue-600) | `#E11D48` (rose-600) | `#D97706` (amber-600) | `#7C3AED` (violet-600) | `#EA580C` (orange-600) | `#6366f1` |

### Dark mode (shared across themes, with per-theme overrides)

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

Dark-mode overrides:

- **Saffron** warning dark: `--color-warning-bg: rgba(234, 88, 12, 0.15)`, `--color-warning-border: rgba(251, 146, 60, 0.4)`, `--color-warning-text: #fdba74` (orange-300), `--color-warning-icon: #fb923c` (orange-400).
- **Blossom** error dark: same translucent red as the baseline (the override is semantic only).

`--color-info-*` is theme-dependent in dark mode:

| Token                     | Grove dark                       | Classic Blue dark                | Blossom dark                     | Saffron dark                     | Iris dark                        | Ember dark                       | Cove dark (Indigo)              |
| ------------------------- | -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- | ------------------------------- |
| `--color-info-bg`         | `rgba(52, 211, 153, 0.15)`       | `rgba(96, 165, 250, 0.15)`       | `rgba(244, 63, 94, 0.15)`        | `rgba(251, 191, 36, 0.15)`       | `rgba(167, 139, 250, 0.15)`      | `rgba(251, 146, 60, 0.15)`       | `rgba(99, 102, 241, 0.15)`      |
| `--color-info-border`     | `rgba(52, 211, 153, 0.4)`        | `rgba(96, 165, 250, 0.4)`        | `rgba(244, 63, 94, 0.4)`         | `rgba(251, 191, 36, 0.4)`        | `rgba(167, 139, 250, 0.4)`       | `rgba(251, 146, 60, 0.4)`        | `rgba(129, 140, 248, 0.4)`      |
| `--color-info-text`       | `#6ee7b7` (emerald-300)          | `#93c5fd` (blue-300)             | `#FDA4AF` (rose-300)             | `#FCD34D` (amber-300)            | `#C4B5FD` (violet-300)           | `#FDBA74` (orange-300)           | `#a5b4fc` (indigo-300)          |
| `--color-info-icon`       | `#34d399` (emerald-400)          | `#60a5fa` (blue-400)             | `#FB7185` (rose-400)             | `#FBBF24` (amber-400)            | `#A78BFA` (violet-400)           | `#FB923C` (orange-400)           | `#818cf8` (indigo-400)          |

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

### hljs for Blossom, Saffron, Iris, Ember, Cove

Each new theme ships a hand-tuned hljs block following the same **deliberately non-accent** rule Grove uses: `keyword` and `string` tokens avoid the theme's accent family so that language keywords stay visually distinct from literal tags and names. For the full per-token list, read the `hljs` block inside each theme's source file — it's the section starting with the comment `/* Deliberately non-<accent> for keyword/string */`.

| Theme   | Accent family avoided in keyword/string | Keyword choice (light / dark) | String choice (light / dark) |
| ------- | ---------------------------------------- | ----------------------------- | ---------------------------- |
| Blossom | rose                                     | `#7c3aed` / `#a78bfa` (violet) | `#0d9488` / `#2dd4bf` (teal) |
| Saffron | amber / gold                             | `#7c3aed` / `#a78bfa` (violet) | `#0d9488` / `#2dd4bf` (teal) |
| Iris    | violet                                   | `#0d9488` / `#2dd4bf` (teal)   | `#b45309` / `#fbbf24` (amber) |
| Ember   | orange                                   | `#7c3aed` / `#a78bfa` (violet) | `#0d9488` / `#2dd4bf` (teal) |
| Cove    | teal                                     | `#7c3aed` / `#a78bfa` (violet) | `#b45309` / `#fbbf24` (amber) |

Each theme's **title** / **title-class** / **title-function** tokens use that theme's accent family at step 700 (light) and step 300 (dark) — e.g. Blossom light title is `var(--rose-700)` = `#BE123C`, Blossom dark title is `var(--rose-300)` = `#FDA4AF`. Comment and punctuation tokens use the theme's neutral family at step 500 for visual quietness that still meets 4.5:1 on the code background.

Sources:
- `frontend/src/styles/themes/_blossom.scss` (hljs blocks inside `[data-theme="blossom"][data-mode="light"]` and `...="dark"]`)
- `frontend/src/styles/themes/_saffron.scss`
- `frontend/src/styles/themes/_iris.scss`
- `frontend/src/styles/themes/_ember.scss`
- `frontend/src/styles/themes/_cove.scss`

### Additional hljs tokens

The stylesheet also references a handful of tokens that don't have explicit theme assignments — they fall through to their upstream defaults or are covered by the base text color: `--hljs-doctag`, `--hljs-formula`, `--hljs-section`, `--hljs-symbol`, `--hljs-bullet`, `--hljs-link`, `--hljs-template-variable`, `--hljs-subst`, `--hljs-selector-tag`, `--hljs-selector-class`, `--hljs-selector-id`, `--hljs-selector-attr`, `--hljs-selector-pseudo`, `--hljs-addition`, `--hljs-deletion`, `--hljs-addition-bg`, `--hljs-deletion-bg`, `--hljs-emphasis`, `--hljs-strong`.

If a specific language highlights oddly in a theme, define the missing token under every theme's light and dark blocks (or at least the affected one).

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
3. **Don't inline hex.** `#64748b` breaks every theme at once.
4. **If you need a shade that doesn't exist**, add a new semantic token. Then add it to **all fourteen** theme × mode blocks (Grove, Classic Blue, Blossom, Saffron, Iris, Ember, Cove × light, dark). A missing token falls through to `undefined`, not to a sane default.
5. **If it affects printing**, add a print override in `_base.scss` under `@media print html[data-mode="dark"]`.
6. **Focus rings** use `--color-border-focus`. **Active nav items** use `--color-bg-active-item`. **Modal backdrops** use `--color-bg-backdrop`. Don't invent parallel overlays.
7. **Status** (success, warning, error, info) uses the four status token families. Don't pick fresh red/green hex values for one component.
