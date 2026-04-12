# Grove

A **local markdown wiki for any folder** — point it at `~/notes`
or a repo's `docs/`, and get a browseable Angular SPA with live
markdown rendering, syntax highlighting, math, diagrams, and media
previews. All static, no database, no cloud.

> This wiki is Grove rendering its own docs. Everything you see
> here — the sidebar, the code blocks, the table rendering, the
> link resolution — is exactly what you get when you run
> `npx grovemd ~/notes` on your own machine.

## What's here

- [Getting started](./getting-started.md) — install, first run, CLI options
- [Usage](./usage.md) — day-to-day guide: features, keybindings, gotchas
- [How it works](./how-it-works.md) — the CLI → Express → Angular flow
- [Use Grove for your own wiki](./wiki-for-other-repos.md) — drop Grove
  into any GitHub repo in ten lines of YAML
- [Contributing](./contributing.md) — clone, build, PR checklist
- [Architecture reference](./ARCHITECTURE.md) — low-level diagram + source
  root layout

## Highlights

- **Markdown + GFM** — tables, task lists, strikethrough, footnotes
- **Syntax highlighting** via highlight.js (190+ languages)
- **Math** via KaTeX (`$inline$`, `$$block$$`)
- **Diagrams** via Mermaid
- **Media previews** — images, video, audio, pdf, svg
- **Anchor navigation** — fragment-based scrolling between headings
- **Internal links** — relative markdown links route through the SPA

Grove is [open source (MIT)](https://github.com/MorizMensi/grove)
and published on npm as
[`grovemd`](https://www.npmjs.com/package/grovemd). The installed
CLI is named `grove`.
