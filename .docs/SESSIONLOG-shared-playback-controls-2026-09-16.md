# Session Log — Shared playback controls

Date: 2026-09-16

## Scope

- Apply a Step 3-style single-row controller to every `PreviewStage`.
- Preserve all existing playback and preview behavior.

## Verification

- `pnpm exec eslint` on `PreviewControls` and every `PreviewStage` host.
- `pnpm exec tsc --noEmit`
- `git diff --check`
