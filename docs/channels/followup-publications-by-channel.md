# Follow-up — reading Channel ↔ Publication linkage for display

**Superseded in part by ADR 0037 (2026-08-21).** The original premise of this ticket — that no
Channel↔Publication linkage existed — was wrong at the database layer. It was true only of the
frontend and of `GET /media/publications`.

## What turned out to already exist

Verified against ThunderCore (`sfiefevtxalqjizdkcsw`), 2026-08-21:

- `media_core.publication_targets` has `target_type` and `channel_id`.
- `media_publication_upsert` accepts `target_type:'channel'`; `media_publication_activate` expands a
  channel target into its devices for `publish_job_targets`; `media_publication_get` returns channel
  targets with a resolved name.
- What was missing was a *producer*: wizard step 3 sent device targets. ADR 0037 changed that, so
  the Publications tab question is now answerable from `publication_targets` directly.

`channel_rows` also returns `publication_count` as of migration `103`, which is what the derived
Active/Inactive status reads.

## What is still blocked

Only the **Summary panel thumbnail** — a preview image of whatever the Channel is currently showing.
A Publication has no image field of its own; it resolves through
`playlist_id → cover_asset_id → POST /media/videos/preview-urls`. That is a chain of hops with no
batch endpoint, and it is a display nicety rather than a correctness gap, so it stays a
"No preview available yet" placeholder.

The **Publications tab** on the Channel detail panel is no longer blocked on a backend change. It
needs either:

- **Option A** — a `channel_id=` query parameter on `GET /media/publications`, resolved server-side
  against `publication_targets`. One round trip, no client-side matching.
- **Option B** — `target_channel_ids: string[]` on `PublicationListItem`, letting the frontend match
  client-side.

Option A is the better shape now that channel targets are the normal case: it keeps "which
Publications does this Channel have" as one question the database answers, and it does not grow the
list payload for the pages that do not care.

Note that ADR 0039 freezes a Publication's targets at publish time, so either shape must say whether
it reads the draft `publication_targets` or the post-activation snapshot. For a Channel target the
two agree far more often than they did for device targets, because the Channel id survives device
membership changes — but "which devices" and "which Channel" are still different questions.
