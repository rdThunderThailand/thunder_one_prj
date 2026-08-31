# Per-Zone content binding before publish

**Status:** **SUPERSEDED in full** by `0049-composition-layout-with-content.md` · 2026-08-26
**Do not build from this document.** It was accepted and implemented the same day, then replaced:
content lives on a **Composition**, not on the Publication. `publication_zones`,
`publications.layout_id` and `media_publication_set_zones` do not exist and are not to be created.
The parts of its implementation that survive are named in ADR 0049's Consequences.
Its references to the §11 capability gate are historical design: that gate was never built, and ADR
0054 defers device-capacity enforcement entirely. Read them as the reasoning of the day, not as a
requirement.
**Extended:** `0044-multi-zone-layout.md` §1, §5 · `0045-publication-snapshot-materialization.md` §1, §2

## Context

ADR 0044 §1 places per-Zone content binding inside **step 2 (`Content`) of the existing five-step
Publication wizard**, and §5 says the composition is materialized into the Publication snapshot at
publish time. Neither says where the binding lives *between* those two moments — while the
Publication is still a draft.

What exists today:

- A flat Publication's content is stored as an **implicit Playlist**. `media_publication_set_content`
  creates or replaces that Playlist from `items[]` and returns its `playlist_id`, which hangs off the
  Publication row. There is no publication-owned item table.
- The wizard's own working state is client-side only — a zustand store persisted to `localStorage`
  under a versioned key. It is a resume aid, not a record.
- `publication_snapshot_zones` / `publication_snapshot_items` already exist and already carry
  `source_layout_zone_id`, geometry bounds and a `playback` jsonb. The gap ADR 0045 leaves is the
  **writer and the reader**, not the schema.

So the question is narrow: what does the writer read from at activation time?

## Decision

### 1. A Publication owns Zone bindings in a table, not a blob and not the browser

`media_core.publications` gains `layout_id uuid NULL REFERENCES media_core.layouts(id)`.
A new table holds one row per bound Zone:

```
media_core.publication_zones
  id, tenant_id, publication_id,
  layout_zone_id      -- NOT NULL, FK → layout_zones, ON DELETE CASCADE
  position            -- dense, 0-based; mirrors the Layout's Zone order
  playlist_id         -- NOT NULL, FK → playlists
  playback jsonb      -- play_mode / repeat / start_from, same shape and CHECK as the snapshot Zone
  UNIQUE (publication_id, layout_zone_id)
```

`layout_id IS NULL` and zero `publication_zones` rows is exactly a flat Publication — the existing
path, untouched. `layout_id IS NOT NULL` requires one row per Zone of that Layout before publish.

Rejected: **`publications.metadata.zones` as jsonb.** Cheapest to write and the worst to live with —
no FK, so the asset hard-delete protection of ADR 0045 §10 cannot see a Zone's assets, the §11
capability gate cannot count video Zones with a join, and every validation moves into hand-written
plpgsql over jsonb.

Rejected: **keep bindings in `localStorage` until activation.** A draft would not survive a different
browser or a second operator, the existing explicit *Save draft* affordance would silently not save
half the Publication, and step 5 (`Review & Publish`) plus the §11 gate need the binding server-side
to evaluate at all.

### 2. A Zone's content is a Playlist — no new item table

Each `publication_zones` row points at a Playlist, resolved the same two ways step 2 already offers
for flat Publications: an existing saved Playlist, or an implicit one built from picked assets. That
reuses playlist ordering, durations, transitions, content-compatibility and asset-delete protection
wholesale, and it is what makes the Layout case one Playlist per Zone instead of a parallel content
subsystem.

Rejected: **`publication_zone_items`.** A second, near-identical copy of `playlist_items` whose only
difference is its parent.

### 3. Geometry is never copied into `publication_zones`

The binding stores `layout_zone_id` and nothing spatial. Geometry is read through the Layout while
the Publication is a draft, and frozen only at activation, into `publication_snapshot_zones`. Editing
a Layout therefore changes what an unpublished draft *will* air and never what is already airing —
which is precisely the line ADR 0044 §5 draws (it rejects resolving geometry at **poll** time, not at
publish time).

Consequence: deleting a Zone from a Layout cascades its bindings away. Step 2 re-validates against
the Layout on load and flags a Layout whose Zone set has drifted since the binding was made, rather
than silently publishing a Layout with an unbound Zone.

### 4. The wizard writes bindings through a Zone endpoint of its own

`PUT /media/publications/:id/zones` → `media_publication_set_zones`, replacing the whole binding set
for the Publication in one transaction, tenant-filtered inside the RPC.

Rejected: **widening `media_publication_set_content` with a `p_zones` argument.** Adding a parameter
to an existing function creates an overload rather than replacing it, making every existing call
ambiguous unless the old signature is dropped first — and the flat contract has no reason to move.

### 5. Activation copies bindings into the snapshot; nothing else reads them

`media_publication_activate` writes one `publication_snapshot_zones` row per `publication_zones` row
(geometry and role read from `layout_zones` at that instant, `source_layout_zone_id` recorded for
tracing) and expands each Zone's Playlist into `publication_snapshot_items` under that Zone.
`media_job_poll` continues to read snapshots only, per ADR 0045 §5.

## Consequences

- The `zones[]` payload (0044 §9), the capability gate (§11) and the equal-priority block (§8) all
  have a joinable server-side source for "does this Publication use a Layout, and how many Zones of
  what kind".
- `localStorage` keeps mirroring step 2 for resume-after-reload only, exactly as it does for flat
  content. It stops being a source of truth the moment the draft is saved.
- The draft store's persisted shape changes, so its key version must be bumped — a rehydrated older
  draft cannot describe Zone bindings.
