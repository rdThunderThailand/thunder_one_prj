# Checklist — #26 (canvas tools) + #27 (Zone Properties tabs) browser verification

Written 2026-09-06. Tickets: `docs/layouts/Phase1/tickets/26-canvas-tools.md`,
`docs/layouts/Phase1/tickets/27-zone-properties-tabs.md`

Open an existing Composition with **at least 2 Zones** (not a brand-new blank one — align/
duplicate/undo need something to compare against). DevTools Console + Network open throughout.

## #26 — Canvas tools

### D1 — Undo/redo, buttons

1. Select a Zone, drag it to a new position
2. Click **Undo**

คาดว่า: Zone snaps back to exactly where it was before the drag (position, not just close)

3. Click **Redo**

คาดว่า: Zone returns to the dragged position

4. Do 3 different edits in a row (drag Zone A, then Split Zone, then drag Zone B). Click Undo
   three times.

คาดว่า: each Undo reverses exactly one of the three, in reverse order — after 3 Undos the
canvas matches the very first state

### D2 — Undo/redo, keyboard

1. Drag a Zone, then press **Ctrl+Z** (Windows/Linux) or **Cmd+Z** (Mac)

คาดว่า: same as clicking Undo — reverts the drag

2. Press **Ctrl+Shift+Z** / **Cmd+Shift+Z**

คาดว่า: redoes it. `Ctrl+Y` should also redo.

3. With nothing to undo (fresh page load, no edits yet), press Ctrl+Z

คาดว่า: nothing happens, no error in Console, Undo button is disabled (greyed out)

### D3 — Align (5 buttons)

Select one Zone that is not already at an edge.

1. Click **Align Left** → Zone's left edge touches the canvas's left edge (x = 0)
2. Click **Align Right** → Zone's right edge touches the canvas's right edge
3. Click **Align Top** → Zone's top edge touches the canvas's top edge (y = 0)
4. Click **Align Center** → Zone is centered horizontally
5. Click **Align Middle** → Zone is centered vertically

คาดว่าทุกข้อ: Zone's **width and height never change**, only position. If aligning lands the
Zone on top of another Zone, the canvas shows the existing red overlap outline (same as a
manual drag would) — that's expected, not a bug.

Each align click is its own Undo step — align 3 times, Undo 3 times, geometry matches at
every step (same as D1 item 4).

### D4 — Duplicate Zone

1. Select a Zone, click **Duplicate Zone**

คาดว่า: a new Zone appears, same size as the source, **not exactly on top of it** — offset
visibly. Selection moves to the new copy. Zone Overview list now shows one more row.

2. Save draft, reload the page

คาดว่า: the duplicate persisted with its own identity — it doesn't disappear or merge back
into the original

### D5 — Undo/redo respects the shared-Template confirm

Open a Layout whose Template backs ≥2 Layouts (the amber banner shows).

1. Drag a Zone → the `window.confirm` warning appears (as before, unrelated to this ticket)
2. Confirm it, then click **Undo**

คาดว่า: reverts the drag without re-asking the confirm (the checkpoint happens after the
confirm, so Undo doesn't re-trigger it)

## #27 — Zone Properties tabs

Select a Zone that already has a Playlist bound to it.

### E1 — Three tabs, Content unchanged

1. Look at the Zone panel — should show **Content / Layout / Behavior** tabs, Content active
   by default
2. Content tab shows the same Playlist/Pick-assets picker as before — **no Play mode/Repeat/
   Start from selects here anymore** (moved to Behavior)

### E2 — Layout tab

1. Click **Layout** tab → four number fields: X, Y, Width, Height (%)
2. If the Layout has a `reference_resolution` set, each field shows an approximate pixel
   value beside it (e.g. "≈ 384px")
3. Change the **Width** field to a new number, tab out

คาดว่า: the Zone on the canvas resizes live to match. Undo (D1) reverts this too — Layout-tab
edits share the same history stack as canvas drags.

4. Type an invalid value (letters) into a field

คาดว่า: field ignores it / doesn't crash, keeps the last valid number

### E3 — Behavior tab

1. Click **Behavior** tab → Play mode / Repeat / Start from selects (same three as before,
   just relocated), plus a **read-only Duration** row showing the total seconds, plus an
   **Apply playback settings to all Zones** button
2. Confirm there is **no Fill Mode dropdown, no Mute toggle, no editable Duration field** —
   none of the three should exist anywhere in this tab
3. Change **Play mode** to Shuffle, **Repeat** to Once, save, reload, open **Preview**

คาดว่า: preview actually plays this Zone shuffled, once — matches ADR 0062's contract

### E4 — Apply to All Zones

Composition needs ≥2 Zones, at least one currently unbound.

1. On a bound Zone's Behavior tab, set Play mode = Shuffle, click **Apply playback settings
   to all Zones**
2. Select every other Zone (bound and unbound) and check its Behavior tab

คาดว่า: every Zone's Play mode now reads Shuffle — **including the previously-unbound one**,
even though it still shows "Unbound" in Zone Overview (content did not change, only playback)

3. Now bind that previously-unbound Zone to a Playlist, save

คาดว่า: it saves as Shuffle (the playback set by step 1 carried over once it got content) —
not reset to the sequential default

### E5 — Zone Overview labels

Look at the Zone Overview list under the canvas.

คาดว่า: each row's small text reads one of exactly **"Playlist"**, **"Media"**, or
**"Unbound"** — a Zone bound to picked assets (not a Playlist) shows **"Media"**, not
"Assets" like before

## รายงานกลับ

```
D1 PASS · D2 PASS · D3 PASS · D4 PASS · D5 PASS
E1 PASS · E2 PASS · E3 PASS · E4 FAIL (...) · E5 PASS
```

ข้อไหน FAIL ขอ Console error + สิ่งที่เห็นจริงเทียบกับที่คาดด้วย
