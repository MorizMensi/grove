# Use Grove for your own wiki

Grove ships a reusable GitHub Actions workflow that renders **any
repo's `docs/` folder** as a static wiki on GitHub Pages — using
Grove's own frontend. Your readers get the same layout, the same
`dl-node` renderer, and the same aesthetic you're looking at right
now.

## Ten-line setup

Add this workflow to your repo at `.github/workflows/docs.yml`:

```yaml
name: docs
on:
  push:
    branches: [main]
    paths: [docs/**]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  wiki:
    uses: MorizMensi/grove/.github/workflows/build-wiki.yml@main
    with:
      docs: docs
```

The `permissions:` block is required — GitHub's reusable-workflow rules
require the caller to grant at least the permissions the callee
declares, and `build-wiki.yml` needs `pages: write` + `id-token: write`
to deploy via `actions/deploy-pages`.

Then enable GitHub Pages:

**Settings → Pages → Source: GitHub Actions**

Push a commit that touches `docs/` (or trigger the workflow
manually from the Actions tab). Your wiki is now live at
`https://<your-user>.github.io/<your-repo>/`.

## What the workflow does

1. Checks out your repo
2. Checks out Grove alongside it under `.grove/`
3. Installs Grove's dependencies and builds the production and
   wiki bundles
4. Runs `grove build-wiki --docs <your-docs> --out dist-wiki
   --base-href /<repo-name>/`
5. Uploads the output as a Pages artifact
6. Deploys it to GitHub Pages

The Grove checkout and rebuild add about 90 seconds to each run
on GitHub-hosted runners. Node module caching (via
`actions/setup-node`) keeps incremental runs fast.

## Inputs

The workflow accepts five optional inputs:

| Input       | Default            | What it does                                         |
| ----------- | ------------------ | ---------------------------------------------------- |
| `docs`      | `docs`             | Path to your markdown folder inside the repo         |
| `out`       | `dist-wiki`        | Output directory (rarely worth changing)             |
| `base-href` | `/<repo-name>/`    | Base path for Pages — defaults match the repo name   |
| `grove-ref` | `main`             | Grove git ref to build against (branch, tag, or SHA) |
| `site-name` | `<repo-name>`      | Brand text shown in the breadcrumb bar + browser tab title |

`site-name` only affects what your readers see — it's not
functional. Lowercase repo names like `my-lib` show up as-is; pass a
prettier value if you want proper capitalization or spaces.

Example with custom paths and a branded site name:

```yaml
jobs:
  wiki:
    uses: MorizMensi/grove/.github/workflows/build-wiki.yml@main
    with:
      docs: documentation
      base-href: /my-lib/
      site-name: My Cool Library
      grove-ref: main
```

## Pinning `grove-ref`

During v0.x, **pin to `@main`**. Grove is early enough that each
release still includes the occasional bugfix for the wiki
pipeline, and `main` is kept green by the build CI. Once Grove
ships a `v1` tag, switch to `@v1` (or a specific `@v1.2.3` SHA)
for reproducible builds.

## Layout expectations

Your repo should look roughly like:

```
your-repo/
├── docs/              # your markdown lives here
│   ├── index.md
│   ├── getting-started.md
│   └── ...
└── .github/workflows/
    └── docs.yml       # the workflow above
```

Link between pages with **relative** markdown links:

```markdown
See the [getting started](./getting-started.md) guide.
```

Grove's renderer picks these up and turns them into Angular router
navigations — no page reload, no broken URLs when you change the
base-href later.

## Gotchas

- **Repo must be public** (or you need GitHub Pages on a paid
  plan). This is a GitHub limitation, not a Grove one.
- **Pages must be enabled once**, in Settings → Pages. Grove can't
  do this for you — it's a per-repo toggle.
- **A top-level `docs/api/` folder** will technically work, but
  note that Grove's own HTTP surface serves `/api/*` for its three
  JSON endpoints. In wiki mode those endpoints don't exist (the
  `CapabilitiesService` is dead-branched), so there's no runtime
  collision. But if you later add more internal APIs under
  `/api/`, be aware that `docs/api/foo.md` would still route to
  `/api/foo` in the SPA.
- **Top-level `docs/_content/` is shadowed** by Grove's internal
  raw-file mount. Nobody names folders that, but don't.
- **Deep links return a 404 status** on GitHub Pages. The SPA
  fallback (`404.html` === `index.html`) still lands the user on
  the right page; it's just that the HTTP status is 404. For seven
  pages of docs this doesn't affect SEO.

## How the reusable workflow is wired

Internally, `.github/workflows/build-wiki.yml` is a
`workflow_call`-triggered workflow that any repo can invoke. The
Grove repo itself uses the same workflow (via a local
`./.github/workflows/build-wiki.yml` reference in its
`pages.yml`), which means the wiki you're reading *right now* is
built with the exact same pipeline as any third-party consumer —
no special internal shortcut.

## Alternatives considered

- **Prebuilt release tarballs** — attaching a `grove-dist.tgz` to
  each Grove release would let consumer CI skip the 90-second
  build. Deferred until the wiki pipeline stabilizes.
- **Publishing to npm and using `npx grovemd build-wiki`** —
  planned once the bare `grove` package name is released. For now
  `grovemd` is available but the reusable workflow still uses a
  source build to keep the frontend bundle versions coupled.
- **Jekyll / MkDocs / Docusaurus** — fine tools, but they can't
  render a random folder of markdown with Grove's specific
  aesthetic. If you want a polished static site with blog-style
  navigation, go use them. If you want "`ls docs/` on the web",
  use Grove.

## Troubleshooting

**Deploy fails with "Pages not enabled"** — go to Settings →
Pages → Source: GitHub Actions. Re-run the workflow.

**Deploy fails with "not supported"** — your repo is private on a
free account. Upgrade or make the repo public.

**Wiki renders but links are broken** — your `base-href` doesn't
match the actual deploy URL. Check the `base-href` input in your
workflow and compare it to the Pages URL (visible in the workflow
log).

**Empty page or "Failed to fetch manifest"** — your `docs/` folder
was empty or didn't exist at build time. The CLI fails loudly in
that case; check the workflow log for the error.
