# Grove

A **local markdown wiki for any folder** — point it at `~/notes`
or a repo's `docs/`, and get a browseable Angular SPA with live
markdown rendering, syntax highlighting, math, diagrams, and media
previews. All static, no database, no cloud.

> This wiki is Grove rendering its own docs. Everything you see
> here — the sidebar, the code blocks, the table rendering, the
> link resolution — is exactly what you get when you run
> `npx grovemd ~/notes` on your own machine.

## Documentation map

```mermaid
flowchart LR
  HOME[overview.md]:::home

  subgraph "Quick start"
    GS[getting-started.md]
    US[usage.md]
    HIW[how-it-works.md]
  end

  subgraph "Guides"
    GI[guides/overview.md]
    GT[guides/troubleshooting.md]
    GH[guides/self-hosting.md]
    GW[guides/wiki-deployment.md]
  end

  subgraph "Architecture"
    AI[architecture/overview.md]
    ASV[architecture/server.md]
    AFE[architecture/frontend.md]
    ADL[architecture/doclang.md]
    AWM[architecture/wiki-mode.md]
    ASE[architecture/security.md]
  end

  subgraph "Design"
    DI[design/overview.md]
    DTH[design/themes.md]
    DSG[design/styleguide.md]
    DCS[design/color-schemes.md]
    DSP[design/spacing.md]
    DSPEC[design/design-spec.md]
    DAT[design/adding-a-theme.md]
  end

  subgraph "Reference"
    RI[reference/overview.md]
    RCLI[reference/cli.md]
    RAPI[reference/http-api.md]
    RENV[reference/environment.md]
    RSCR[reference/scripts.md]
    RFT[reference/file-types.md]
    RTY[reference/types.md]
  end

  HOME --> GS & US & HIW
  HOME --> GI & AI & RI & DI
  HOME --> CON[contributing.md]
  HOME --> WIKI[wiki-for-other-repos.md]

  GI --> GT & GH & GW
  AI --> ASV & AFE & ADL & AWM & ASE
  RI --> RCLI & RAPI & RENV & RSCR & RFT & RTY
  DI --> DTH & DSG & DCS & DSP & DSPEC & DAT

  classDef home fill:#2f6b4a,stroke:#13331f,color:#fff;
```

## Start here

- **New user?** → [Getting started](./getting-started.md)
- **Day-to-day usage?** → [Usage guide](./usage.md)
- **Curious how it works?** → [How it works](./how-it-works.md)
- **Want to host Grove for your own repo?** →
  [Use Grove for your own wiki](./wiki-for-other-repos.md)
- **Contributing?** → [Contributing guide](./contributing.md)

## Deeper dives

- **[Architecture overview](./architecture/overview.md)** — layered
  tour of the server, frontend, DocLang renderer, wiki bundle,
  theme system, and security model.
- **[Reference](./reference/overview.md)** — mechanical reference for
  the CLI, HTTP API, environment variables, npm scripts, supported
  file types, and shared types.
- **[Guides](./guides/overview.md)** — troubleshooting, self-hosted
  deploys, and GitHub Pages wiki deployment.

## Design system

- **[Design overview](./design/overview.md)** — landing page for
  the theming and visual-design section
- **[Design spec](./design/design-spec.md)** — designer handoff:
  propose a new palette without reading code
- **[Adding a theme](./design/adding-a-theme.md)** — developer
  how-to for turning a palette proposal into a working theme
- **[Themes](./design/themes.md)** — runtime theme architecture
  (service, signals, DOM attributes, storage)
- **[Style guide](./design/styleguide.md)** — narrative reference
  for Grove's visual and structural design system
- **[Color schemes](./design/color-schemes.md)** — every palette,
  token, theme × mode combination, and syntax highlight shade
- **[Spacing, type, and motion](./design/spacing.md)** — spacing
  steps, radii, font sizes, shadows, durations, breakpoints

## Highlights

- **Markdown + GFM** — tables, task lists, strikethrough, footnotes
- **Syntax highlighting** via highlight.js (190+ languages) —
  see [reference/file-types](./reference/file-types.md)
- **Math** via KaTeX (`$inline$`, `$$block$$`) —
  see [architecture/doclang](./architecture/doclang.md)
- **Diagrams** via Mermaid —
  see [architecture/doclang](./architecture/doclang.md)
- **Media previews** — images, video, audio, pdf, svg —
  see [reference/file-types](./reference/file-types.md)
- **Anchor navigation** — GFM-style heading IDs, fragment scrolling —
  see [architecture/frontend](./architecture/frontend.md#anchor-navigation)
- **Internal links** — relative markdown links route through the SPA —
  see [architecture/doclang](./architecture/doclang.md#link-resolution)

Grove is [open source (MIT)](https://github.com/MorizMensi/grove)
and published on npm as
[`grovemd`](https://www.npmjs.com/package/grovemd). The installed
CLI is named `grove`.
