# 0009 — Step 2's media filter defaults from the draft's Publication Type

Status: Accepted — 2026-08-06

## Context

Step 2 (Content) of the Create Publication wizard shows the tenant's media library
with a type filter. The requirement asks for this mapping:

| Publication Type | Media filter |
| --- | --- |
| Image | Images |
| Video | Videos |
| HTML / Web | Web Content |
| Dynamic | Dynamic Content |

plus: read the type from the draft rather than a route parameter, fall back to
All Media when the type is missing or unusable, let the user change the filter, and
never let a filter change rewrite the publication type.

Two facts from production decide most of this:

1. `media_core.media_assets` carries a CHECK constraint
   `kind = ANY ('video','image')`. **A web or dynamic asset cannot exist**, in any
   tenant, without a schema migration. Live data is 6 video + 3 image rows.
2. `media_core.publications.publication_type` in production is playlist 12,
   video 14, image 5 — **no html or dynamic publication has ever been created.**

So two of the four rows in that mapping table name a media category the platform has
no representation for.

## Decision

**Map what exists; route everything else to All Media.**

- `image` → Images, `video` → Videos.
- `html`, `dynamic`, `playlist`, and any unrecognised value → All Media.
- The filter dropdown offers exactly three options: All Media, Images, Videos.
- The default is computed when the step mounts, from `basicInfo.publicationType` in
  the persisted draft store. No route parameter is involved anywhere in this step.
- The filter is component-local state. It is never written back to the draft.

This satisfies the requirement's own fallback rule — html and dynamic are precisely
the "missing or unusable" case today — without shipping dropdown entries that are
guaranteed to return zero results.

### The filter resets whenever Step 2 is re-entered

`CreatePublicationPage` renders the step as `{step === 2 && <ContentStep/>}`, so
leaving and returning unmounts and remounts it, re-running the initializer. A filter
the user picked by hand does not survive a trip back to Step 1.

That is the intended behaviour: the acceptance criterion is that the default matches
the type after navigating, and any form of remembering makes that true only on first
entry. Persisting the filter into the draft was rejected outright — it would make a
view preference part of saved publication state, contradicting the rule that filtering
must not touch the draft, and would force a version bump on the localStorage draft key.

### A mapping table was rejected

Two live rows do not justify a lookup structure; the table would be longer than the
conditional it replaces, and it would be an abstraction with a single implementation.
When the media library grows new kinds, the option list, the predicate, and the filter's
type union all have to change together anyway.

## Consequences

- Creating an HTML/Web or Dynamic publication lands on Step 2 showing every asset.
  Since neither type can have a matching asset, this is the only non-empty thing to
  show.
- Playlist publications also show All Media. Today Step 2 is where a playlist is
  assembled from several assets, so both images and videos must be visible at once.
- **When `media_assets.kind` gains new values, this ADR needs three more rows** —
  `Playlist → Playlists`, `HTML/Web → Web Content`, `Dynamic → Dynamic Content` —
  and each needs: a new `<option>`, a widened `typeFilter` union, and a predicate that
  is no longer the binary `isImageAsset()`. The planned direction is for a playlist to
  become a saved asset of its own kind, built on a dedicated page, and then selected in
  Step 2 like any other single asset — which also changes Step 2's playlist flow from
  "pick many" to "pick one".
- Filtering stays client-side over the full `GET /media/videos` response. At single-digit
  asset counts, adding a server-side filter parameter would be work with no observable
  effect.
