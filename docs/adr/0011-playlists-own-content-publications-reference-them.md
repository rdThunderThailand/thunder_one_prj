# 0011 — Playlists own multi-asset content; publications reference, never build

## Context

A publication's Content step let an operator pick assets directly. For
`publication_type = 'playlist'` that produced content with no name and no home:
`media_publication_set_content` created a playlist row named `'pub:' || publication_id`
to hold the items, tagged `kind = 'user'` — the same tag a playlist an operator
deliberately created through `/playlists` carries.

`media_playlists_list` filters on `kind = 'user'`, so those wrappers appear in the
Playlists list beside real playlists. Today that is invisible: the list shows neither
cover nor creator, so a `pub:<uuid>` row reads as a blank entry. Phase 3 turns both on,
at which point a system-generated row would display a cover image and no creator.

Two more properties of the existing code make the wrapper actively dangerous once a
publication can point at a playlist the operator chose:

- `media_publication_set_content` starts with `DELETE FROM playlist_items WHERE
  playlist_id = v_playlist_id`. Pointed at a real playlist, one save empties it.
- `media_video_delete` treats `kind = 'single'` playlists as disposable: deleting an
  asset deletes the playlists holding it *and the publications using them*. That is
  correct for a one-asset wrapper and wrong for a multi-asset one.

Separately, `set_content` rejected more than one item for `image` and `video`
publications, so airing three product photos meant three publications.

## Decision

**A playlist is the only place multi-asset content is authored.** Publications
reference one; they never build one.

- Content step for `publication_type = 'playlist'` becomes a picker over existing
  playlists. The chosen id travels as `playlist_id` on
  `media_publication_upsert`, which already accepts and validates it. The step no
  longer calls `PUT /publications/:id/content` at all.
- `media_publication_set_content` raises for `publication_type = 'playlist'`. Closing
  this path is what makes referencing a real playlist safe — nothing can reach the
  `DELETE playlist_items` line with a playlist the operator owns.
- `image` and `video` publications accept **more than one asset**, all of the same
  kind as the publication type, enforced in the RPC against `media_assets.kind`
  (`NOT NULL CHECK IN ('video','image')`, so no mime-type fallback is needed). Their
  wrapper stays `kind = 'single'`.
- `playlists.kind` gains a third value, `'inline'`, for the multi-asset wrappers
  already in production: hidden from `media_playlists_list` like `'single'`, but
  protected from asset deletion like `'user'` — `media_video_delete`'s guard becomes
  `pl.kind IN ('user','inline')`. Existing `pub:%` rows referenced by a publication are
  backfilled to it. No new `'inline'` row is ever created after this migration.

The three kinds after this change:

| kind | origin | in `/playlists` | editable via playlist API | deleting a member asset |
|---|---|---|---|---|
| `user` | operator, via `/playlists` | yes | yes | blocked |
| `single` | system wrapper, one asset | no | no | deletes wrapper + publication |
| `inline` | system wrapper, legacy multi-asset | no | no | blocked |

Rejected: **backfilling the legacy wrappers to `'single'`** to avoid adding a value.
`media_video_delete` would then delete a whole publication because one of its five
images was removed. The behaviour difference is real, so the value has to be.

Rejected: **filtering rows whose name starts with `pub:` in the frontend.** An
operator can legitimately name a playlist `pub:something`, and the rule would have to
be repeated in every consumer of the list. The distinction belongs in the column that
exists for it.

Rejected: **migrating legacy wrappers into named playlists** so old publications get a
real reference. It rewrites production content to serve presentation, and leaves the
operator with playlists they never created. Old publications keep showing their content
read-only; editing one means picking a playlist.

Rejected: **capping the number of assets on an `image`/`video` publication.** No number
is known to be the wrong one yet.

## Consequences

The Playlists list becomes exactly the playlists an operator made — which is what
Phase 3's cover and "Created by" columns assume.

`media_publication_set_content` is now only reachable for `image` and `video`. If a
future content type needs inline items again, it needs its own decision, not a quiet
re-opening of the `playlist` branch.

Publications sharing one playlist is now possible and unguarded: editing that playlist
changes what every referencing publication airs. That is the point of referencing, but
nothing warns the operator. Revisit if it surprises anyone in practice.

A draft saved before this change holds `assetItems` for a playlist-type publication and
cannot be rehydrated into the new shape. The localStorage key is versioned and old
drafts are dropped rather than migrated.
