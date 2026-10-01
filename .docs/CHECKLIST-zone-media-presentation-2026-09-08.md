# Checklist: Per-Zone media fit & mute (ADR 0064)

✅ **Status**: migration `20260908044654_zone_media_fit_and_mute` is applied to the Core
`develop`-branch project (`ftfmokgphewzyxzwjitv`). All 6 steps below, including the Save
round-trip, were re-verified live in-browser on 2026-09-08 and PASS. Prod is not yet migrated.

## 1. Content tab shows the new controls

- [ ] Open any Composition at `/media-workspace/layouts` → open a Zone in the editor.
- [ ] Switch to the **Content** tab.
- [ ] Expect: 4 selects in a 2×2 grid — Play mode, Repeat, Start from, **Media fit** — plus a
      **Mute this Zone** checkbox below them, above the Duration row.
- [ ] Media fit options: Fit (contain) / Fill (crop) / Stretch.
- [ ] A brand-new (never-saved) Zone binding: checkbox starts **checked** (muted = true).

## 2. Apply to all Zones carries the new fields

- [ ] Set Zone A's Media fit to `Fill` and check Mute.
- [ ] Click **Apply content settings to all Zones**.
- [ ] Expect: every other Zone's Content tab now also shows Fill + Mute checked, without
      touching any Zone's bound Playlist/assets.

## 3. Playback Preview reflects fit and shows a mute label

- [ ] With a Composition that has ≥2 Zones bound to different content, set Zone A to `Fill` and
      Zone B to `Stretch`.
- [ ] Open **Open full preview** (or the quick preview modal).
- [ ] Expect: Zone A's video/image visibly crops to fill its frame; Zone B visibly
      stretches/distorts to its frame — independent of what fit each item/Playlist carries.
- [ ] Set Zone A's Mute checkbox on, leave Zone B off.
- [ ] Expect: Zone A's name label in Preview shows a 🔇 icon; Zone B's does not. (The preview
      audio itself stays silent either way — browser autoplay policy — this is a label check
      only, not an audio check.)

## 4. Save round-trip

- [ ] Set a Zone's Media fit to `Fill` and Mute to checked, click Save.
- [ ] Reload the page (or reopen the Composition).
- [ ] Expect: Media fit stays `Fill`, Mute stays checked — the values persist exactly as set.

## 5. Main editing canvas thumbnail now shows the real crop

- [ ] In the editor (not the Preview modal), bind a Zone to an image/video, keep its geometry
      wide/short (e.g. a ticker strip) so a crop difference is visible.
- [ ] Content tab → set Media fit to `Fit`.
- [ ] Expect: the Zone's thumbnail **on the drag-and-resize canvas itself** now shows the whole
      image letterboxed (not cropped), updating live as you change the select.
- [ ] Switch to `Stretch` — expect: same thumbnail now visibly distorted to the Zone's box.
- [ ] Switch back to `Fill` — expect: back to the original cropped-to-fill look (today's default
      behavior, unchanged for every other MediaThumb use in the app — Playlist rows, Asset
      Picker, media library grids, etc. — none of them pass `fit`, so they keep `object-cover`).

## 6. Existing Composition is not silently muted

- [ ] Open a Composition that was saved **before** this session (has sound today).
- [ ] Go to a bound Zone's Content tab.
- [ ] Expect: Mute checkbox is **unchecked** (not the `true` a brand-new Zone gets) — confirms
      the hydrate-default asymmetry from ADR 0064 §6.

---
Report back which steps passed/failed and I'll fix anything that doesn't match.
