# Publication Media Picker is local before it is shared

**Status:** accepted · 2026-09-10
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
