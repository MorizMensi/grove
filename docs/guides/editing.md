# Editing guide

Grove's in-browser editor lets you write markdown with the same
rendering Grove shows in read mode. No separate source pane; inline
syntax reveals only when your caret enters it. Block-level structures
(fenced code, tables, Mermaid, images) render live in the buffer.

Editing is **opt-in** and **single-user**. Grove is designed for one
person on their own machine, not for shared or production use.

## Enable editing

```bash
grove ~/vault --allow-edits
```

When `--allow-edits` is set:

- A pencil icon appears in the toolbar of every `.md` file view.
- The sidebar grows right-click / Shift+F10 context menus and an
  inline `+` on directory rows.
- The `/api/documents` endpoint unlocks `PUT`, `POST`, and `DELETE`.

Without the flag, Grove runs exactly as the read-only viewer: no
pencil, no sidebar CRUD, and the write routes return `403
edits-disabled`. You can flip editing off at any time by restarting
Grove without the flag.

## Enable auto-commit

```bash
cd ~/vault
git init                              # if not already a git repo
git config user.name "Your Name"
git config user.email "you@example.com"
git add . && git commit -m "initial"

grove . --allow-edits --git-commit
```

With `--git-commit` you get one commit per successful edit, named
`grove: <verb> <rel>` where `<verb>` is `edit`, `create`, or
`delete`:

```
$ git log --oneline
abc1234 grove: edit notes/2026-04-21.md
def5678 grove: create notes/2026-04-22.md
9876543 grove: delete notes/old.md
```

Grove validates the worktree and git identity at startup, so the
flag never silently no-ops. If `user.name` or `user.email` is
missing, or `docsDir` isn't inside a git worktree, Grove exits 1
with an actionable message.

`--git-commit` commits are scoped to the single changed file via
`commit --only -- <rel>`. Other uncommitted changes in the repo are
not swept into Grove commits — you can have Grove auto-commit
alongside manual edits without them colliding.

## Entering edit mode

Click the pencil. The toolbar swaps:

| State | Icon | Label | `aria-pressed` |
| --- | --- | --- | --- |
| View | `bi-pencil` | "Edit" | `false` |
| Edit | `bi-pencil-fill` | "Done" | `true` |

The document doesn't visually change on first paint — edit mode uses
the same rendering for everything the caret isn't touching. Only
when you click inside `**bold**` does the `**` appear; click
anywhere else and it disappears again.

### Saving

- **⌘S** / **Ctrl+S** — save and keep editing
- **Toolbar button** — same
- Saving triggers a "Saved" announcement via the polite live region
  (VoiceOver, Orca, etc. will read it)

Grove does not auto-save. Explicit save keeps write pressure
predictable — one commit per save under `--git-commit`, no churn if
you step away mid-thought, easy conflict reasoning.

### Leaving edit mode

- **Click "Done"** — dirty buffer opens the Save / Discard / Cancel
  modal; clean buffer drops straight back to view mode.
- **Esc** — same as clicking Done.
- **Navigate to another page** — the `canDeactivate` route guard
  opens the same modal.
- **Close the tab or refresh** — the browser's native "Leave site?"
  confirmation appears for dirty buffers.

## Inline syntax reveal

Place the caret inside any styled span and its raw markdown appears:

| Marker | Hidden when caret is out | Revealed when caret is in |
| --- | --- | --- |
| `**bold**` | **bold** | `**bold**` |
| `*italic*` / `_italic_` | *italic* | `*italic*` / `_italic_` |
| `` `code` `` | `code` | `` `code` `` |
| `[link](url)` | [link] | `[link](url)` |
| `# Heading` | rendered `<h1>` | `# Heading` |
| `> blockquote` | rendered blockquote | `> blockquote` |
| `- item` | rendered bullet | `- item` |

Backspace and Delete remove one character at a time inside styled
spans. The reveal is triggered on every transaction that changes the
selection, so moving the caret with arrow keys works as expected.

## Block widgets

Fenced code, tables, Mermaid diagrams, and images render live inside
the buffer as "block widgets" — the same `DlNodeComponent` view mode
uses. Clicking a widget's **top half** moves the caret into the
widget's source range (so you can edit it); clicking the **bottom
half** hops past the widget to the next line (so you can continue
typing below).

### Quirks

- **Math blocks (`$$…$$`)** stay as raw source while editing. KaTeX
  renders them in view mode. This is deliberate — implementing a
  reliable `$$` block widget requires a Lezer-markdown extension
  that doesn't exist yet.
- **Mermaid diagrams** re-render while you edit their source; expect
  a ~120 ms debounce before the widget updates.
- **Images** render from the `/_content/` mount, same as view mode.

## Sidebar CRUD

### New file

- **Right-click** a directory or empty space → **New file**.
- **Shift+F10** on a focused sidebar row → same menu.
- **Alt+N** on a focused directory → same (browsers reserve Cmd+N).
- **Hover** a directory row → inline `+` appears.

You'll get an inline input. Type the name; Grove appends `.md` if
you omit the extension. Enter commits; Esc cancels. On 201 the
sidebar refreshes, the new file opens, and edit mode is entered
automatically.

### New folder

Same menu → **New folder**. Inline input; no extension appended.

Grove refuses to create a file in a missing parent: if you try
`a/b/c.md` and `a/b` doesn't exist, you'll see **"Create the folder
first."** rather than auto-materialising the path. This prevents
typo-induced deep trees.

### Delete

Right-click a row → **Delete** (or press Delete key with the row
focused). A confirm dialog opens with focus trapped inside:

