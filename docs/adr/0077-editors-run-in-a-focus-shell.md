# 0077 — Media Workspace editors run in a focus shell

Status: accepted (2026-09-21, owner). Amends ADR 0076 Q4 ("app shell untouched") for editor routes only.

## Context

After three Lovable port rounds the Composition editor, Playlist editor and Template editor matched the
reference column for column, yet the owner still read them as "the structure is wrong". A side-by-side at
1440 px showed why: on editor routes the Lovable reference renders **no top bar** and a **sidebar collapsed
to an icon rail**, so the editor starts at y≈0 and is ~160 px wider. The repo's shell (68 px Topbar + 224 px
sidebar) took ~30 % of the canvas area, and every inner element had to shrink or stack to compensate.
Density work inside the editor cannot recover space the shell has already spent.

## Decision

1. **Editor routes get a focus shell.** `isEditorRoute(pathname)` (`src/config/nav/editor-routes.ts`) is
   true for `/media-workspace/{playlists,layouts,layouts/templates}/<id|create>` and nothing else. On those
   routes the `Topbar` renders nothing and the `Sidebar` starts collapsed. Lists, detail pages, wizards and
   every other app keep the full shell.
2. **Collapse stays a user choice.** The sidebar's collapsed state is the route default until the person
   toggles it; the choice is scoped to the current pathname, so an editor never pins the list pages
   collapsed and vice versa. No persistence.
3. **The editor page owns its header.** Breadcrumb, back link, title and actions already live in
   `CompositionEditorHeader` / `PlaylistEditorHeader` / `LayoutEditorPage`; the Topbar's search, date and
   user menu are not offered inside an editor (same as the reference).
4. **Editor frames size against the viewport, not the Topbar.** `PlaylistEditorPage` uses
   `calc(100dvh - 3rem)` (the `<main>` padding only).

## Rejected

- **A separate route group with its own layout** (`(editor)/…`): cleaner in theory, but the routes already
  live under `(dashboard)/(application)/media-workspace/` next to their lists, and moving six pages to get
  a different `layout.tsx` changes every internal link and the nav config. A path predicate in the two shell
  components is 20 lines and reversible.
- **Hide the Topbar app-wide in Media Workspace**: the list pages use it for search and the page title
  (ADR 0075).
- **Keep the shell and shrink the editors further**: the previous three rounds; does not close the gap.

## Consequences

- `Sidebar.tsx` / `Topbar.tsx` import `isEditorRoute`; `editor-routes.check.mts` pins the route set.
- A new editor route must be added to `EDITOR_PARENTS` or it renders with the full shell (harmless, visible).
- The Topbar's page-title store is unused on editor routes; nothing publishes into it there today.
- Verified in Chrome at 1440: composition editor, playlist editor (stage + filmstrip + Playback Settings in
  one view), template editor, and the Playlists list still shows the full shell after navigating back.
