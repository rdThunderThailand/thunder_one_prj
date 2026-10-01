# 0081 — Programs and Now & Next get their own routes

Status: accepted (2026-10-01, grilling session after v0.5.0). Amends ADR 0072 and `CONTEXT.md` ("the route stays `/media-workspace/publications`").

## Context

Two operator-facing pages shared one route prefix with the API's noun: the Programs list lived at `/media-workspace/publications/manage` and Now & Next at `/media-workspace/publications`, so the page called "Programs" sat under a "manage" suffix of the page called "Now & Next". UI strings already say Program (ADR 0072); only the URLs still said Publication.

## Decision

1. Routes, all under the app's `/media-workspace` base path (the app switcher and nav are keyed to it):
   - `/media-workspace/program` — the Programs list (was `publications/manage`)
   - `/media-workspace/program/create`, `/program/[id]`, `/program/[id]/edit` (were `publications/...`)
   - `/media-workspace/now-next` — Now & Next (was `publications`)
2. The old URLs stay alive: `next.config.ts` has permanent (308) redirects, query strings preserved. Drop them when no bookmark or shared link can still point there.
3. Only the App Router routes and the `href` / `router.push` targets move. The feature folder `src/features/media-workspace/publications/`, the `/media/publications` API, type names and the schema keep "publication" — the UI-says-Program / API-says-Publication split stays.

## Rejected

- Top-level `/program` and `/now-next`: breaks the `basePath` the app switcher relies on and touches the app shell for no operator benefit.
- Moving only the list and Now & Next: one flow would mix `/program` and `/publications/[id]/edit`.
- Renaming the feature folder, API and types: a cross-repo breaking change (Thunder_Core) for a naming nicety.
- No redirects: prod went live on v0.5.0 on 2026-10-01; bookmarks and chat links exist.

## Consequences

- Links that meant "the Programs list" but pointed at `/media-workspace/publications` (Now & Next) were first kept as-is and pointed at `/now-next`. v0.5.2 decided they mean Programs and repointed them to `/program`: `PublicationEditPage` (breadcrumb, discard, and the Duplicate / Publish / View Published Version id links, now one `PROGRAM_HREF`), `PublicationDetailPage` and `CreatePublicationPage` back/cancel/after-save targets, Channel Group inspector "View Programs →", Edit Channel sidebar "Go to Programs". Still Now & Next on purpose: `LowerOverview` "View full calendar →" (a schedule view), `ChannelDetailPanel` "Now Playing → View Programs →" (its `?q=` filter is read only by Now & Next), `DemoPublicationDetailPage` back link.
- Ships as v0.5.1 together with the Ended-page button fix (owner's call, same PR).
