# Adding a theme — developer how-to

**Audience:** a developer (or an LLM agent) who has not worked on
Grove's theming before. You've been handed a filled palette
proposal (from [design-spec.md](./design-spec.md)) and now need
to turn it into a working theme.

**Estimate:** ~30 minutes for Form A (primitive scales),
~60 minutes for Form B (semantic tokens).

---

## 1. Prerequisites

- A **filled palette proposal** from
  [design-spec.md §8](./design-spec.md#8-deliverable-template).
  If the designer left unresolved notes, resolve them with the
  designer before touching code.
- Local dev environment:
  ```bash
  cd frontend && npx ng serve
  ```
  Grove's frontend is an Angular 19 app; the dev server watches
  SCSS and reloads on every save.
- A runnable Grove corpus — the repo's own `docs/` works fine.

Read [themes.md](./themes.md) once before starting if you haven't
— it's a short page on the runtime architecture. This doc assumes
you understand that the `<html>` element gets
`data-theme="<palette>"` and `data-mode="light|dark"` attributes
and that all styling cascades from those two CSS selectors.

---

## 2. File checklist

Eight files total for a new theme. Throughout this doc we'll use
the example name **`dusk`**.

| # | File | Change |
|---|---|---|
| 1 | `frontend/src/app/core/constants/theme.constants.ts` | Add `dusk` to the `PALETTES` tuple and to `PALETTE_LABELS`. |
| 2 | `frontend/src/styles/_tokens.scss` | *(Optional)* Add new primitive scales if the designer proposed colors that don't fit an existing scale. |
| 3 | `frontend/src/styles/themes/_dusk.scss` | **Create.** Defines every semantic token for `[data-theme="dusk"][data-mode="light"]` and `[data-theme="dusk"][data-mode="dark"]`. |
| 4 | `frontend/src/styles.scss` | Add `@use "./styles/themes/dusk";`. |
| 5 | `frontend/src/index.html` | Add `'dusk'` to the `validPalettes` array in the boot script. |
| 6 | `docs/design/color-schemes.md` | Add a new section documenting every token value for `dusk` light + dark. |
| 7 | `docs/design/overview.md` and `docs/design/themes.md` | Update "two themes" wording wherever it appears. |
| 8 | `docs/design/design-spec.md` | Add `dusk` to §7's "existing themes as reference" list for future designers. |

---

## 3. Step-by-step walkthrough

### Step 1 — Register the theme in TypeScript constants

**File:** `frontend/src/app/core/constants/theme.constants.ts`

```diff
- export const PALETTES = ['grove', 'classic-blue'] as const;
+ export const PALETTES = ['grove', 'classic-blue', 'dusk'] as const;
  export type Palette = typeof PALETTES[number];

  …

  export const PALETTE_LABELS: Record<Palette, string> = {
    grove: 'Grove',
    'classic-blue': 'Classic Blue',
+   dusk: 'Dusk',
  };
```

**Rationale:** The `PALETTES` tuple is the single source of truth
for valid palette names. `Palette` is a literal union derived from
it, so adding an entry automatically widens the type everywhere —
the `ThemeService` and the theme switcher pick it up for free. The
label drives the switcher's UI text.

**Gotcha:** `Record<Palette, string>` requires an entry for every
member. If you forget, TypeScript fails the build and tells you
exactly what's missing.

---

### Step 2 *(optional)* — Add primitive scales in `_tokens.scss`

**File:** `frontend/src/styles/_tokens.scss`

Only do this step if the designer proposed colors that don't fit
any existing primitive scale. Grove ships with `blue`, `slate`,
`emerald`, and `stone` ramps — if the designer picked, say, a
violet accent, add a new scale:

```diff
  /* Stone — used by Grove theme */
  --stone-50: #fafaf9;   --stone-100: #f5f5f4;   /* … */
  --stone-950: #0c0a09;

+ /* Violet — used by Dusk theme */
+ --violet-50:  #f5f3ff;  --violet-100: #ede9fe;  --violet-200: #ddd6fe;
+ --violet-300: #c4b5fd;  --violet-400: #a78bfa;  --violet-500: #8b5cf6;
+ --violet-600: #7c3aed;  --violet-700: #6d28d9;  --violet-800: #5b21b6;
+ --violet-900: #4c1d95;  --violet-950: #2e1065;
```

**Rationale:** Primitive scales are palette-agnostic. Putting them
in `_tokens.scss` means any future theme can reuse them without
having to redeclare.

**If the designer used Form B (semantic tokens with direct hex
values)**, you can skip this step entirely — just put the hex
values straight into the theme file.

---

### Step 3 — Create `frontend/src/styles/themes/_dusk.scss`

**File:** `frontend/src/styles/themes/_dusk.scss` **(new file)**

Copy `_grove.scss` as your template and replace values only. The
structure must match exactly — both modes, same token order, same
grouping comments — so future maintainers can diff across themes
cleanly.

```scss
/* ════════════════════════════════════════════════════════════════
   Grove – Dusk Theme (Violet + Stone)

   <Designer's description here — 1–3 sentences>
   ════════════════════════════════════════════════════════════════ */

/* ── Dusk Light ──────────────────────────────────────────────── */

[data-theme="dusk"][data-mode="light"] {
  color-scheme: light;

  /* ── Backgrounds ──────────────────────────────────────── */
  --color-bg-page: var(--stone-50);
  --color-bg-surface: #ffffff;
  /* … every background token … */

  /* ── Text ─────────────────────────────────────────────── */
  --color-text-primary: var(--stone-900);
  /* … every text token … */

  /* ── Borders ──────────────────────────────────────────── */
  /* … */

  /* ── Status ───────────────────────────────────────────── */
  /* … */

  /* ── Syntax highlighting (hljs) ───────────────────────── */
  /* … */

  /* ── Accent overlays ──────────────────────────────────── */
  /* … */
}

/* ── Dusk Dark ───────────────────────────────────────────────── */

[data-theme="dusk"][data-mode="dark"] {
  color-scheme: dark;

  /* same structure, dark-mode values */

  /* ── Shadows (deeper for dark backgrounds) ────────────── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

**Rationale:**

- `color-scheme: light|dark` tells the browser to render native
  form controls, scrollbars, and default backgrounds in the
  matching mode. Don't skip it.
- The selector `[data-theme="dusk"][data-mode="light"]` is
  **attribute-matched on `<html>`**, so every descendant inherits
  the CSS custom properties. No need to wrap component styles.
- The shadow override in dark mode exists because default
  shadows (`--shadow-sm` etc. in `_tokens.scss`) are tuned for
  light surfaces and become invisible on dark.
- Use `var(--violet-500)` etc. to reference primitive scales from
  Step 2 — that way a primitive-scale tweak applies across all
  themes that use it.

**If the designer used Form A**, the mapping from primitive
scales to semantic tokens is mechanical. Copy Grove's assignments
(e.g. `--color-bg-page: var(--stone-50);`) and swap the scale
name (`--color-bg-page: var(--stone-50);` stays if neutrals are
still stone; swap to `var(--<new-neutral>-50);` if not). For the
accent-based tokens (`--color-text-link`, `--color-border-focus`,
etc.), swap `emerald` → the new accent scale name.

---

### Step 4 — Import the theme in `styles.scss`

**File:** `frontend/src/styles.scss`

```diff
  @use "./styles/tokens";
  @use "./styles/themes/classic-blue";
  @use "./styles/themes/grove";
+ @use "./styles/themes/dusk";
  @use "./styles/base";
  @use "./styles/components";
```

**Rationale:** Import order matters — primitives first, theme
semantics next, then base and components that consume them. New
themes go in the theme block, before `base` and `components`.

**Gotcha:** SCSS `@use` is deduplicated; re-importing is free but
forgetting it entirely produces the "switcher shows Dusk but
colors don't change" bug (see
[§4 Troubleshooting](#4-troubleshooting)).

---

### Step 5 — Update the boot script in `index.html`

**File:** `frontend/src/index.html`

```diff
  (function () {
    var root = document.documentElement;
-   var validPalettes = ['grove', 'classic-blue'];
+   var validPalettes = ['grove', 'classic-blue', 'dusk'];
    var validModes = ['light', 'dark', 'system'];
```

**Rationale:** This inline script runs **before Angular boots** to
prevent FOUC (flash of unstyled content). It reads `localStorage`
and stamps the correct `data-theme`/`data-mode` attributes on
`<html>` immediately, so the browser paints the right palette on
first frame. If a stored value isn't in `validPalettes`, it's
rejected — so a new theme needs to be on the allow-list or users
who select it will bounce back to the default on reload.

**The comment at the top of the script is load-bearing** — it
says "Mirrors ThemeService resolution logic (if you touch one,
touch the other)". If you ever change how palette resolution
works in `theme.service.ts`, mirror it here too.

---

### Step 6 — Verify at runtime

From `frontend/`:

```bash
npx ng serve
```

Open the app (default `http://localhost:4200`) and walk through
this checklist:

1. Open the theme switcher popover. **Dusk** appears with the
   correct label.
2. Select **Dusk**.
3. Toggle **Light / Dark / System** — each mode renders distinct
   values.
4. Toggle your OS dark-mode setting while on `System`. The page
   should follow the OS preference live.
5. Reload. The theme persists (localStorage works).
6. Visit an article page and audit each surface:
   - Sidebar background and active item highlight
   - Article body (headings, links, prose)
   - Fenced code block + inline code
   - A markdown table with 3+ rows (header, stripes, borders)
   - A blockquote
   - A status callout (success/warning/error/info) — or inject
     one temporarily
   - The theme-switcher popover itself
7. Tab through the page — focus rings must be visible on both
   page and surface backgrounds.
8. Print preview (Cmd/Ctrl+P). Dark mode should auto-coerce to
   light colors.

---

### Step 7 — Run contrast checks

Use a contrast checker
([WebAIM](https://webaim.org/resources/contrastchecker/),
Stark, or the WCAG plugin of your choice). The critical pairs —
verify for **both** light and dark modes:

| Foreground | Background | Minimum |
|---|---|---|
| `--color-text-primary` | `--color-bg-page` | 7:1 (AAA) |
| `--color-text-primary` | `--color-bg-surface` | 7:1 (AAA) |
| `--color-text-secondary` | `--color-bg-surface` | 4.5:1 |
| `--color-text-link` | `--color-bg-page` | 4.5:1 |
| `--color-text-on-emphasis` | `--color-bg-emphasis` | 4.5:1 |
| `--color-border-focus` | `--color-bg-page` | 3:1 |
| `--color-border-focus` | `--color-bg-surface` | 3:1 |
| `--hljs-comment` | `--color-bg-code-block` | 4.5:1 |
| `--color-success-text` | `--color-success-bg` | 4.5:1 |
| `--color-warning-text` | `--color-warning-bg` | 4.5:1 |
| `--color-error-text` | `--color-error-bg` | 4.5:1 |
| `--color-info-text` | `--color-info-bg` | 4.5:1 |

If any pair fails, go back to the designer with the specific
pair + measured ratio — don't silently darken/lighten values on
your own.

---

### Step 8 — Update documentation

- **`docs/design/color-schemes.md`** — Add a new top-level
  section for the new palette, matching the structure of the
  existing Grove / Classic Blue entries. Include both light and
  dark tables and all `--hljs-*` values.
- **`docs/design/overview.md`** — Update "Two themes" to "Three
  themes" (or similar); add a bullet in the "At a glance" list.
- **`docs/design/themes.md`** — Update any wording about the
  number of palettes.
- **`docs/design/design-spec.md`** — Add a short paragraph in §7
  describing the new theme's motivation, so the next designer
  understands the design space that's already been filled.

---

## 4. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Switcher shows the new theme but colors don't change | Forgot the `@use` import in `styles.scss`, or the theme SCSS file has a syntax error — check the dev-server console. |
| Theme switches on click, but reload flashes the old theme (FOUC) | Forgot to add the palette name to `validPalettes` in `index.html`. The boot script rejects the stored value and falls back to the default. |
| Some components still show old colors | A component is using a hardcoded hex value or a wrong token name. Grep for `#[0-9a-fA-F]{3,6}` under `frontend/src/app` and fix any stragglers. |
| `localStorage` doesn't persist the selection | The `STORAGE_KEYS` values (`grove-theme`, `grove-mode`) were changed. These names are load-bearing because the boot script reads them directly — revert. |
| TypeScript build fails with `Property 'dusk' is missing` | You added the name to `PALETTES` but forgot to add it to `PALETTE_LABELS`. The `Record<Palette, string>` type requires all keys. |
| Dark mode looks fine but light mode is unreadable (or vice versa) | You copied one mode's values into the other. Re-verify each cell is independent. |
| Print output looks wrong on dark | Print stylesheet coerces dark → light, but saturated mid-tones can still print badly. Check that your light-mode background is near-white. |
| Focus ring invisible on dark pages | `--color-border-focus` doesn't meet 3:1 against `--color-bg-page` in dark mode. Bump the accent shade lighter. |

---

## 5. Code reference map

Where the theming system lives in the codebase:

| Area | File |
|---|---|
| Theme constants (names, storage keys, defaults) | `frontend/src/app/core/constants/theme.constants.ts` |
| Theme service (signals, DOM application, storage) | `frontend/src/app/core/services/theme.service.ts` |
| Theme switcher component | `frontend/src/app/shared/theme-switcher/` |
| Primitive tokens (color scales, spacing, motion) | `frontend/src/styles/_tokens.scss` |
| Semantic tokens per theme | `frontend/src/styles/themes/_*.scss` |
| Global stylesheet entry (import order) | `frontend/src/styles.scss` |
| Boot-time palette application (prevents FOUC) | `frontend/src/index.html` |
| Runtime architecture doc | [themes.md](./themes.md) |

---

## See also

- [design-spec.md](./design-spec.md) — the designer-facing spec
  (what you're implementing)
- [themes.md](./themes.md) — runtime architecture (how the
  cascade actually works)
- [color-schemes.md](./color-schemes.md) — full token value
  reference for current themes
- [styleguide.md](./styleguide.md) — design rationale to
  preserve while adding a theme
- [overview.md](./overview.md) — the design section landing page
