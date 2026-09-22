# 0075 — Design tokens come from the Lovable reference; the page title lives in the Topbar

Status: **accepted** (2026-09-18 by the owner, after a three-round grilling). Branch `style/lovable-tokens`.

Reference: Lovable project `e8b49026-3bd5-4a8f-b94c-aad813085d2c` ("Executive Insight Hub" — the ThunderOne
Overview mockup, commit `6f84544`). The mockup wins on layout, spacing, typography and colour; this ADR wins on
what is real data, what is wired, and how the shell is composed.

## Context

Facts established before deciding (2026-09-18):

- `src/app/globals.css` defines only `--background` / `--foreground` (hex). There is **no** semantic token
  layer — every colour in the shell (`Topbar.tsx`, `Sidebar.tsx`, `media-workspace-sidebar.tsx`) is a hardcoded
  hex/oklch literal. Tailwind v4, no `tailwind.config`, not shadcn/ui (no `components.json`).
- The live font is Plus Jakarta Sans; **Manrope is already loaded** by `next/font/google` in `layout.tsx` but bound
  to nothing.
- The Overview page (`features/media-workspace/overview`) already exists and is wired to real data for KPI counts,
  Now/Next program, Needs attention, Today's schedule, Channel health and Channels by type, each with a skeleton.
  Three sections are not real: Delivery success rate (hardcoded "—", no endpoint), Quick actions (mock, disabled),
  Activity feed (synthesised from `updated_at`, not an audit log).
- The sidebar already has the mockup's group structure (Content / Programming / Channels / Monitoring / Reports)
  from `config/nav/media-workspace.tsx`, a collapse toggle, and renders route-less items as disabled "Not built yet".
- `PageHeader` renders each page's title inside `main` and is used by 26 pages; some pass a ReactNode title (inline
  rename). The Topbar's bell count is a hardcoded `13`. A `ShortcutsBar` footer is mounted on every page.
- `dark:` classes exist widely but `.dark` is never applied — there is no theme toggle.
- Icons come from a bespoke `components/ui/icons.tsx` imported by 370 files; the mockup uses `lucide-react`.

## Decisions

1. **One token layer, app-wide, light only.** `globals.css` adopts the mockup's oklch token set verbatim
   (background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring, the
   `sidebar-*` set, `success`/`warning`/`danger` + `-soft`, `primary-soft`, `overlay`, `program`), its radius scale
   (`--radius: 0.75rem`), `shadow-panel` / `shadow-float`, and the `animate-spark` / `animate-ring-in` utilities
   with the reduced-motion guard. The `.dark` block is **not** copied: nothing applies it.
   *Rejected:* header-only restyle (the header would clash with every other surface); copying dark tokens
   "for later" (dead CSS).
2. **`--font-sans` → Manrope.** Plus Jakarta Sans is removed from `layout.tsx`. Geist Mono stays.
3. **Hardcoded colours are migrated only where this work already touches:** Topbar, Sidebar,
   media-workspace-sidebar, Overview. Feature pages keep their literals until they are next edited.
   *Rejected:* a repo-wide sweep in this branch (dozens of files, unverifiable in one pass).
4. **The page title moves into the Topbar** (mockup layout). `PageHeader` becomes a client component that
   publishes `{ title, subtitle }` to a tiny module store read by the Topbar through `useSyncExternalStore`, and
   renders only its `actions` row in `main`. The Topbar falls back to the nav-config label for the current
   pathname so the server render is never blank. No `setState` inside `useEffect` (repo ESLint rule).
   *Rejected:* pathname→label map only (cannot show data-driven detail titles → two standards); React context
   set from an effect (violates the ESLint rule).
5. **Topbar contents**: title + subtitle · centre search with ⌘K hint · right side = today's date as static text
   (`Intl.DateTimeFormat("en-GB", Asia/Bangkok)`, the app's existing convention), bell **without a badge** whose
   popover is an EmptyState, help, user (name + role). The non-functional "TH" language pill is removed. Height
   68px, sticky, backdrop-blur. No mobile drawer — the shell has never supported mobile and this is a desktop tool.
   *Rejected:* the mockup's "Today / This week / This month" range dropdown (no metric filters by range); a bell
   fed by channel attention (adds a fetch to every page for a feature with no spec).
6. **Sidebar is restyled, not restructured**: brand block uses the existing `/icon.svg` beside
   "ThunderOne / MEDIA WORKSPACE"; nav items, disabled state and collapse behaviour are unchanged.
7. **Overview adopts the mockup layout and its states honestly**: filter tabs All / Screens / TV / Kiosks (real
   `output_kind`; no "Audio" — it does not exist) filter the channel set client-side; skeletons stay bound to real
   fetches (no fake 650 ms timer); **Delivery success rate renders the EmptyState**; **Quick actions shows only
   actions with a real route** (Create publication, Create playlist, Upload media); the synthesised feed is
   relabelled **"Recent updates"**; a status footer shows the real last-successful-fetch time and the timezone, with
   channels polled every 60 s like now-next. A shared `components/ui/EmptyState.tsx` is introduced for the
   Overview; the per-feature `*ListStates.tsx` files are left alone.
8. **`ShortcutsBar` is removed** from the dashboard layout.
9. **`lucide-react` is added** and used in the shell + Overview only; `icons.tsx` stays for the other 370 files.
   `tw-animate-css` is **not** added — the one popover enter animation is a three-line keyframe.

## Consequences

- Every surface inherits the new colours, radius and font at once; feature pages that hardcode zinc/hex will look
  slightly off against the shell until migrated (follow-up ticket).
- **Rule (2026-09-18, branch `style/media-workspace-tokens`):** inside `src/features/media-workspace/` and its
  routes, raw palette classes (`indigo-*`, `zinc-*`, `bg-white`, `red/emerald/amber-*` where a semantic token
  exists) and `dark:` variants are not allowed — use the tokens in `globals.css`. Categorical hues that
  distinguish content kinds or layout zones (`blue/violet/sky`) are the one exception until a Lovable design
  covers them. Plan: `docs/media-workspace/plan-media-workspace-tokens.md`.
- `PageHeader` callers need no change, but a page that renders no `PageHeader` shows the nav-config label.
- Follow-ups, not in this branch: migrate `*ListStates.tsx` to the shared `EmptyState`; migrate `icons.tsx` users
  to lucide; dark mode toggle (tokens are structured to accept a `.dark` block).
