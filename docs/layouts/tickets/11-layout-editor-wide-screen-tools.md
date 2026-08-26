# 11 — Layout editor tools for wide screens

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0050-wide-layouts-across-monitors.md` §2, §3

**What to build:** an operator drawing a Layout for three monitors can say what resolution they are
drawing for, see where the bezels fall, and split the frame into equal columns in one click. Ticket 01
made 33.333 storable; this ticket makes it typeable by someone who is not doing the arithmetic in
their head.

**Blocked by:** 01 — Layout Zone identity is stable, geometry gains precision

**Status:** ready-for-agent

- [ ] The Layout editor has a `reference_resolution` field, validated against
      `^[0-9]{3,5}x[0-9]{3,5}$` before it is sent, with the same message the server's CHECK enforces
- [ ] `aspect_ratio` is derived from it when present, and an existing Layout with no resolution
      behaves exactly as it does today
- [ ] With a resolution set, a selected Zone shows its real pixel size ("1920 × 1080 — exactly one
      monitor") beside its percentage
- [ ] Seam guides are drawn at **cumulative monitor width ÷ total width** — for three 1920s in 5760,
      at 33.333…% and 66.666…%, not at 33.3% and 66.7%. A guide drawn at a rounded percentage is
      5.76 px from the seam it claims to mark, which is the error this work exists to remove
- [ ] Guides are a visual reference only. There is no snapping: `5760x1080` alone does not say whether
      that is 3 × 1920 or 2 × 2880, and making it say so means storing a monitor grid — deferred
- [ ] An "even split into N columns" action divides the frame and hands out the remainder
      deliberately — 33.333 × 3 is 99.999, so someone gets 33.334 and it is a decision, not a leftover
      strip of background
- [ ] The even-split arithmetic is a pure function with cases in `geometry.check.mts`: 2, 3 and 4
      columns, and the remainder landing on exactly one Zone
- [ ] The preview cannot show a bezel — a browser draws one continuous surface — and the guides are
      the compensation. Do not add a fake gap
- [ ] `tsc` and `lint` clean on changed files
- [ ] Verified in the browser: draw a 3-column 5760x1080 Layout with the even-split action, confirm the
      guides sit on the Zone edges and the stored values are 33.333/33.333/33.334
