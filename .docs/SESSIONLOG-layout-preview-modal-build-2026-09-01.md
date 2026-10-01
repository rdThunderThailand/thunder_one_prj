# Layout Preview Modal Build Fix — 2026-09-01

## Root cause

The `dev` merge changed the shared `Modal` API from arbitrary `className` values to a typed `size` prop, while `PlaybackPreviewModal` still passed `className="max-w-6xl"`.

## Fix

- Added the `xl` modal size mapped to `max-w-6xl`.
- Updated `PlaybackPreviewModal` to use `size="xl"`.

## Verification

- `pnpm exec tsc --noEmit`
- `pnpm run build`

Both completed successfully on `codex/fix-layout-preview-modal`, based on `origin/dev`.
