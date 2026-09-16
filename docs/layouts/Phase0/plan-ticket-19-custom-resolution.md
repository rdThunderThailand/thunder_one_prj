# Ticket 19 — Custom resolution and responsive Layout canvas

**Supersedes:** `docs/layouts/tickets/11-layout-editor-wide-screen-tools.md` (never started). Every
checklist item of 11 is carried below, including the even-split action and the seam-guide arithmetic.

## Outcome

An operator authors a Layout against a real Authoring Reference Resolution — portrait, ultrawide or
`3000x2000` — with percentage Zones, trustworthy reference-pixel feedback and monitor seam guides.

## Baseline (verified, do not re-litigate)

- `layouts.reference_resolution` and `media_layout_upsert`'s `p_reference_resolution` exist with
  `CHECK ~ '^[0-9]{3,5}x[0-9]{3,5}$'`, which is exactly `100–99999` on each side. No migration.
- `media_layout_get` already returns `usage_count`, the number of Compositions bound to the Layout.
- `aspect_ratio` is `varchar(12)`; the widest value this ticket can produce is `99999:99998`.
- Percentages already carry three decimals (`toThousandths`, `geometry.ts:14`) — Ticket 01 is done.
- `LayoutCanvas.tsx:156` already sizes the canvas with CSS `aspect-ratio`; it never builds a
  pixel-sized DOM. **Do not rewrite the canvas** — see scope item 4 for the one thing wrong with it.

## Scope

1. **Template creation**: the existing create form gains a resolution field — `1920x1080`
   preselected, presets `1920x1080` / `1080x1920` / `3840x2160` / Custom, integer Width and Height
   validated `100–99999` before send, with the message the server's CHECK enforces.
2. **Inline Layouts get no gate.** A new inline Layout starts at `1920x1080` and its resolution is
   edited in the inspector like any other property. Putting a modal in front of the inline canvas is
   explicitly out — ADR 0052 §4 removed that step and a later change costs nothing (item 6).
3. Derive `aspect_ratio` from Width and Height **reduced by GCD** (`1920x1080` → `16:9`, not
   `1920:1080`), so new Layouts read the same as the ones drawn before this ticket. Orientation is
   `width > height`, derived at the point of use and never stored.
4. Bound the canvas on **both** axes. It is width-bound today (`w-full max-w-2xl`), so `1080x1920`
   renders ~1195 px tall and scrolls. Fit it to the workspace height as well; the ratio still comes
   from CSS. This is a sizing fix, not a new canvas.
5. With a resolution set, show reference pixels beside percentages in the Zone inspector and rulers
   (`1920 × 1080 — exactly one monitor`). A Layout with a null resolution shows percentages only.
6. Preserve Zone percentages on every resolution change. Compare ratios **numerically** (`w/h`), never
   as strings: a same-ratio change passes silently; an aspect-ratio change with Zones present asks
   once, and for a `template` names the `usage_count` Compositions that will follow it.
7. **Seam guides** at cumulative monitor width ÷ total width — for three 1920s in 5760 at 33.333…%
   and 66.666…%, not 33.3%/66.7%. Visual reference only; no snapping, no monitor grid, no fake bezel.
8. **Even split into N columns** as a pure function: it divides the frame and hands the remainder to
   one Zone deliberately (33.333 / 33.333 / 33.334), rather than leaving a strip of background.

## Out of scope

- Binding a Layout to a Media Device or enforcing a target resolution.
- Persisting orientation, a monitor grid, snapping or bezel simulation.
- Player rendering changes; any schema or RPC change.

## Acceptance checks

- A new Template cannot be created with an invalid, fractional, zero or out-of-range dimension; a new
  inline Layout opens straight onto the canvas at `1920x1080`.
- `3000x2000`, `1080x1920` and `5760x1080` produce the corresponding canvas shape, and `1920x1080`
  stores `aspect_ratio = "16:9"`.
- `1080x1920` fits inside the editor workspace without scrolling the page.
- A Zone inspector reports reference pixels that agree with its stored percentage geometry.
- `1920x1080` → `3840x2160` preserves Zones with no confirmation; `1920x1080` → `1080x1920` preserves
  Zones behind one confirmation that names the affected Composition count for a Template.
- A legacy null-resolution Layout reopens, edits and saves with no pixel ruler and no forced migration.
- Even split into 3 on `5760x1080` stores 33.333 / 33.333 / 33.334 and the seam guides land on the
  Zone edges.

## Verification

- One runnable check covering: resolution parse/validate, GCD ratio derivation, numeric same-ratio
  comparison, percent → reference-pixel conversion, and even-split for 2, 3 and 4 columns with the
  remainder on exactly one Zone (extend `geometry.check.mts`).
- `tsc` and `lint` clean on changed files.
- Browser-check: new Template, new inline Layout, portrait fit, same-ratio edit, ratio-changing edit
  on a shared Template, legacy null-resolution Layout, 3-column even split with guides.

## Decision sources

`CONTEXT.md` — Authoring Reference Resolution; ADR 0050 §1–§3; ADR 0052 §4 merged authoring.
