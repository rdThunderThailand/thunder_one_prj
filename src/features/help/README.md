# Help (Platform Utility)

Implements *ThunderOne Help Workspace — Product Definition v0.1* and *Product Specification v0.1*
(Approved 2026-10-03). Help is a Platform Utility, not an App: no Work Space tile, no sidebar, no
settings. It reads no business data and writes nothing (D-G7-03).

## Surfaces

| Spec | Route / component | Notes |
|---|---|---|
| HLP-001 Home | `/help` → `HelpHomePage` | Search, Browse by Workspace, Browse by Content Type, Recommended |
| HLP-002 Search Results | `/help/search?q=` → `HelpSearchPage` | Active-locale PUBLISHED only; empty `q` shows Recommended |
| HLP-003 Article | `/help/guides/[slug]` → `HelpArticlePage` | Public, shareable, no login |
| HLP-004 Contextual Help | `HelpTrigger` in `Topbar` → `HelpDrawer` | Dropdown panel under `?` (FigJam Media Help Dashboard): tabs This page / Guides / Support. This page = About + Common tasks (Primary + Related) + Troubleshooting. Non-modal, read-only; full-screen on phones |
| HLP-005 Browse | `/help/browse?workspace=&type=` → `HelpBrowsePage` | Filters over one Guide set |
| HLP-006 No Results | `NoResults`, `NoGuides` | Recovery: new search, browse, support |
| HLP-007 Loading | `loading.tsx` + `*Skeleton` | |
| HLP-008 Error / Unavailable | `error.tsx`, `ArticleUnavailable`, drawer boundary | Never touches the page behind it |

Every page takes `?lang=th|en` (default `th`) and `?from=<screenKey>`.

## Public, without a session

`/help` sits in the `(help)` route group, outside `(dashboard)`, and never calls `getSession()`.
`src/proxy.ts` lets `/help` and `/help/*` through without the `to_at` cookie (D-G7-01).
`robots.ts` still disallows crawling; opening Help to search engines is a separate decision.

## One content service

`repository.ts` is the only reader of Help content, for both the Help Center and the drawer
(D-G7-04, AC-020): Guide Delivery, Search, Context Resolver, Locale Resolver, Related Guide
Resolver. Content is the Media pilot pack in `content/`. When Help content moves to a backend,
replace the data in `helpData` and keep the function signatures.

Delivery rules live in data and are covered by `repository.check.mts`:
- public = Guide `PUBLISHED` **and** that locale `PUBLISHED` (AC-008, AC-015)
- a missing locale is reported, never replaced by the other one (AC-010)
- context resolution Exact → Screen → Workspace → General (AC-002, AC-003)

## Context and the way back

`screens.ts` maps routes to `{ workspaceKey, screenKey, objectType }` — the one HelpContext
contract (D-G7-02). Opening the Help Center from the drawer stores the exact page in
`sessionStorage` (`t1.help.return`); the URL only carries `from=<screenKey>`, never an object id
(D-G8-01, AC-023). Without the stored path, "Back to ThunderOne" returns to the screen's list
route; a direct visitor gets "Go to ThunderOne".

## Adding content

1. Add a `Guide` to `content/guides.ts` with a new `guideId` and unique `publicSlug`. Use the UI's
   exact words for buttons and fields.
2. Map it: `CONTEXT_MAPPINGS` (screen/workspace) and `GUIDE_RELATIONSHIPS` in `content/mappings.ts`.
   A new screen goes in `screens.ts` first.
3. `node src/features/help/repository.check.mts` and `node src/features/help/navigation.check.mts`.

## Not built (by the spec or by missing inputs)

- Authoring, review and publishing UI, and the audit trail (D-G8-02, D-G8-04, AC-014): the spec
  keeps administration out of end-user Help. Lifecycle fields are modelled; nothing writes them.
- `USE_CASE_MAPPINGS` is empty: there are no canonical Media Workspace UC IDs in this repo yet.
- The panel has no language switch: it follows the shell's `<html lang>`. The shell switch is the user's primary
  language for the whole app (`src/lib/app-locale.ts`, `users.preferred_language`).
  The public Help Center keeps its own TH/EN switch because it has no shell.
- Support tab channels (Live Chat, Email, Phone + hours, contact form, status page) each appear only
  when configured: `NEXT_PUBLIC_HELP_SUPPORT_CHAT_URL`, `_EMAIL`, `_PHONE`, `_HOURS`, `NEXT_PUBLIC_HELP_SUPPORT_URL`,
  `NEXT_PUBLIC_HELP_STATUS_URL`. The FigJam "Online" badge and "All Systems Operational" are not shown:
  nothing reports chat availability or system status to the app yet, so the status card links out instead.
- Not built from the FigJam panel: the "Watch quick walkthrough" video, per-step screenshots, the
  "5–7 min" duration chip and the UC id chip (no video, screenshots, durations or Media UC ids exist yet).
- Editor routes run without a Topbar (ADR 0077), so the `?` entry is not offered there.
