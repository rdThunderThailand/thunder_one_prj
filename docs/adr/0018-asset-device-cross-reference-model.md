# 0018 — Asset↔Device cross-reference: a category value and a nullable pointer field

## Context

Asset Intelligence owns the lifecycle (register/track/manage/assign) of every physical asset an
organization holds. Media Workspace already owns a narrower but overlapping concept: `Device`
(`CONTEXT.md`'s glossary — "the physical player/endpoint that receives and plays content," tracked
via `media_core` and joined to `Channel` through `channel_devices`, per ADR 0007's evidence that
`channel_devices` carries no `tenant_id` of its own and inherits scope from its parent). A screen or
media player is, from Asset Intelligence's point of view, one category of asset among many
(alongside laptops, printers, NAS); from Media Workspace's point of view, the same physical box is a
`Device`. Both descriptions are true of the same hardware at the same time.

This repo has no code yet that models that relationship — `features/ai-assets` does not exist before
this ADR, and `media_core`'s `channel_devices` has no column pointing at anything outside
`media_core`. Sprint 1 (ADR 0016/0017) is standing up the Asset Intelligence feature shell and its
first entity type; this ADR decides what that type's shape has to be from the start, because adding
a cross-reference field after `ai-assets` rows already exist is a migration this project does not
need to create for itself.

The direction of the foreign key — does Asset Intelligence store a pointer to the `media_core` Device
row, does `media_core` store a pointer back to the Asset Intelligence Asset row, or both — is a
decision that spans two systems (this frontend repo and the separate `Thunder_Core` backend) and two
teams. It cannot be settled by reading this repo alone; `Thunder_Core`'s schema and its own team's
constraints are the other half of the answer, and no conversation with that team has happened yet
(see `docs/asset-intelligence/questions-thunder-core-contract.md`, opened by this ADR).

## Decision

**`Asset.category` is a taxonomy that includes `media_player_device` as one value among several, and
`Asset.externalRef` is a nullable string field reserved for the cross-reference key — populated only
when the asset has actually been assigned to fill a Device role, left `null` for every other asset.**
This is the minimum shape needed to represent "this Asset is also a Device" without deciding, yet,
which system is the source of truth for the link.

Concretely, for this sprint:

1. `Asset.category` is a union type: `"laptop" | "printer" | "nas" | "media_player_device" | "other"`
   (per the requirement doc's data model — `laptop`/`printer`/`nas`/`media_player_device` named
   explicitly, `other` added as the catch-all every such taxonomy needs from day one rather than
   requiring a migration the first time an uncategorized asset shows up).
2. `Asset.externalRef: string | null` exists on the type now. Nothing in Sprint 1 writes to it —
   there is no assignment flow yet (that's Sprint 2+, ADR 0019's state machine) and no `Thunder_Core`
   contract to write against. It ships as an unused, always-`null` field in the mock data this
   sprint, deliberately, so the type shape does not have to change again once the assignment flow and
   the cross-system contract both land.
3. **Which side owns the foreign key is explicitly left open**, recorded as an unresolved question
   for the `Thunder_Core` team rather than guessed at here. Both directions are defensible (Asset
   Intelligence storing the Device id keeps the pointer next to the entity whose lifecycle drives the
   assignment; `media_core` storing the Asset Intelligence id keeps it next to the entity that
   actually consumes it for playback/targeting) and neither can be ruled out from this repo alone.

## Options rejected

**Model the cross-reference as a separate join table/entity now (`AssetDeviceLink`) instead of a
field on `Asset`.** More "correct" if the relationship ever becomes many-to-many, but nothing in the
requirement doc suggests it will — one physical asset maps to at most one Device role. A join
table for a 1:1 relationship that doesn't exist yet, decided by a team that hasn't been consulted, is
speculative in exactly the way this repo's own conventions warn against (see `AGENTS.md`/`CONTEXT.md`
phasing notes throughout `docs/adr/`). A single nullable field is trivially widened into a join table
later if the requirement changes; the reverse (collapsing a join table back into a field) is the more
disruptive direction, so starting narrow is the lower-risk default.

**Wait until the Thunder_Core conversation happens before adding `externalRef` to the type at all.**
Keeps the type "clean" until the contract is known. Rejected because `ai-mission-control`'s stat
tiles (Sprint 1) need `Asset.category` to exist and be meaningful now to compute counts like "assets
by category," and defining `category` without also reserving the field its most important category
value depends on (`media_player_device` needing somewhere to point) means redoing the type twice
instead of once.

**Decide the foreign-key direction now, unilaterally, from this repo.** Rejected — this repo cannot
see `Thunder_Core`'s schema or that team's constraints, and ADR 0007 already established the pattern
of citing real evidence from both sides of an integration before deciding scoping questions like
this one. Guessing here risks writing Sprint 2+ code against a contract that has to be reversed once
the actual conversation happens.

## Findings deliberately not acted on

- **`channel_devices` (`media_core`) has no column reserved for an Asset Intelligence pointer today.**
  Adding one is `Thunder_Core`'s change to make, not this repo's — out of scope until the direction
  question above is resolved.
- **The Technician work-order → Channel status feedback loop** described in the requirement doc
  (repairing a `media_player_device` asset should be reflected as "Offline — under maintenance" on
  the corresponding Channel in Media Workspace) requires an event/webhook mechanism between the two
  modules that does not exist yet. Not designed here; it depends on the foreign-key direction this
  ADR leaves open.

## Consequences

`Asset.externalRef` ships unused this sprint — a reviewer will find a field with no writer and no
reader anywhere in the codebase. That is intentional (see Decision, point 2) and should not be
"cleaned up" by removing it; removing it would just recreate the migration this ADR exists to avoid.

Every `ai-assets` mock/test fixture with `category: "media_player_device"` should leave `externalRef:
null` until the Thunder_Core contract lands — a mock fixture populating it with a made-up value would
imply a contract shape nothing has actually agreed to yet.
