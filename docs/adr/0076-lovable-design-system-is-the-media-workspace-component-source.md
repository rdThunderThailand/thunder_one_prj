# 0076 — The Lovable design system is the component source for Media Workspace

Status: accepted (2026-09-19, grilling with owner). Amends ADR 0075 Consequences.
Reference: Lovable project `e8b49026-3bd5-4a8f-b94c-aad813085d2c` — `src/styles.css`,
`src/components/design-system/{core,patterns}.tsx`, `src/components/ui/*`.

## Context

ADR 0075 imported the Lovable *tokens* and made them mandatory inside `src/features/media-workspace/`.
The Lovable project has since grown a full design-system layer (core components, application
patterns, a `/design-system` reference page) and designs for Playlists, Layouts (= repo
Compositions), the Layout editor, the Media detail page and Trash. The first port
(`style/media-library-lovable`) copied primitives ad hoc into `src/components/ui/lovable/` and built
`content-library/LibraryShell` as a local pattern layer. Without a rule, the next port would keep
choosing between legacy `src/components/ui/*` (`Modal`, `Badge color=`, `Button variant=secondary`)
and the Lovable copies file by file.

Fact-finding (`scratchpad/lovable-vs-repo.md`, 2026-09-19) showed Lovable's pages carry behaviour the
repo does not have (in-page Publish dialogs, Widgets, Storage Usage, autosave, per-zone Loop/Safe
Margin…) and the repo carries behaviour Lovable lacks (shared-Template guard, URL-synced list state,
real preview stage, BroadcastChannel preview handoff, sortable headers).

## Decisions

1. **Source of truth.** New or changed UI inside `src/features/media-workspace/` is composed from
   `src/components/ui/lovable/` (copied Lovable primitives + `core.tsx`) and the tokens in
   `globals.css`. Writing a new primitive that Lovable already has is not allowed; the Lovable file
   is copied instead. The reference page (`/design-system`) is **not** ported — the Lovable preview
   is the visual reference, `ui/lovable/` is the code reference.

2. **Copy what is used.** Primitives and `patterns.tsx` exports enter the repo when a ported page
   needs them, not wholesale. A Lovable pattern that overlaps an existing repo pattern
   (`DataTablePage`/`FolderNavigation` vs `LibraryShell`, `ItemPicker` vs `AddItemDrawer`,
   `FullscreenPreview` vs the `(preview)` routes) **replaces or is rejected** at port time —
   never both kept.

3. **Treatment only.** A port changes layout, spacing, colour, typography and which primitive
   renders a control. It does not add behaviour the repo lacks, does not add controls that would be
   disabled placeholders, and does not remove behaviour the repo has (shared-Template guard,
   align/lock/hide/snap, URL state, sortable headers, Save & Activate). Feature gaps are tickets;
   the list lives in the plan.

4. **Dialogs.** Inside the ported surfaces the legacy `ui/Modal` is replaced by Lovable
   `Dialog` / `AlertDialog` (Radix unmounts on close, which keeps the 2026-09-04 "closed = unmount"
   fix). `window.confirm` is replaced by `AlertDialog` where a dialog already exists in the design.
   `Modal` stays for surfaces outside the port (publications, channels).

5. **Base layer stays out of the app.** As ADR 0075 §8: no `.dark` block, no
   `* { border-color }` (copies get explicit `border-border`), no global `body { font-size: 14px }`
   (the Media Workspace layout wrapper sets `text-sm` instead), no global `:focus-visible` rule.
   `prefers-reduced-motion` **is** added — accessibility, additive. Tokens are added additively:
   `info/-soft`, `surface-subtle/raised`, `border-subtle`, `text-3xs/2xs/ui`, `radius-2xl..4xl`,
   `shadow-dialog`, `spacing-shell-header/summary-card`, `breakpoint-xs`, `z-index-*`,
   `@utility type-label` / `focus-ring`. Not added: `chart-1..5`, `bg-health-ring`,
   `bg-delivery-ring` (no consumer).

6. **Dependencies.** Radix packages are added only for primitives a ported page uses:
   `@radix-ui/react-label`, `react-switch`, `react-alert-dialog`. `tooltip`, `radio-group`,
   `avatar`, `context-menu` are only needed by the reference page and are not added.

7. **Navigation and entities are unchanged.** Lovable "Layouts" = repo Compositions
   (`/media-workspace/layouts`); Lovable "templates" = repo Layouts
   (`/media-workspace/layouts/templates`). The Templates list page stays (it is the only place to
   edit a shared Template, rename or retire one — ADR 0052 §3/§4); *Save as Template* in the
   composition editor already exists. Preview stays a route in a new tab; Publish stays the
   ver02 wizard (its own Figma, ADR 0072/0073).

## Rejected

- **Port the reference page** as `/media-workspace/design-system`: drags in eight primitives no page
  uses and has no guard that keeps it in sync with the real components; Lovable still edits it.
  Reopen if the team wants an in-repo catalogue with a maintenance owner.
- **Copy `design-system/index.ts` wholesale**: same dead-code argument; ponytail.
- **Collapse the Templates list into the editor** (owner's first ask): loses shared-Template edit,
  rename, retire; needs an ADR of its own. Parked, not refused.
- **Global 14px body / border-color base**: app-wide side effects outside Media Workspace.

## Consequences

- `AGENTS.md` "Media Workspace styling" and `~/.claude/CLAUDE.md` §8 gain the rule from §1.
- `LibraryShell`/`LibraryChrome` are re-aligned against the real Lovable Playlists/Layouts designs
  (the first port guessed them from Media Library) before any new page inherits them.
- Legacy `src/components/ui/{Modal,Badge,Button,…}` keep serving the rest of the app; their Media
  Workspace importers shrink port by port. No lint rule yet.
- Feature gaps A1–A9 and rejected items B1–B9 are listed in
  `docs/media-workspace/plan-lovable-content-library.md` for ticketing.
