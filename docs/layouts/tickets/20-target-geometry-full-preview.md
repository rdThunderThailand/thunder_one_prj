# 20 — Target geometry profiles and full preview tab

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0051-pre-publish-preview.md` §4 and `docs/adr/0055-geometry-fit-is-advisory.md`

**What to build:** extract the existing playback stage, add target-shaped preview profiles, and mount
the same stage in a shell-free authenticated tab with id-first loading and a live session only for
dirty drafts.

**Blocked by:** nothing. Ticket 12 and Ticket 15 provide the implemented preview/editor baseline;
Ticket 19 may run in parallel because the fallback chain accepts existing `aspect_ratio`.

**Status:** shipped · 2026-08-28. Phase A committed as `bd88005`/`638b0b3`; Phase B (full preview tab)
committed as `57f2c2f`. Fixed three `react-hooks/set-state-in-effect` errors found in `PreviewStage`
during this pass (see `9beeac7`). Browser-verified: geometry selector `Unknown (1)` / 16:9 fallback
(prior session); the `/media-workspace/preview/composition/[id]` route renders the same stage with
no dashboard chrome and the correct saved geometry when loaded by id; the dirty-draft
`previewSession` query param is set correctly and, with no editor tab alive to answer heartbeats,
the pure session reducer correctly lands on "Preview session expired — reopen from editor". The
live dirty-draft handoff (editor and preview tab open together, content flowing over
`BroadcastChannel`) and the signed-out `/login` redirect were **not** re-exercised live — the
in-app browser tool collapses `window.open(..., "_blank")` into a same-tab navigation, so a second
tab with the editor still open could not be held for the handshake, and forcing a sign-out was
avoided to keep the authenticated session usable for the rest of this pass. The shared `getSession`
gate is otherwise unit-identical to the dashboard's, already proven elsewhere. `tsc` and lint clean
on changed files; `preview-session.check.mts` passes.

Implementation scope, acceptance checks and verification:
`docs/layouts/plan-ticket-20-full-preview-tab.md`.
