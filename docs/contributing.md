# Contributing

Grove is a small, focused project. The upstream repo is the
reference implementation and favors stability over breadth. If
you're thinking about a large change (especially anything on the
[roadmap](https://github.com/MorizMensi/grove#roadmap)), open an
issue first so we can agree on the scope.

## Clone + install + build

```bash
git clone https://github.com/MorizMensi/grove.git
cd grove
npm ci
(cd frontend && npm ci)
npm run build
node dist/server/bin/file-viewer.js ./docs
```

`npm run build` runs the Angular production build and then the
server tsc pass. Both must be green for a PR to merge.

For frontend-only watch-mode development:

```bash
cd frontend
npx ng build --configuration development --watch
```

## Project layout

```
grove/
├── server/        Express app + CLI entry
│   ├── bin/file-viewer.ts       CLI with serve + build-wiki subcommand
│   ├── index.ts                 createApp() — Express wiring
│   ├── documents.ts             GET /api/documents
│   ├── capabilities.ts          GET /api/capabilities
│   ├── open.ts                  POST /api/open (zod-validated)
│   └── wiki/                    build-wiki library (manifest + build)
├── shared/        Types + constants shared between layers
│   ├── content-url.ts           CONTENT_URL_PREFIX ("_content")
│   └── types/                   DocumentEntry, OpenAction, ...
└── frontend/      Angular 19 standalone app
    └── src/app/
        ├── core/                services, constants, utilities
        │   ├── services/
        │   └── constants/
        ├── features/
        │   └── document-shell/  the main page
        └── shared/              reusable renderers
            ├── doclang/         md → DlNode → DOM
            ├── grove-mark/      brand logo component
            └── theme-switcher/  theme picker
```

See [ARCHITECTURE](./ARCHITECTURE.md) for more.

## Code style

- TypeScript strict mode on. Type errors block CI.
- Angular 19 standalone components, no NgModules.
- Two-space indentation, LF line endings (see `.editorconfig`).
- Keep functions small; avoid deep nesting; favor pure helpers.
- Extract shared utilities into `core/utils/` or `core/constants/`
  instead of duplicating.
- Comments only when the "why" is non-obvious. Don't narrate the
  "what" — names should do that.

## Previewing docs changes locally

Two options:

### Live preview (recommended while writing)

Run Grove directly against the docs folder:

```bash
grove ./docs
```

Changes are reflected on refresh.

### Static preview (matches the deployed wiki exactly)

Build and serve the wiki bundle locally with a `/grove/` base-href
to mimic the deployed Pages path:

```bash
npm run build:all
node dist/server/bin/file-viewer.js build-wiki \
  --docs docs \
  --out /tmp/grove-preview \
  --base-href /
npx http-server /tmp/grove-preview -p 4500
# → http://localhost:4500/
```

Use this if you want to verify the manifest, 404.html fallback,
or base-href rewriting.

## Pull request checklist

- [ ] `npm run build` passes (frontend + server)
- [ ] If you touched the wiki pipeline: `npm run build:all` passes
      and `grove build-wiki --docs docs --out /tmp/test --base-href /`
      produces a working bundle
- [ ] New public behavior is documented in the appropriate page
      under `docs/`
- [ ] No secrets, absolute paths, or machine-specific references
- [ ] Commit messages follow conventional commit style
      (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `ci:`)

## CI

The `build.yml` workflow runs on every push and PR to `main`. It
installs dependencies, runs the full build, and asserts that the
key output files exist. The separate `pages.yml` workflow
auto-deploys this wiki whenever `docs/**`, `frontend/**`, or
`server/**` changes.

## License

By contributing, you agree that your contributions will be
licensed under the
[MIT license](https://github.com/MorizMensi/grove/blob/main/LICENSE).

## See also

- [Architecture reference](./ARCHITECTURE.md) — flat single-page
- [Architecture deep dives](./architecture/index.md) — per-layer
- [CLI reference](./reference/cli.md)
- [HTTP API reference](./reference/http-api.md)
- [npm scripts reference](./reference/scripts.md)
- [Shared types reference](./reference/types.md)
- [Back to docs home](./index.md)
