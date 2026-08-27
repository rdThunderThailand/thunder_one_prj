# 12 — Pre-publish preview

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0051-pre-publish-preview.md`

**What to build:** an operator watches their draft play before publishing it. One component, three
mount points — the Playlist editor, the Composition editor, and step 5 of the wizard where
`PreviewPanel.tsx:20`'s `onClick`-less button already sits. No schema change, no RPC change, no
migration: it reads draft state the client already holds.

**Blocked by:** 03 — Composition list page and editor (for the Composition mount point; the Playlist
mount point is unblocked and may ship first)

**Status:** ready-for-agent

- [ ] One component takes a list of Zones — geometry, items, per-item duration and transition,
      playback settings — which is the shape ADR 0045 §1 defines and the shape the player receives
- [ ] A Playlist is previewed as **one Zone** at `x=0 y=0 w=100 h=100`. There is no separate
      playlist-preview mode to keep in step with the Zone one
- [ ] It opens as a full-screen modal locked to the Layout's aspect ratio, not animated inside the
      editing canvas — content moving while someone drags a Zone edge is a distraction
- [ ] **Every Zone's state is a pure function of one shared `t`**: `t mod` that Zone's own loop length
      gives its current item index and the offset into it. A timer per Zone makes the scrubber a
      rewrite instead of an addition
- [ ] Zones loop independently from a common start at `t = 0`, matching `loop_anchor_at` being one
      shared value (ADR 0044 §10). A 20-second sidebar beside a five-minute main Zone restarts fifteen
      times, in the preview exactly as on the screen
- [ ] Loop length resolves duration the way activation does — `COALESCE(item, asset)`. Any other rule
      makes the number of restarts wrong, which is the one thing this has to get right
- [ ] An item that resolves to no duration is drawn as a marked placeholder and contributes no time. A
      Zone whose items all fail to resolve has length zero, is held on its placeholder, and **never
      enters the `t mod` arithmetic** — otherwise it divides by zero and goes to `NaN`
- [ ] Unapproved or missing assets are drawn as marked placeholders carrying the asset name, not
      hidden — the operator needs to see why something will not air
- [ ] A timeline scrubber sets `t`; 2× and 4× speed change how fast `t` advances (`<video>` already has
      `playbackRate`)
- [ ] Decoding capacity is not simulated and is not enforced during the current publish phase. The
      preview demonstrates timing and geometry only; it does not prove that a target Device can decode
      every video Zone concurrently (ADR 0054 — ticket 08 is deferred, so nothing else proves it
      either)
- [ ] When step 5 has detected a schedule conflict — `computeEligibility` already receives `conflicts`
      — a banner names how many other Publications will merge into the same loop. Until ticket 09
      lands the banner shows for **every** type; suppressing it for Compositions before then would
      hide the warning in exactly the case where the screen can still merge
- [ ] The merged result is not simulated — resolving overlap windows and priorities in the browser is a
      second scheduler
- [ ] One `*.check.mts` on the clock: item index and offset at several `t` across two Zones of
      different lengths, including a zero-length Zone
- [ ] No new dependency
- [ ] Verified in the browser from all three mount points
