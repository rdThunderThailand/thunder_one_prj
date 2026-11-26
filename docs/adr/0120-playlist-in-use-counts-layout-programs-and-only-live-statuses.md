# 0120 — A playlist is in use when a draft or active Program plays it, directly or through a Layout

**Amended by:** [ADR 0125](0125-media-status-badges-use-one-vocabulary-and-one-colour-map.md) — the badge no longer
shows in use; see the amendment at the end.

Supersedes [ADR 0028](0028-playlist-status-derived-from-publication-references.md) on which count
drives the Active/Inactive badge. The shape from 0028 stays: Core returns a count, and
`playlistDisplayStatus()` turns it into the badge.

## Context

On prod (2026-11-20), the playlist "Lat Krabang (Suwannaphum)" showed **Inactive** while the
Program "Lad Krabang" was live. That Program airs the Layout "Lad Krabang", and the playlist sits
in one of its zones. Three rules count Programs per playlist, and none of them agree:

| Rule | Where | Counts |
|---|---|---|
| Status badge (ADR 0028) | `publication_count` in `media_playlists_list`, `media_playlist_get` | `publications.playlist_id = pl.id`, any status |
| Move to Trash guard (ADR 0025, Core #40) | `media_playlist_delete` | `publications.playlist_id = pl.id`, `draft` or `active` |
| Permanent delete (Trash page) | `media_playlist_permanent_delete`, FK `ON DELETE RESTRICT`; frontend gates the button on `publication_count === 0` | `publications.playlist_id = pl.id`, any status |

None of them includes Layout Programs. A Layout Program stores `composition_id` and leaves
`playlist_id` null (ADR 0049 §5). The playlist is reached through `composition_zones.playlist_id`.
So:

- A playlist that is playing through a Layout shows **Inactive**, and Move to Trash **accepts** it.
- A playlist whose only Programs were cancelled shows **Active** but can be moved to Trash. ADR
  0028 promised "Inactive = deletable", and that stopped being true once the guard narrowed to
  draft and active.

Core joins Programs to playlists, Layouts included, inside `media_core.publish_changes_targets`.
That function then keeps only Programs that are `active` and on air or scheduled, which is the
set Publish Changes needs. The badge needs a wider set.

## Decision

A playlist is **in use** when at least one Program with stored status `draft` or `active` plays
it, either directly or through a Layout zone.

1. **One join, one helper.** Move the `candidates` part of `publish_changes_targets` into a new
   helper `media_core.playlist_program_ids(p_tenant_id, p_playlist_id)`. It returns every Program
   that plays the playlist, direct or through a Layout, and does no status filtering. Every caller
   applies its own status filter:
   - `publish_changes_targets` keeps its own filter (active, on air or scheduled), so Publish
     Changes behaves exactly as before.
   - The badge count and the Move to Trash guard filter `status IN ('draft', 'active')`.
2. **A new key, `in_use_count`**, in `media_playlists_list` and `media_playlist_get`. It is the
   number of distinct in-use Programs. `playlistDisplayStatus()` reads this key.
   `publication_count` keeps its old meaning (direct, any status), because the Trash page uses it
   to decide permanent delete and the FK enforces that same rule.
3. **`media_playlist_delete` refuses Move to Trash** when the in-use set is non-empty. The error
   keeps the existing wording, `playlist is used by an active or draft publication: <names>`, so
   `describeDeleteError()` keeps working.

Badge: Active means in use. Inactive means finished and not in use, which is again exactly the
condition under which Move to Trash accepts the playlist. Draft is unchanged and still comes from
the stored `playlists.status`. A frontend that sees no `in_use_count` (Core not yet deployed)
falls back to the stored status, as ADR 0028 already does. Core and frontend can therefore ship
in either order.

## Rejected alternatives

**A — keep "any status" and only add the Layout path.** This is the smallest change, but a
playlist whose Programs were all cancelled stays Active forever, and the badge keeps disagreeing
with the guard. That same drift is what produced this bug.

**C — "on air now", from the schedule (the ADR 0004 derivation).** It matches what a viewer means
by "live". But it costs a schedule evaluation per row on a list page, and it no longer matches the
delete guard: a Program that is scheduled but not yet airing must still block deletion.

**Reuse `publish_changes_targets` as is.** It already filters to active Programs that are on air
or scheduled. Draft Programs would stop protecting their playlists, which loosens the guard from
ADR 0025. Across prod, it would also have given 94 Active playlists instead of 221.

**Repeat the join in each function.** That avoids touching Publish Changes. But keeping the same
rule in more than one place is exactly how the badge and the guard drifted apart.

**Change the meaning of `publication_count` instead of adding a key.** The Trash page would then
offer permanent delete for playlists that the backend and the FK still refuse to delete.

**Stop counting draft Programs.** The badge would sit closer to "really playing", but then either
the guard loosens (contradicting ADR 0025) or the badge and the guard follow different rules again.

## Consequences

- On prod (2026-11-20), 221 of 276 finished user playlists become Active, about 80%. Of those,
  119 are referenced only by draft Programs, and 147 are protected only through a Layout. The
  badge separates little until abandoned draft Programs are cleaned up. If the badge needs to say
  more, fix it at that cause; do not loosen the rule.
- Playlists whose only Programs are cancelled move from Active to Inactive. They can be moved to
  Trash, which was already true before this change. Permanent delete still refuses them, and the
  Trash page still says so, because it reads `publication_count`.
- Playlists used only through a Layout with a draft or active Program become Active, and Move to
  Trash now refuses them.
- A Program whose schedule has ended but which was never cancelled keeps stored status `active`.
  Nothing writes `expired` to publications. Such a Program keeps its playlists Active and
  protected until someone cancels it.
- A playlist used only in a Layout that no Program airs counts as Inactive and can be moved to
  Trash. Permanent delete then fails on the `composition_zones` FK. That failure predates this
  ADR and is tracked separately.
- `playlist_program_ids` is a shared dependency of Publish Changes, the playlist badge and the
  Move to Trash guard. If its meaning changes, all three change with it.

## Amendment — the badge no longer shows in use (2026-11-25)

[ADR 0125](0125-media-status-badges-use-one-vocabulary-and-one-colour-map.md) replaces the paragraph
that starts with `Badge:` under Decision. A playlist now shows only **Draft** or **Active**. Being in
use is a neutral tag, `ใช้ใน N Program`, shown only when `in_use_count > 0`. Elsewhere in this ADR, read
"Active" as *in use* and "Inactive" as *not in use*, which now means *no tag*. Unchanged: the rule for
what counts as in use, the `in_use_count` key, the Move to Trash guard and `playlist_program_ids`.
