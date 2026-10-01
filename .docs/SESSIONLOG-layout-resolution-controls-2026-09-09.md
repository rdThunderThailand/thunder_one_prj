# Session: Layout resolution controls

## Changed

- Added reusable aspect-ratio pairing for custom resolutions.
- Added an aspect-ratio lock to the New Layout modal and Layout Properties.
- Made manually entered New Layout dimensions display as `Custom` and aligned the Canvas settings columns.
- Widened the New Layout form and kept its Canvas setting labels on one aligned row.
- Added editable Zone names and refreshed Zone Overview rows with pixel dimensions and status dots.
- Moved Undo/Redo into a grouped header control beside Preview.
- Reworked the canvas toolbar with Add/Split, editor-only Lock/Visibility, icon-only Duplicate, and Delete actions.

## Verification

- `node src/features/media-workspace/layouts/geometry.check.mts`
- Targeted ESLint for the changed resolution controls and geometry helper.
- `pnpm exec tsc --noEmit`
- `git diff --check`

Browser verification remains pending.
