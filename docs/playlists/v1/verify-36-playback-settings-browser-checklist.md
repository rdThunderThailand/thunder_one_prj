# Browser verification checklist — Playlist playback settings (#36)

Branch `fix/playlist`. Run the repo's dev script and open the Media Workspace.
`CORE_API_URL` must be set + the dev server restarted, or the proxy hits deployed
`develop` (memory `thunder-one-dev-env-core-api-url`).

Every step lists the action and the expected result — mark **PASS / FAIL** and paste
anything that does not match. No code changed for #36 this round; this only confirms the
already-built editor surface behaves.

Scope note: #36 is the **editor surface only**. The poll payload's `playback` object has
carried `play_mode` / `repeat` / `start_from` since ADR 0031/0045 and is unchanged here —
step E is a sanity check, not new behaviour.

---

## A. The panel renders

| # | Action | Expected |
|---|--------|----------|
| A1 | Open any saved playlist editor → look at the **centre column, below the Timeline** | A "Playback Settings" card with a grid of controls |
| A2 | Read the controls | Exactly: **Play Mode**, **Repeat**, **Start Playback From**, **Default Transition**, **Transition Duration (seconds)**. No "Respect item duration". No "Sync to channel time" / channel-sync anything. No second Shuffle toggle anywhere on the page |
| A3 | Read the note under the grid | Says play mode / repeat / start-from reach the player only for a Playlist published on its own, and a Composition Zone overrides them (ADR 0060 §3b) |
| A4 | Browser console | No errors/warnings referencing `PlaylistPlaybackSettings`, `metadata`, `playback` |

## B. Play Mode is one control

| # | Action | Expected |
|---|--------|----------|
| B1 | Open the **Play Mode** dropdown | Options are the `PLAY_MODES` values (e.g. `sequential`, `shuffle`) — one dropdown, no companion checkbox |
| B2 | Pick `shuffle` | Selection sticks; nothing elsewhere on the page contradicts it |

## C. Persist across save + reload  ← the core AC

| # | Action | Expected |
|---|--------|----------|
| C1 | In a saved playlist, set **Play Mode** = `shuffle`, **Repeat** = a non-default value, **Start Playback From** = a non-default value | Each dropdown shows the new value |
| C2 | Click **Save Draft** | Success toast; no error card |
| C3 | **Hard-reload** the editor URL (Cmd+Shift+R) | All three controls come back with the values from C1 — not the defaults |
| C4 | Set all three **back** to their defaults (`sequential` / `loop` / `first`), Save Draft, hard-reload | All three show defaults; no stale value lingers |

## D. Undo/redo + dirty guard cover the panel

| # | Action | Expected |
|---|--------|----------|
| D1 | Change **Repeat**, then press **Cmd+Z** (focus not in the select) | The change reverts; **Cmd+Shift+Z** re-applies it |
| D2 | Change a playback control, then click **Cancel** without saving | Unsaved-leave confirmation appears |

## E. Sanity — value reaches the poll payload (optional, needs a device)

| # | Action | Expected |
|---|--------|----------|
| E1 | Set Play Mode / Repeat / Start From on a playlist, Save Draft, **Mark as ready** from the list, create a Publication that uses it, add a device target, **Activate** | Activation succeeds |
| E2 | Poll that device's job endpoint (deployed `develop`, real device token) and read a slot's `playback` object | `play_mode` / `repeat` / `start_from` match what was set in E1 |

> E is backend behaviour that predates #36. Skip if no disposable device/publication is
> handy — C is what gates #36.

---

## Result

- [ ] A1–A4
- [ ] B1–B2
- [ ] C1–C4  **(required)**
- [ ] D1–D2
- [ ] E1–E2  (optional)

Paste failures with console output. If only E is unrun, #36 still closes on A–D — note
it in the issue.
