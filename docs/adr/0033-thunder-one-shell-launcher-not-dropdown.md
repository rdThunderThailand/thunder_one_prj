# 0033 — Thunder One shell: a launcher page replaces the two-item App dropdown

_Numbered 0033, not 0025, despite `dev`'s `docs/adr/` topping out at 0024 as of this branch's base:
`feat/playlistOverview` already claims 0025-0032 (playlist work, unmerged into `dev` as of
2026-08-20). Sequential-from-`dev` would collide with it — the exact renumbering incident ADR-0023's
`ai-` namespace already had to work around once (0016-0018 → 0022-0024). Re-check both branches'
`docs/adr/` before assuming 0034 is free for the next one._

## Context

ADR-0022 gave this repo its first multi-app shell: a two-entry `APPS` registry
(`src/config/apps.tsx`), a dropdown (`AppSwitcher`, `src/components/layout/Sidebar.tsx:93-140`)
to move between them, and the URL as the source of truth for which app is active. It assumed
exactly two peer apps, one of which — Media Workspace — permanently owns the root path:

- `src/config/apps.tsx` — `APPS` has two entries: `media-workspace` (`basePath: "/"`) and
  `asset-intelligence` (`basePath: "/asset-intelligence"`).
- `src/features/auth/components/LoginForm.tsx:23` — `router.push("/")` on successful login, landing
  directly on Media Workspace with no intermediate stop.
- `src/config/nav/asset-intelligence.tsx:190-197` — Asset Intelligence has six persona navs
  (`NAV_BY_PERSONA_SEGMENT`): CEO (`mission-control`), Asset/IT Manager (`assets`), Department
  Manager (`departments`), Technician (`work-orders`), Employee (`my-assets`), Thunder Care
  (`service-ops`).

Two things this repo will grow past: a fixed two-app dropdown, and a root path (`/`) that only
ever meant one specific app. Decided with the user 2026-08-20:

## Decision

**A new outer shell, Thunder One, owns `/`. Apps are reached through a launcher page, not a
dropdown, and Asset Intelligence's six personas split across three destinations.**

1. **`/` becomes Thunder One's shell root, not Communication's.** Communication (Media Workspace,
   renamed — see `CONTEXT.md`) moves to `/communication`. `LoginForm.tsx:23`'s `router.push("/")`
   now lands on the shell, not directly on an App.
2. **The shell root's landing content is personalized per user role — no fixed default page.**
   This can't be genuinely role-driven until RBAC lands (`docs/adr/0021-role-vocabulary-reconciliation.md`,
   tracked on the still-unmerged `docs/rbac-role-vocabulary-adr` branch — this repo currently has no
   permission gates at all, per that ADR and `asset-intelligence.tsx:1-8`'s own comment on the same
   gap). Until then, ship a non-personalized placeholder rather than inventing a fake role signal.
3. **Work Space becomes a real routed page — a launcher grid of App tiles — not the `AppSwitcher`
   dropdown from ADR-0022.** Rejected keeping the dropdown and just adding a third entry: a dropdown
   is fine for two items, degrades as more Apps are added, and the whole point of pulling Work Space
   out on its own is to stop that degradation before it starts. Selecting a tile still does the same
   `router.push(app.basePath)` `AppSwitcher` already does today — only the container changes.
4. **Asset Intelligence narrows to three personas**: Asset/IT Manager, Department Manager, Employee.
   CEO and Technician (and Thunder Care) are removed from `NAV_BY_PERSONA_SEGMENT`.
5. **ThunderCare is a new App**, `basePath: "/thunder-care"`, absorbing the Technician and Thunder
   Care personas — and their nav configs and feature folders — wholesale from Asset Intelligence.
6. **Mission Control and My Work become Thunder One shell-level destinations**, not owned by any one
   App. Mission Control absorbs what was Asset Intelligence's CEO page; My Work is a cross-App
   rollup, distinct in scope from (but sharing a label with) ThunderCare's own Technician-persona
   home page of the same name — see `CONTEXT.md`'s Flagged ambiguities for why that overlap is
   intentional, not a collision to resolve. Neither is a mandated cross-app aggregation pattern —
   this decision does not prescribe how they source their data, only that they exist at the shell
   level and not inside an App.
