# 20 — Target geometry profiles and full preview tab

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0051-pre-publish-preview.md` §4 and `docs/adr/0055-geometry-fit-is-advisory.md`

**What to build:** extract the existing playback stage, add target-shaped preview profiles, and mount
the same stage in a shell-free authenticated tab with id-first loading and a live session only for
dirty drafts.

**Blocked by:** nothing. Ticket 12 and Ticket 15 provide the implemented preview/editor baseline;
Ticket 19 may run in parallel because the fallback chain accepts existing `aspect_ratio`.

**Status:** shipped and fully browser-verified · 2026-08-28. Phase A committed as `bd88005`/`638b0b3`;
Phase B (full preview tab) committed as `57f2c2f`. Fixed three `react-hooks/set-state-in-effect`
errors found in `PreviewStage` during an earlier pass (see `9beeac7`). Browser-verified: geometry
selector `Unknown (1)` / 16:9 fallback (prior session); the `/media-workspace/preview/composition/[id]`
route renders the same stage with no dashboard chrome and the correct saved geometry when loaded by
id; the dirty-draft `previewSession` query param is set correctly and, with no editor tab alive to
answer heartbeats, the pure session reducer correctly lands on "Preview session expired — reopen
from editor" (prior session, in-app browser).

The two gaps that pass could not close — the live dirty-draft handoff and the signed-out redirect —
were closed in a follow-up pass using real Chrome (`mcp__claude-in-chrome__*`, multi-tab capable):

- **Signed-out redirect**: navigating directly to `/media-workspace` while signed out landed on
  `/login`, confirming the shared `getSession()` gate.
- **Live dirty-draft handoff**: opened `ZZTEST-ticket20-portrait-comp` in the Composition editor,
  dirtied the draft (unsaved name edit), and clicked "Open full preview". The preview tab opened at
  `/media-workspace/preview/composition/<id>?previewSession=thunder-one-preview:<uuid>`, rendered the
  portrait stage (1080×1920) correctly, and **stayed connected for 5+ seconds with the editor tab
  open** — more than two heartbeat intervals, so the `BroadcastChannel` ping/reply handshake is
  confirmed live, not just minted. Closing the editor tab was then observed to flip the preview to
  "Preview session expired — reopen from editor" within ~6 seconds, matching the two-missed-heartbeat
  reducer transition. The unsaved name edit was never saved — no test data persisted.

`tsc` and lint clean on changed files; `preview-session.check.mts` passes.

Implementation scope, acceptance checks and verification:
`docs/layouts/plan-ticket-20-full-preview-tab.md`.
