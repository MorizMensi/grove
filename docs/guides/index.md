# Guides

Task-based how-to documentation. For conceptual material see
[architecture](../architecture/index.md); for mechanical reference
see [reference](../reference/index.md).

## Pages

- **[Troubleshooting](./troubleshooting.md)** — common issues
  and fixes
- **[Self-hosting](./self-hosting.md)** — run Grove as a
  persistent background service on macOS, Linux, Windows, or
  Docker
- **[Wiki deployment](./wiki-deployment.md)** — deploy a repo's
  `docs/` folder to GitHub Pages using Grove's reusable
  workflow

## Quick links

```mermaid
flowchart LR
  IDX[index.md] --> TR[troubleshooting.md]
  IDX --> SH[self-hosting.md]
  IDX --> WD[wiki-deployment.md]

  GS[getting-started.md] --> IDX
  WD --> WO[wiki-for-other-repos.md]
  SH --> REF["reference/environment.md"]
  TR --> REF2["reference/http-api.md"]
```

## See also

- [Getting started](../getting-started.md)
- [Usage](../usage.md)
- [Back to docs home](../index.md)
