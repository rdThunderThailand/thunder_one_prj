# 0030 — Channel membership is a flat set of equal Media Devices, exclusive to one Active Channel

Supersedes the single-file draft `0030-channel-endpoints-and-monitoring.md`, which bundled
membership, lifecycle, snapshot and monitoring into one undivided decision. That draft is replaced
by this ADR plus 0038, 0039, 0035 and `docs/channels/plan-channels-monitoring.md`. (0031 and 0032
went to concurrent playlist work while this set was being reviewed, so the Channel ADRs are not
contiguous.)

## Context

Production evidence, queried against `ThunderCore` (`sfiefevtxalqjizdkcsw`) on 2026-08-19/20 — not
read from documents:

- `media_core.channels` is `(id, tenant_id, name, status, metadata jsonb, created_at, updated_at,
  channel_type, location_id, estimated_daily_impressions)`. It has **no** category column separate
  from `channel_type`, no revision, no `activated_at`, no display expectation.
- `channels_channel_type_check` accepts `dooh, in_store, website, social, email, mobile_app`.
  `channels_tenant_id_name_key` makes `(tenant_id, name)` unique.
- `media_core.channel_devices` is `(channel_id, device_id, role, created_at)`, PK
  `(channel_id, device_id)`, **no `tenant_id`** (the same absence ADR 0007 records for every media
  join table). `role` is `NOT NULL DEFAULT 'primary'` under
  `channel_devices_role_check CHECK (role IN ('primary','backup'))`.
- **`channel_devices.device_id` is a foreign key to `public.assets(id)`**, not to `public.devices`.
  Both tables exist; only `assets` is wired into Media Workspace.
- Live data: 2 channels (both `active`, both `dooh`, both `location_id IS NULL`) and 6
  `channel_devices` rows, all `role = 'primary'`.
- **No database function named `%channel%` exists.** The Channel API is greenfield, so no existing
  caller constrains the shape chosen here.
- `src/types/domain.ts:4` declares `ChannelType = "dooh" | "in_store" | "online" | "social" |
  "other"` and it has **zero consumers** — only `Channel.type` in the same file reads it.

Three things had to be decided before any of that can be built: who is allowed to operate a
Channel, what a member of a Channel *is*, and what stops one physical screen from being driven by
two Channels at once.

## Decision

### Channel authority moves to the Media Operator

**A Media Operator may create, edit, activate and deactivate a Channel, and may assign an existing
Media Device to it. A Media Operator may not register or edit Media Device master data.**

This reverses the product policy previously recorded in `CONTEXT.md` ("Cannot manage
Org/User/Role/Device/Channel"). The rationale is that a Channel is a *targeting* object — it is the
thing an operator picks in the Publication wizard — while a Media Device is *inventory*. Requiring
an Administrator to create the targeting object every time an operator wants to publish somewhere
new makes the Administrator a ticket queue for routine content work. Device master data stays with
the Administrator because registering hardware is an inventory act with a pairing token attached.
`CONTEXT.md`'s Roles section is updated in the same change set; this ADR is the record of why.

Runtime enforcement uses backend capabilities, not a client-side role string:

| capability | gates |
| --- | --- |
| `media.channels.read` | list / detail / monitoring read models |
| `media.channels.manage` | create, edit, delete Draft |
| `media.channels.activate` | Activate / Deactivate |
| `media.devices.assign` | add / remove Media Device membership |
| `media.monitoring.incidents.manage` | acknowledge / resolve incidents |

**The Channel write API is a release gate.** Until Thunder_Core can evaluate these capabilities,
the write endpoints do not ship — read-only Channel UI may ship ahead of them. This matters because
`Thunder_Core/src/lib/core/media.ts:11` authenticates the *application*, not the user (ADR 0003's
evidence: `p_actor_id` is hardcoded `null` and `published_by` is NULL on all 27 publications).
Shipping Channel writes before user identity reaches the media API would mean an unauthenticated
mutation surface wearing an operator's name.

### Canonical Media Device identity is `public.assets.id`

For this phase, a Media Device *is* the `public.assets` row that `channel_devices.device_id`
already points at. `public.devices` is a separate registry belonging to another context; unifying
the two is deferred and remains the open question ADR 0024 opened. Every field, RPC parameter and
API key in the Channel work says `media_device_id` and carries an `assets.id` value.

### Members are equal; `role` is deprecated, not dropped

A Channel contains one or more Media Devices that all receive the same media and the same Schedule.
There is no primary/backup, no priority, no failover, no automatic takeover.

`channel_devices.role` is `NOT NULL DEFAULT 'primary'`, so new writers can simply omit it and every
row keeps the value the six existing rows already have. The column is therefore **deprecated now
and dropped later**, after a consumer sweep confirms nothing reads it. Nothing in this phase writes
`'backup'`; the CHECK constraint stays until the drop.

### One Media Device may be reserved by only one Active Channel

A Media Device may be prepared in any number of **Draft** Channels — that is how an operator stages
a replacement Channel before cutting over. It may be held by exactly one **Active** Channel.

Enforcement is a reservation table, not a constraint on `channel_devices`:

```
media_core.channel_device_reservations
  tenant_id         uuid not null
  channel_id        uuid not null references media_core.channels(id) on delete cascade
  media_device_id   uuid not null unique references public.assets(id) on delete restrict
  ...
```

`media_device_id UNIQUE` makes the exclusivity a database guarantee rather than a check-then-insert
race. `tenant_id` is stored even though the unique key does not need it, because tenant isolation
in this system lives in the RPC layer, not in RLS (ADR 0007) — and `channel_devices`' missing
`tenant_id` is precisely the gap that let a cross-tenant link exist there. The RPC verifies that the
channel's `tenant_id`, the reservation's `tenant_id` and the asset's `tenant_id` agree before
inserting.

Rows are created when a Channel activates and removed when it deactivates or is deleted — inside
the activation transaction described in ADR 0038. Deactivation cannot strand a running Publication,
because ADR 0038 blocks it while one is still targeting the Channel.

The foreign key to `public.assets` is **`ON DELETE RESTRICT`**, not `CASCADE`. A cascade would let
deleting an asset silently drop the reservation and leave an Active Channel holding a device it no
longer exclusively owns — the exact state this table exists to make impossible. Deleting a Media
Device that is reserved, a Channel member, or referenced by a Publication target is refused; the
existing `channel_devices_device_id_fkey` cascade is a pre-existing hole tracked in the plan.

### Category and Type are two different axes

**Channel Category** is the delivery family: `dooh`, `in_store`, `online`, `social`. **Channel
Type** is a controlled business-display subtype within a Category (`LED Display`, `Menu Board`).

The existing `channels.channel_type` column holds Category values despite its name, so it is
**renamed to `channel_category`** and keeps its CHECK constraint. Renaming is cheap exactly once:
no `%channel%` RPC exists and `ChannelType` has no consumers, so nothing outside the migration reads
the old name today.

Channel Type gets a **reference table** (`media_core.channel_types`), not a CHECK constraint:
Category is a closed technical vocabulary that decides which connector runs, while Type is business
furniture that grows whenever someone sells a new kind of screen. A CHECK makes "add Kiosk" a
migration; a seeded table makes it a row. Types are scoped per Category so a Menu Board cannot be
picked for a Social Channel.

- `website → online` is a real value migration: update the two-row table's data (currently zero
  rows use `website`) and rewrite `channels_channel_type_check`. Renaming a value nobody uses costs
  one migration now and avoids a permanent translation layer.
