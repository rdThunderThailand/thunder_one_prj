# 0117 — Inline previews keep their controls under the frame; one `PreviewPanel` renders them

Status: accepted (2026-11-19, owner decision).

## Context

`PreviewStage` offered three control placements: `panel` (under the frame), `footer` (modal bar) and
`overlay` (a dark gradient bar on top of the picture). Five inline hosts used `overlay`. When the card was
narrow, the frame shrank to ~200px high while the bar kept its ~118px, hiding about 60% of the picture, and
the dark gradient read as a stray black stripe. The guard, `canOverlayPreviewControls`, compared the frame
only with the 32px button row plus a fixed 70px, so it said "fits" when it did not.

The box around the player was also rewritten per page: Prepare Content, Review and the Program summary rail
each had their own heading size, placeholder and height policy.

## Decision

1. **Overlay is removed.** `PreviewStage` has two placements, `panel` and `footer`. Controls never sit on the
   picture, at any size, including browser full screen (the full-screen layout already stacks the frame and
   the controls). The measuring code, `canOverlayPreviewControls` and its assertions go with it.
2. **`PreviewPanel` is the inline preview box** for Prepare Content, Review and the Program summary rail:
   heading (`text-base font-semibold`) + subtitle, an `actions` slot, the player, and one dashed placeholder
   for the empty, loading and error states. It does not wrap a `Card`; the host owns its container.
3. **Inline previews show no "Actual size" control** (`allowActualSize={false}`); real-pixel scaling stays
   in the modal and the full preview, as before.
4. The Playlist editor's timeline pane and the Playlist preview modal keep their own chrome and are not
   moved to `PreviewPanel`, but they get the same control placement through `PreviewStage`.

## Considered and not chosen

- *Hide the overlay until hover or pause* — no hover on touch screens, and the bar still covers the picture
  while paused.
- *Fix the overlay's fit check to measure the whole bar* — still covers the picture in the range where it
  barely fits, and keeps the measuring code that caused the bug.
- *Keep overlay for full screen only* — full screen has room for controls under the frame, so the mode
  would carry its code for no gain.
- *Change only `PreviewStage`, no new component* — leaves three differently styled boxes around one player.

## Consequences

- Every inline preview is about one control row (~56px) taller than before.
- A new page that shows an inline preview uses `PreviewPanel`; it does not add an overlay.
