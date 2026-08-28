# 20 — Target geometry profiles and full preview tab

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0051-pre-publish-preview.md` §4 and `docs/adr/0055-geometry-fit-is-advisory.md`

**What to build:** extract the existing playback stage, add target-shaped preview profiles, and mount
the same stage in a shell-free authenticated tab with id-first loading and a live session only for
dirty drafts.

**Blocked by:** nothing. Ticket 12 and Ticket 15 provide the implemented preview/editor baseline;
Ticket 19 may run in parallel because the fallback chain accepts existing `aspect_ratio`.

**Status:** ready-for-execution · 2026-08-28

Implementation scope, acceptance checks and verification:
`docs/layouts/plan-ticket-20-full-preview-tab.md`.
