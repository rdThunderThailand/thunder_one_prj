# 19 — Custom resolution and responsive Layout canvas

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0050-wide-layouts-across-monitors.md` §1–§3

**What to build:** add preset/custom Authoring Reference Resolution to Template and inline Layout
authoring, fit the existing CSS canvas on both axes, expose reference-pixel feedback and complete the
seam-guide and even-split tools carried from Ticket 11.

**Blocked by:** nothing. Ticket 01 and Ticket 15 provide the implemented baseline.

**Status:** shipped · 2026-08-28. Committed as `c757ec8` and pushed to `feat/layout`. Browser-verified
in two passes: the first found a canvas viewport overflow and a non-functional custom-resolution
mode, both fixed and re-verified; preset/custom resolution, portrait fit, same-ratio and
ratio-changing edits, legacy null-resolution reopen, and 3-column even split all confirmed working.

**Supersedes:** 11 — Layout editor tools for wide screens.

Implementation scope, acceptance checks and verification:
`docs/layouts/plan-ticket-19-custom-resolution.md`.