- `email` and `mobile_app` are removed from the accepted set and any row carrying them goes to
  manual review. Neither is a signage destination and neither has a row today.
- `other` leaves the TypeScript contract (`src/types/domain.ts:4`). It has no consumers, so removing
  it breaks nothing, and an open-ended catch-all in a four-value controlled vocabulary is how
  unclassifiable rows accumulate.

## Rejected alternatives

**Keep Channel management with the Administrator (the previous policy).** Safer on paper, but it
makes every new publishing destination an Administrator ticket while the Administrator has no
content context to review it with. The real separation of duty is inventory vs. targeting, and this
decision puts the line there instead.

**Enforce exclusivity with a partial unique index on a denormalised
`channel_devices.is_channel_active`.** Fewer tables, and it was the first suggestion during review.
Rejected: the flag has to be kept in step with `channels.status` by every lifecycle path, and a
stale `true` silently blocks a device forever with no row to point at when explaining why. A
reservation row is self-describing — the conflict response can name the holding Channel because the
row *is* the holder.

**Enforce exclusivity in the RPC with a `SELECT … WHERE status='active'` check before insert.** No
schema change, and it is what most of `media_core` does today. Rejected: two concurrent activations
of two Channels sharing one device both pass the check. The failure is rare, silent, and produces
exactly the double-playback state this rule exists to prevent.

**Drop `channel_devices.role` immediately.** One fewer migration step. Rejected: the column is
`NOT NULL` and Thunder_Core's tracked source has not been swept for readers; a drop that lands
before an unnoticed `SELECT role` is a production 42703, and the default makes waiting free.

**Model members as a new `endpoints` abstraction covering future Online/Social connectors.** The
superseded draft used the word "Endpoint" for this. Rejected: connector-backed destinations have no
schema, no protocol and no delivery semantics yet, and `CONTEXT.md` already spends a glossary entry
disambiguating Device/Screen/Player. A fifth noun for a set with one member type is vocabulary debt
paid in advance.

**Give Channel Type a CHECK constraint like Category has.** Symmetric, one fewer table, and it is
how `channel_type` works today. Rejected: the two vocabularies have different lifetimes. Category
changes when the platform gains a connector — roughly never. Type changes when sales meets a new
kind of screen, and a constraint rewrite per display subtype is a migration queue nobody will keep
up with; the values would end up in `metadata` instead.

**Merge Category and Type into the single existing `channel_type` column.** Recommended during
review, when the two looked like the same list. Rejected once `CONTEXT.md`'s definitions were
written out: Category is the delivery family that decides which connector runs, Type is display
furniture (`LED Display`, `Menu Board`) that decides nothing technical. Collapsing them would make
"add a Menu Board subtype" a change to the connector vocabulary.

## Consequences

- Migrations needed: rename `channels.channel_type` to `channel_category` and rewrite its CHECK
  (expand → migrate `website → online` → narrow); add the `channel_types` reference table and
  `channels.channel_type_id`; create `channel_device_reservations`; comment `channel_devices.role`
  as deprecated. Sequence and preflight queries live in
  `docs/channels/plan-channels-monitoring.md`.
- Activation can now fail with a conflict that names another Channel. That response shape is part of
  the API contract, not an error string — the UI has to render "held by *Channel X*", so the
  conflict payload carries the holding `channel_id` and name.
- Reassignment is never implicit. There is no "move device" that silently deactivates the other
  Channel; the operator deactivates the holder first.
- `public.devices` integration stays out of scope. Any later unification has to migrate
  `channel_devices.device_id` and `channel_device_reservations.media_device_id` together.
- The capability list is a contract Thunder_Core does not implement yet. Until it does, the Channel
  feature ships read-only, and the plan's release gates track that.
