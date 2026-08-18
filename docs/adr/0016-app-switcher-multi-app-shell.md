# 0016 — App Switcher: a real dropdown drives a multi-app shell

## Context

Thunder One is about to stop being a single-app repo. A second app, "Asset Intelligence" (org-wide
physical asset management — laptops, printers, NAS, and media-player hardware — see ADR 0017/0018
for how it relates to the existing Media Workspace domain), is being added into this same codebase
rather than as a separate deployment, and it needs its own navigation, its own landing page, and a
way for an operator to move between it and Media Workspace without a page reload losing the app
shell.

The affordance for this already exists in the UI and does nothing:

- `src/components/layout/Sidebar.tsx:154-160` renders a `<button>` reading "Media Workspace" with a
  `GridIcon` and a `ChevronDownIcon` — every visual signal of a dropdown trigger — but has no
  `onClick`, no open/closed state, and no menu. It has sat this way since the button was first
  added; nothing in the codebase treats it as anything other than static chrome.
- `src/components/layout/Sidebar.tsx:149-150` hardcodes the tagline under the "ThunderOne" wordmark
  as the literal string `"Communication OS"`. There is currently exactly one app, so a hardcoded
  tagline has never had to vary.
- `src/components/layout/Sidebar.tsx:31-59` hardcodes `sections: NavSection[]` (Publishing /
  Channels / Monitoring) directly in the component file. This is Media Workspace's nav, but nothing
  in the file's shape marks it as app-specific — a second app's nav has nowhere to go without either
  branching inside `Sidebar.tsx` or extracting config first.

Nothing here previously needed to model "which app is active" because there was only ever one.

## Decision

**A `src/config/apps.ts` registry is the single source of truth for which apps exist, and the URL
path — not client state — is the single source of truth for which one is active.**

Concretely:

1. `src/config/apps.ts` exports a `const APPS` array, one entry per app: `{ id, label, tagline,
   icon, basePath }`. `media-workspace` (`basePath: "/"`, `tagline: "Communication OS"`) and
   `asset-intelligence` (`basePath: "/asset-intelligence"`, `tagline: "Business OS"`) are the two
   entries for this change. Adding a third app later means adding one entry here, not touching
   `Sidebar.tsx`.
2. The static button at `Sidebar.tsx:154-160` becomes a real dropdown: local `useState` for
   open/closed, a floating panel listing every `APPS` entry (icon + label, current app highlighted),
   and `router.push(app.basePath)` on selection. No `localStorage`, no cookie, no context provider
   for "current app" — `usePathname()` matched against `APPS[].basePath` is computed fresh on every
   render, so a shared link or a browser back/forward action always lands on the correct app shell
   with no hydration mismatch to reconcile.
3. The tagline at `Sidebar.tsx:150` reads `APPS.find(a => a.id === activeAppId)!.tagline` instead of
   the hardcoded string. The "ThunderOne" wordmark above it does not change per app — it is the
   product/company name, not the app name.
4. `sections`/`standaloneLinks`/`standaloneIcons` move out of `Sidebar.tsx` into per-app config
   (`src/config/nav/media-workspace.ts`, `src/config/nav/asset-intelligence.ts`), and `Sidebar`
   selects between them using the same `activeAppId` computed in step 2. This is a mechanical
   extraction of Media Workspace's existing nav plus a new equivalent file for Asset Intelligence —
   no behavior change for Media Workspace's own nav.
5. Route namespacing: every Asset Intelligence page lives under `(dashboard)/asset-intelligence/**`.
   This is enough on its own to prevent route collisions with `/assets`, `/channels`,
   `/publications`, `/playlists` — no additional guard is needed.

## Options rejected

**Store the active app in `localStorage` or a client context, independent of the URL.** Would let a
direct link to `/asset-intelligence/mission-control` render with the wrong sidebar (whatever app was
last selected on that browser), which defeats the point of having real routes per app. Rejected —
the URL already encodes this unambiguously; a second, possibly-stale source of truth adds a
reconciliation problem for no benefit.

**Keep `sections` inline in `Sidebar.tsx` and branch on `activeAppId` with an if/else inside the
component.** Cheaper for exactly two apps. Rejected because it does not scale past two — a third app
would mean a third branch inside an already-large component — and because the per-app config files
are what let `docs/asset-intelligence/plan-app-switcher.md` and future ADRs point at a stable,
named location for "what's in this app's nav" instead of a line range inside `Sidebar.tsx`.

## Consequences

`Sidebar.tsx` gains a dependency on `usePathname()` for app detection in addition to the route
matching it already does for active-link highlighting — both now derive from the same `pathname`
value, so there is one navigation-state read, not two.

Every future Asset Intelligence route must stay under `/asset-intelligence/**`, and every future
Media Workspace route must stay off that prefix, or the `activeAppId` matcher (longest-`basePath`the
match wins, checked before the `/` fallback) picks the wrong app. This is a convention, not a runtime
guard — nothing stops a future page from being added outside its app's prefix. If that turns out to
happen often, a lint rule or route-group boundary is worth adding later; not done here.

`src/config/nav/*.ts` becomes the new place reviewers look for "what's in this app's sidebar,"
rather than `Sidebar.tsx` itself — `Sidebar.tsx` after this change contains no domain-specific nav
content of its own for either app.