- **Tab** cycles between buttons.
- **Esc** cancels and returns focus to the row.
- **Enter** activates the default (Cancel, to prevent accidents).

Deleting the currently-open file navigates to the parent directory
listing and announces "Deleted `<name>`" via the live region. The
subtree context is preserved; the sidebar refreshes.

Grove refuses to delete non-empty directories (`409 not-empty`). It
also refuses to delete `docsDir` itself.

## Conflict detection

If you edit a file in Grove while another tool (text editor, Grove
in another tab, `sed -i`, git stash pop, etc.) modifies the same
file on disk, your next save triggers a **409 stale** response. The
buffer shows:

```
┌─────────────────────────────────────────────┐
│ File changed on disk                        │
│                                             │
│ [Reload]  [Overwrite]  [Cancel]             │
└─────────────────────────────────────────────┘
```

- **Reload** — replace the buffer with the on-disk content. You
  lose your unsaved edits.
- **Overwrite** — send the save again with the current on-disk
  `mtime`. You lose the other tool's changes.
- **Cancel** — dismiss the banner; the buffer stays dirty. Copy out
  your changes and decide later.

Grove's conflict detection runs at **second** precision (HTTP dates
have only second granularity; comparing against `mtimeMs` would
spuriously trip within the same second of a save). There's a
1-second race window — acceptable for a single-user tool.

## Keyboard reference

| Key | Action |
| --- | --- |
| `⌘S` / `Ctrl+S` | Save |
| `Esc` | Exit edit mode (with dirty check) |
| `⌘Z` / `Ctrl+Z` | Undo (CM6 history) |
| `⌘⇧Z` / `Ctrl+Y` | Redo |
| `⌘F` / `Ctrl+F` | Find (CM6 search panel) |
| `⌘G` / `Ctrl+G` | Find next |
| `Tab` in list | Indent list item |
| `Shift+Tab` in list | Dedent list item |
| `Alt+N` on directory | New file |
| `Shift+F10` on sidebar row | Open context menu |
| `Delete` on sidebar row | Delete (with confirm) |
| `F2` on sidebar row | Announces "Rename is not available yet" |

Per the CM6 research: **no `Ctrl-<letter>` shortcuts are bound on
macOS**. `Ctrl+A`, `Ctrl+E`, `Ctrl+K`, etc. all pass through to
macOS Emacs-style text navigation.

## Accessibility

Grove's editor was built with accessibility as a per-surface
contract, not a retrofit:

- The pencil toggle announces **"Edit button, toggle button, not
  pressed"** (VoiceOver) and transitions to **"pressed"** on
  activation.
- The sidebar context menu is a `role="menu"` with `role="menuitem"`
  children. Arrow keys navigate; Home/End jump to first/last; Esc
  returns focus to the opener.
- The confirm-delete modal has `role="dialog"`, `aria-modal="true"`,
  trapped focus, and returns focus to the invoker on close.
- A singleton polite live region announces save/delete/conflict
  state. It never hijacks focus.
- Animations respect `prefers-reduced-motion`. Focus rings use
  `:focus-visible`; no colour-only meaning is introduced.

## Troubleshooting

**The pencil button doesn't appear.**
Restart Grove with `--allow-edits` and hard-refresh the page.
`GET /api/capabilities` has to report `supports.edits: true` for
the UI to render the pencil. If you see the pencil momentarily
disappear after a reload on a `.md` file, you've hit a stale cache —
hard-refresh resolves it.

**Save button stays "Saving…" and never completes.**
Check the server logs. Likely causes: file-system permission error,
the target's parent directory was deleted out from under Grove, or
disk full.

**"bad-origin" 403 on every save.**
Your browser is sending a mismatched `Origin` header. This is the
CSRF check firing. Common cause: Grove was reached via an unusual
URL like `http://127.0.0.1:3000` from a page served at
`http://localhost:3000`. Use the same hostname both places.

**`--git-commit` won't start.**
Grove exits 1 with an actionable message if:

- `git` isn't on `PATH`.
- `docsDir` isn't inside a git worktree (`git init` fixes it).
- `user.name` or `user.email` aren't configured.

Run the exact git command in the error message and retry.

**Saved a file but no git commit appeared.**
Either you didn't start Grove with `--git-commit`, or the save
didn't change the content (`git` reports "nothing to commit",
which Grove swallows). A visible save that produces no commit with
the flag active is `--git-commit`'s "nothing changed" pathway —
not a bug.

**"File changed on disk" every time I save.**
Something else is touching the file between your reads and writes.
Spotlight, iCloud sync, and some backup tools do this. Either
exclude the folder from those services or accept the Reload/Overwrite
workflow.

**Symlinks in my vault don't resolve.**
By default, symlinks inside `docsDir` whose targets live outside
`docsDir` are rejected as path escapes. Pass
`--disable-security allow-symlinks` to allow them — the addressed
path must still sit inside `docsDir`, so `..` traversal is still
blocked. Only use this in trusted setups.

## See also

- [Getting started](../getting-started.md) — first-run tour
- [Usage](../usage.md) — day-to-day reading
- [CLI reference](../reference/cli.md) — every flag
- [HTTP API reference](../reference/http-api.md) — what the editor
  calls under the hood
- [Editor architecture](../architecture/editor.md) — how the
  Typora-style reveal works
- [Security model](../architecture/security.md) — the gates that
  sit in front of writes
- [Troubleshooting](./troubleshooting.md) — general (non-editor)
  issues
- [Back to guides](./overview.md)
