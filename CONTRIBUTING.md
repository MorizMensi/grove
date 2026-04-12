# Contributing to Grove

Thanks for your interest. Grove is a small, focused project — the
upstream repo is the reference implementation and favors stability
over breadth. If you are thinking about a large change (especially
anything on the [roadmap](README.md#roadmap)), open an issue first so
we can agree on the scope.

## Getting started

```bash
git clone https://github.com/MorizMensi/grove.git
cd grove
npm ci
(cd frontend && npm ci)
npm run build
node dist/server/bin/file-viewer.js ./docs
```

The Express server serves the Angular SPA from `dist/frontend/browser`
and exposes `GET /api/documents`, `POST /api/open`, `GET /api/capabilities`.

During frontend-only development you can run a watch-mode build:

```bash
cd frontend
npx ng build --configuration development --watch
```

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the detailed
diagram. In short:

- `server/`   — Express app + CLI entry (`server/bin/file-viewer.ts`)
- `shared/`   — types shared between server and frontend (zod schemas)
- `frontend/` — Angular 19 standalone app
  - `core/`     — services, constants, utilities
  - `shared/`   — reusable UI modules (doclang renderer)
  - `features/` — feature-scoped pages (document shell)

## Code style

- TypeScript strict mode on. Type errors block CI.
- Angular 19 standalone components; no NgModules.
- Two-space indentation, LF line endings (see `.editorconfig`).
- Keep functions small, avoid deep nesting, favor pure helpers.
- Extract shared utilities into `core/utils/` or `core/constants/`
  instead of duplicating.

## Pull request checklist

- [ ] `npm run build` passes (both frontend and server)
- [ ] New public behavior is documented in the README
- [ ] No secrets, absolute paths, or machine-specific references
- [ ] Commit messages follow the conventional commit style used in
      git history (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)

## License

By contributing, you agree that your contributions will be licensed
under the [MIT license](LICENSE).