7. **Intelligence and Governance are new shell-level sections**, named after the Asset Intelligence
   requirement doc's Experience Layers (Obsidian `Asset Intelligence - Development Requirements
   (Role-Based).md` §1.2). Placeholders only — no implementation exists for either yet.

## Options rejected

**Keep the ADR-0022 dropdown and just add a third `APPS` entry for ThunderCare.** Cheapest change,
but a dropdown that already needs an entry per persona-heavy App doesn't get more usable by adding
entries — it gets less. Rejected in favor of a dedicated launcher page, per step 3.

**Leave Asset Intelligence's six personas as-is and add shell-level nav on top.** Would mean
"Mission Control" and "My Work" exist twice with no distinction — once as Asset Intelligence persona
pages, once as shell destinations — with nothing in the code signaling they're different things.
Rejected: the user wants CEO and Technician to actually move, not be shadowed by a same-named shell
layer.

## Consequences (dev impact list)

1. `src/config/apps.tsx` — rename the `media-workspace` entry to `communication`
   (`basePath: "/communication"`); add a `thunder-care` entry (`basePath: "/thunder-care"`). The
   `asset-intelligence` entry's shape is unchanged; only its downstream nav shrinks (see #5).
2. `src/features/auth/components/LoginForm.tsx:23` — `router.push("/")` now lands on Thunder One's
   shell, which needs its own landing component (currently nothing renders at a bare shell root).
3. `src/components/layout/Sidebar.tsx:93-140` (`AppSwitcher`) — either removed or demoted; Work Space
   needs a new routed page + component for the launcher grid.
4. `src/config/nav/media-workspace.tsx` — rename file and exported config to match `communication`;
   update `Sidebar.tsx:14-17`'s `resolveNavConfig` to match.
5. `src/config/nav/asset-intelligence.tsx:190-197` — remove `mission-control`, `work-orders`,
   `service-ops` entries from `NAV_BY_PERSONA_SEGMENT`; move the CEO nav out to Thunder One's shell
   and the Technician + Thunder Care navs into a new `src/config/nav/thunder-care.tsx`.
6. Feature folders: `src/features/ai-mission-control` (CEO) needs a new home at the shell level, not
   inside any App's `features/`. `src/features/ai-work-orders` (Technician) and
   `src/features/ai-service-ops` (Thunder Care) move under ThunderCare — their own feature-folder
   prefix (the `ai-` prefix was chosen specifically to namespace Asset Intelligence, ADR-0023, and
   doesn't fit an App that isn't Asset Intelligence) is not decided by this ADR.
7. Routes: everything under `(dashboard)/asset-intelligence/mission-control/**`,
   `.../work-orders/**`, and `.../service-ops/**` needs a new URL home. No redirect strategy for the
   old URLs is decided here.
8. `Sidebar.tsx:150,155` and `apps.tsx`'s per-app `tagline` (ADR-0022 step 3) assumed the shell's top
   slot swaps between two sibling apps. With Apps now nested inside Thunder One rather than living at
   its top level, whether a per-app tagline still makes sense — and what the shell itself shows when
   no App is active — is not resolved here.
9. **Open task, not resolved by this ADR:** survey what currently depends on `/` resolving to
   Communication — bookmarks, links elsewhere in the org, QR codes, etc. — before deploying this
   change (per user, 2026-08-20).
10. **Open, blocked:** the shell root's per-role personalized landing (step 2) can't be real until
    RBAC lands. Ship the non-personalized placeholder in the meantime and revisit once
    `docs/adr/0021-role-vocabulary-reconciliation.md` merges.
11. Mission Control / My Work's cross-App data sourcing has no design yet — deliberately out of scope
    per step 6; whoever implements them decides case-by-case what to roll up from which App.

## Implementation notes (2026-08-20)

Items #1-7 above were implemented same-day as this ADR. Decisions made along the way that this ADR
didn't pin down:

- **ThunderCare's feature-folder prefix is `tc-`** (`src/features/tc-work-orders`,
  `src/features/tc-service-ops`), resolving #6 — mirrors Asset Intelligence's `ai-` prefix
  (ADR-0023) for the same reason: grouping and discoverability, not collision avoidance (nothing
  else in this repo is named `work-orders` or `service-ops`).
- **`src/features/ai-mission-control` dropped the `ai-` prefix entirely** (`src/features/mission-control`)
  rather than gaining a shell-specific one — it isn't scoped to any single App anymore, so no App
  prefix applies.
- **`resolveActiveApp` (`src/config/apps.tsx`) now returns `AppConfig | null`** — `null` means the
  route belongs to Thunder One's shell, not any App. `Sidebar.tsx`'s `resolveNavConfig` falls back to
  a new `src/config/nav/shell.tsx` in that case: a flat nav (Mission Control / My Work / Work Space /
  Intelligence / Governance) for most shell routes, and Mission Control's own detailed subnav
  (Insights/Reports/Approvals, moved verbatim from the old CEO nav) specifically under
  `/mission-control/**`.
- **The `AppSwitcher` dropdown component is gone** — deleted along with its `useState`/`router.push`
  logic (superseded by step 3). `Sidebar.tsx`'s logo block is now a `Link` to `/`, so there's still a
  one-click way back to the shell from inside any App — resolves the "no App-to-shell path" gap left
  open by #8's tagline question. The tagline slot shows `activeApp.tagline` inside an App, or a new
  `SHELL_TAGLINE` constant ("Thunder One Shell") otherwise — a placeholder, not a considered answer to
  #8.
- **Landing-persona redirects**: `asset-intelligence/page.tsx` now redirects to `/asset-intelligence/assets`
  (Asset/IT Manager) instead of the removed CEO persona; the new `thunder-care/page.tsx` redirects to
  `/thunder-care/work-orders` (Technician), matching persona order in the requirement doc.
- **`/`, `/work-space`, `/my-work`, `/intelligence`, `/governance` all exist as real pages now.** `/`
  is the non-personalized placeholder from step 2. `/work-space` is the real launcher grid from step 3
  (tiles sourced from `APPS`, so a fourth App needs no launcher change). `/my-work`, `/intelligence`,
  `/governance` are minimal "not built yet" placeholders — no cross-App data, per #11.
- #9 (external-`/`-dependency survey) and #10 (RBAC-gated personalization) remain open, unresolved by
  this implementation pass.
