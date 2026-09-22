# Publication Media Picker is local before it is shared

**Status:** accepted · 2026-09-10 — revised later the same day (see Revision below): the approval
gate is dropped and the picker's kind is derived from the first staged Asset
**Extends:** `0072-the-create-wizard-reshapes-the-steps-not-the-publication.md` §3 and Consequences

## Context

Frame 1.1 of the ver02 Create wizard needs a modal Media Picker with a filter rail, asset grid,
read-only selected-item detail panel, staged multi-select, and pagination. The existing
`playlists/components/AssetPicker.tsx` serves the Playlist editor and Composition Zone picker via
`AddItemDrawer.tsx`. It has a different layout and filter contract, and it permits selecting an
unapproved Asset. That is valid for Playlists but a Publication draft containing that Asset cannot
be saved: `media_publication_set_content` refuses it.

## Decision

Create `publications/components/MediaPickerModal.tsx` for the wizard's Media branch. It reuses
`publications/components/AssetCard.tsx`, so the Publication approval gate remains at the selection
boundary. The modal owns its filter, pagination, staged-selection, and read-only detail state;
only Select writes the resulting Asset items to the existing publication draft store.

The component has the four visual seams required by ADR 0072: filters, results, detail, and
selection footer. It is intended to be reused by the Playlist and Layout pickers only after their
concrete contracts are implemented.

## Considered Options

1. Lift `AssetPicker` filter state into props. This would give one component two incompatible
   layouts and still require re-adding the Publication approval gate.
2. Extract an `AssetGrid`. The existing grid markup does not match the Frame 1.1 card/detail
   contract, leaving an abstraction with one real caller.
3. Create `MediaPickerModal` locally. This keeps the existing editor callers unchanged and retains
   the approval gate through `AssetCard`.
4. Expand `AddItemDrawer` into the shared shell now. This combines separate commit contracts and
   widens Ticket #79 into cross-feature work before #80 and #81 establish what they share.

Option 3 is chosen.

## Consequences

- Two asset-grid implementations remain temporarily: `AssetPicker` for existing editor flows and
  `MediaPickerModal` for the Create wizard. `MediaPickerModal` carries a `ponytail:` note naming
  consolidation as the later upgrade path.
- No backend fields or Asset writes are introduced. Usage aggregates and editable Asset tags remain
  absent because neither has a supported contract in this wizard.
- A later shared shell must preserve the Publication approval boundary rather than inheriting the
  Playlist picker behavior.


## Revision — 2026-09-10 (later the same day)

Two things the original Decision got wrong surfaced the moment an operator used the picker.

### The approval gate is dropped, not preserved

The original text reuses `AssetCard` specifically so "the Publication approval gate remains at the
selection boundary". In practice `media_assets.approval_status` defaults to `'approved'` NOT NULL
(`20260909081713_auto_approve_uploaded_media.sql`) and nothing in the product ever sets it
otherwise — there is no approve/reject UI anywhere. The gate only ever fired on a few rows left at
`'draft'` from before that default, and its single visible effect was a Publication draft that
could not be saved for no operator-legible reason.

Removed at every layer:

- `media_publication_set_content` — migration `20260910232248_drop_publication_approval_gate.sql`
  drops the `v_unapproved_assets` block. `kind` / tenant / playlist-ownership / draft-only guards
  stay. Applied to `develop` and prod 2026-09-10; both bodies dumped and compared.
- FE — `isApprovedAsset` and `dropUnapprovedItems` deleted from `draft-mapping.ts`;
  `computeEligibility` no longer reads `approval_status`; `AssetCard` drops the disabled-when-
  unapproved state and the Approved / รออนุมัติ badge; `ZoneContentPicker` stops filtering the
  Composition zone list by it.

`approval_status` the column is left in place (default `'approved'`, unread) — dropping it is an
irreversible change to buy nothing, and a future moderation feature would want it back.

### The Media branch derives its kind from the first staged Asset

A Publication still holds images or videos, never both (`media_publication_set_content` still
enforces `ma.kind = v_pub_type`). The original picker took `publicationType` as a fixed prop, and
the Media branch card in `AssetLibraryStep` had no path that ever set it to `video` — so every new
draft was locked to `image` and the picker disabled every video, and an uploaded video was dropped
from the selection silently.

Now: `MediaPickerModal` takes no `publicationType` prop. The first staged Asset locks the picker to
its kind; the other kind is disabled with a reason and a **Clear all** control in the footer
unlocks it. On Select, `AssetLibraryStep` derives `publicationType` from the first committed Asset.
An upload of the wrong kind into a non-empty selection is refused with a message instead of
dropped.
