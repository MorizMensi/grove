# Design system

Grove's visual design system: the colors, type, spacing, and
theming machinery behind every page. This directory is the single
home for anyone touching the look and feel — designers proposing a
new palette, developers wiring one up, or contributors auditing
tokens.

## At a glance

- **Seven themes** — Grove (emerald + stone), Classic Blue
  (blue + slate), Blossom (rose + mauve), Saffron (amber + sand),
  Iris (violet + zinc), Ember (orange + neutral), Cove (teal + sage).
- **Two modes + system** — light, dark, and a `system` selection
  that follows the OS `prefers-color-scheme` at runtime.
- **Token-driven** — semantic CSS custom properties assigned from a
  small set of primitive color scales.
- **Zero hardcoded colors** — components reference semantic tokens
  (`--color-bg-page`, `--color-text-link`) and never hex values.
- **AA-minimum contrast**, AAA for primary body text.

## Start here

| If you are a… | Start with |
|---|---|
| **Designer proposing a new palette** | [design-spec.md](./design-spec.md) |
| **Developer implementing a proposed palette** | [adding-a-theme.md](./adding-a-theme.md) |
| **Developer debugging the runtime** | [themes.md](./themes.md) |
| **Contributor styling a new component** | [styleguide.md](./styleguide.md) |

## Files in this section

- **[design-spec.md](./design-spec.md)** — **designer handoff.**
  Self-contained spec: what every semantic token means, accessibility
  constraints, and a fill-in-the-blank palette template. A designer
  can deliver a complete proposal without reading any source code.
- **[adding-a-theme.md](./adding-a-theme.md)** — **developer
  how-to.** Step-by-step walkthrough that turns a designer's
  filled template into a working theme: which files to edit, in
  what order, with before/after diffs.
- **[themes.md](./themes.md)** — **runtime architecture.** The
  `ThemeService` signals, `data-theme`/`data-mode` DOM attributes,
  `localStorage` persistence, and the boot-script that prevents
  FOUC.
- **[styleguide.md](./styleguide.md)** — **narrative reference.**
  Design principles, component styling conventions, typography
  decisions, and the rationale behind how rules cascade.
- **[color-schemes.md](./color-schemes.md)** — **full token value
  reference.** Every primitive scale, every semantic token, every
  theme × mode combination, and the complete `highlight.js` map.
- **[spacing.md](./spacing.md)** — **metric reference.** Spacing
  steps, radii, font sizes, shadows, motion durations, responsive
  breakpoints.
