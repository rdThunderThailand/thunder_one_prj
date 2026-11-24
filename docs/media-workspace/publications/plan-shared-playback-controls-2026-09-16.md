# Shared playback controls plan

## Goal

Use the compact, single-row video control language from Step 3 across every
`PreviewStage` host.

## Changes

1. Replace the stacked custom controller with one native-style control row.
2. Keep play, seek, mute, speed, actual-size, and fullscreen behavior.
3. Apply the change in `PreviewControls` so every preview host stays consistent.

## Constraints

- Keep the existing preview clock and multi-zone rendering.
- Preserve keyboard labels, titles, and focus behavior.
