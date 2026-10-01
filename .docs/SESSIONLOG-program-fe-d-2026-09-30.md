# FE-D — Change Target on the Program Edit page (2026-09-30)

Branch `feat/program-edit-page`, uncommitted (FE-C is `8510ebb`).

## Done
- `target-picker.ts` (+ `.check.mts`): selection <-> targets, Group-aware reach/summary, `device` targets pass through.
- `ChangeTargetModal.tsx`, `TargetFacet.tsx`, `SelectedTargetPanel.tsx` (lovable Dialog/Tabs/Checkbox/Input); `TargetCard` opens it, Apply -> `edit.patch({ targets })`.
- Locations tab disabled, no map, no screen count (plan).

## Verified (browser, develop DB, approved writes)
- Filters/search/Group pick/Apply on Draft `zz-monthly-ui-19` (nothing saved).
- Live fixture `zz-fe-d-live` (05b7a4db-4f35-4597-8f63-c512adc43338): removed `M2 Smoke Channel` -> confirm modal "Will stop playing on 1 channel" -> Publish -> server: 1 target, Job targets 1 device. Ended afterwards (`cancelled`).

## Not verified
- Multi-Location facet, Group removal on Live, mockup 07 comparison, the two label fixes ("All Status", "Apply (1 channel)") re-checked only via the Apply button text.

## Test data left on develop (delete = R0, list first)
- Programs: `zz-fe-d-live` (cancelled), `zz-fe-c-layout-draft` (Draft).
- Folders `zz-fe-c-folder` (playlist 109c9b2f-cc48-42f4-b6ba-17f6c530ca2e, composition 13a26935-a386-4cd1-ae5d-9d57d9b3aaf6): Playlist `test` and Layout `Test Layout 1` must be moved back to Uncategorized first.

## Process note
Auto-mode's classifier blocked writes/clicks it read as "Production Deploy" even though Core points at the develop branch DB (ftfmokgphewzyxzwjitv). Switching the session to manual approval unblocked it.
