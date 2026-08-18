# 0023 — Asset Intelligence feature folders use an `ai-` prefix, not a renamed entity

## Context

Asset Intelligence's core entity is called `Asset`: an organization-wide physical asset (laptop,
printer, NAS, or media-player hardware). This repo already has an entity called `Asset` —
`src/features/assets` and `CONTEXT.md`'s glossary entry for it — meaning a reusable media file
(image/video). These are two different things sharing one English word, and the collision is real:
`features/assets` already exists, is fully built, and cannot be reused for the new domain.

The two meanings are not just an accidental naming clash to be designed around. Asset Intelligence's
`Asset` category taxonomy explicitly includes `media_player_device` — hardware whose job is to run
Media Workspace's Device role (`CONTEXT.md`'s `Device` glossary entry: "the physical player/endpoint
that receives and plays content"). When an Asset Intelligence `Asset` of that category is assigned to
a department, it becomes — via a cross-reference recorded on the Asset row (see ADR 0024) — the same
physical hardware Media Workspace tracks as a `Device` through `channel_devices`. The word `Asset`
being shared across both modules reflects a real relationship between two systems, not a coincidence
that renaming would hide.

An earlier draft of this plan proposed renaming the new entity to `Equipment` specifically to dodge
the collision. That was walked back: `Asset` is the term the business actually uses for this domain,
and hiding the shared vocabulary behind a different name would make the Asset↔Device relationship
*less* visible in code review, not more — a reviewer seeing `Equipment.externalRef` pointing at a
`Device` row would have to already know the two systems are related; a reviewer seeing
`Asset.externalRef` on an `Asset` of category `media_player_device` sees the relationship stated in
the type itself.

## Decision

**Collision avoidance happens at the folder/namespace level, not the entity-name level.** Every Asset
Intelligence feature folder is prefixed `ai-`: `src/features/ai-assets`, `src/features/ai-mission-
control`, and (in later sprints) `ai-departments`, `ai-work-orders`, `ai-issues`, `ai-service-ops`.
`src/features/assets` (Media Workspace) is untouched — no rename, no re-export shim, no migration.

Within `features/ai-assets`, the exported type is named `Asset` — following this domain's own
vocabulary, exactly as `features/assets` names its own type `Asset` for its domain. The two types
never appear in the same import statement by construction: `features/assets`'s `Asset` is reached via
`@/features/assets`, `features/ai-assets`'s `Asset` is reached via `@/features/ai-assets`, and the
existing feature-boundary rule already in this repo's README ("a feature should not reach into
another feature's internals — only import from another feature's `index.ts`") means any file that
needs both must alias one on import (`import { Asset as PhysicalAsset } from "@/features/ai-assets"`)
— an explicit, visible disambiguation at the one call site that needs it, rather than a permanent
rename that every call site pays for.

Route paths get the same treatment for the same reason: Asset Intelligence's asset list lives at
`/asset-intelligence/assets`, distinct from Media Workspace's `/assets`, by virtue of route
namespacing (ADR 0022) rather than a different route segment name.

## Options rejected

**Rename the new entity to `Equipment`.** Rejected per the Context above — it was the original
proposal and was reversed once the Asset↔Device relationship was confirmed to be a real cross-module
link, not a naming accident. `Equipment` would have been a permanent, repo-wide euphemism for a word
the business actually uses.

**Rename the existing `features/assets` (media files) instead.** Rejected outright — that feature is
fully built, referenced throughout `publications`/`playlists`, and documented in `CONTEXT.md` under
`Asset` with an explicit `_Avoid_: Video, media file, content` note. Renaming it to accommodate a
feature that doesn't exist yet inverts the cost for no benefit.

**No namespace at all — let TypeScript's module system handle two same-named exported types via
qualified imports everywhere.** Technically works (TypeScript allows two types both named `Asset` in
different modules), but relies on every future contributor remembering to alias correctly with no
folder-level signal that a collision exists. The `ai-` prefix makes the distinction visible in the
file tree and in every import path, not just at disambiguation call sites.

## Consequences

Every new Asset Intelligence feature folder name is one character longer and slightly less clean
than it would be without the prefix (`ai-mission-control` vs. `mission-control`). This is a
one-time, permanent naming tax accepted in exchange for zero risk of a future feature folder
silently colliding with an existing Media Workspace one.

`ai-` reads, to someone unfamiliar with this decision, as if it stands for "AI" (artificial
intelligence) rather than "Asset Intelligence." This ADR is the canonical place to point a confused
reader; no additional disambiguation (e.g. a comment in every `ai-*` feature's `README.md`) is added
beyond each such README linking back here, which Sprint 1's scaffolds already do.
