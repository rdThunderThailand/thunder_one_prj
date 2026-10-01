# Session Log — Picker dialog redesign — 2026-09-11

## Scope

- Removed `More Filters` and `Upload` from the publication Media Picker toolbar.
- Made list view the default for Media, Playlist, and Layout pickers.
- Redesigned Media, Playlist, and Layout list rows with thumbnails or Zone wireframes, metadata, status, and selection state.
- Kept picker pagination at the bottom of the list pane.
- Matched Playlist and Layout Library linking to the Media Picker external-link treatment.

## Verification

- `pnpm exec tsc --noEmit` — passed.
- Targeted ESLint — passed with one existing `@next/next/no-img-element` warning in `CompositionPickerModal.tsx`.
- `node src/features/media-workspace/publications/playlist-picker-filter.check.mts` — passed.
- `node src/features/media-workspace/publications/composition-picker-filter.check.mts` — passed.
- `git diff --check` — passed.
- Authenticated browser at `/media-workspace/publications/create` — Playlist Picker rendered list rows, thumbnails, metadata, status, external-link icon, bottom pagination, selected-row detail, and enabled Select action.
- Authenticated browser at `/media-workspace/publications/create` — Layout Picker rendered its list row, Zone wireframe, metadata, status, external-link icon, bottom pagination, selected-row detail, and enabled Select action.
- Video-thumbnail follow-up: replaced the picker-only image renderer with the shared `CompositionLibraryPreview`; it renders legacy video assets without captured posters through `<video>` and uses the shared `isVideoUrl` detector. TypeScript, targeted ESLint, `git diff --check`, and the composition filter check passed; browser recheck is pending user choice.
- Inline-layout naming follow-up: the Layout Picker now derives an exact matching system-preset name from the stored Zone geometry, so the copied preset displays `3-Zone Header` instead of its internal `comp:<uuid>` name. Edited/non-matching geometry displays `Custom layout`. The composition filter check covers both cases and preset-name search; TypeScript, targeted ESLint, and `git diff --check` passed.
- Figma detail/filter follow-up: replaced the Layout Picker selects with accessible radio-style filter choices for Status, Orientation, and Aspect Ratio; removed Category and the duplicate toolbar Status control. Rebuilt the selected-item rail with preset details, tags, description, and an expandable `ดูรายละเอียด Zones` control. Authenticated browser verification confirmed the rendered data, expand/collapse state, keyboard activation for Zones and filters, and Clear all behavior.
- Playlist Figma/shared-component follow-up: extracted `PickerPanels.tsx` for the filter rail, filter sections/choices, detail fields, tags, description, and expandable detail action. Playlist and Layout pickers now share those primitives. Playlist removed Category and the duplicate toolbar Status control, gained Status/Duration/Created by/Tags filters, and uses the Figma-style cover/detail rail with an expandable `ดูรายการทั้งหมด` action. Both pickers were rechecked in the authenticated browser; Playlist filtering and expansion were keyboard-tested.
- Direct-upload follow-up: after the shared upload pipeline finishes registration, reloads the asset list, and successfully adds the uploaded asset to the publication draft, Step 1 now invokes the existing `onContentSelected` transition to Step 2. Rejected, failed, missing, or content-kind-mismatched uploads remain on Step 1. TypeScript, targeted ESLint, and `git diff --check` passed; no live upload was performed because it would create a persistent media asset.
- Prepare Content follow-up: reshaped Step 2 to the Figma hierarchy with Basic Settings (name, description, tags only), compact disabled Quick Edit cards, the shared `PreviewStage` with overlay controls, a branch-agnostic media strip, and Content Info / evidence-based Checklist / Need Help cards. `PreviewStage` now forwards captured posters and seeks legacy videos to 0.1s while paused so the player paints a first frame. TypeScript, targeted ESLint, and `git diff --check` passed. Authenticated browser checks covered Media and four-item Playlist branches, poster/first-frame rendering, player keyboard play/pause, and disabled Quick Edit state; no save/publish occurred.
- Preview interaction follow-up: media-strip buttons now seek the shared preview clock to each item's scheduled start, reusing `zoneSchedule()` so shuffle and transitions remain aligned. Overlay controls fade while playback continues outside the player and return when the player is hovered or focused. TypeScript, targeted ESLint, and `git diff --check` passed; authenticated browser checks confirmed `download.jpg` seeks to 17s, `Predator.mp4` seeks to 0s in the shuffled Playlist, and controls hide/show while playback continues.
- Loose-media title follow-up: removed `basicInfo.name` from `usePublicationStagePreview` and label the preview from the selected asset title or original filename instead. This prevents Content Name typing from rebuilding the local `StagePreview`. TypeScript, targeted ESLint, and `git diff --check` passed; authenticated browser showed `Screenshot 2569-09-11 at 11.24.17.png`, and playback advanced from 0.90s to 1.83s while the Publication name was edited.
- Review-step follow-up: compacted the four summary cards, embedded the shared `PreviewStage` beside a full-day timeline, made Publish Now resolve to `00:00–23:59`, and added an informational timeline note. Added a Review-specific summary rail using contextual content, monitor, calendar, and play icons; tightened Checklist/warning cards; and anchored the wizard footer through a viewport-aware minimum page height. TypeScript, targeted ESLint, and `git diff --check` passed. At 2560×1325, authenticated browser measurements showed the Review grid spanning about 765px, the preview card at about 253px high, and the footer at y=1229–1307; the embedded preview also played successfully.
- Program-step follow-up: removed the selected-channel recap and Channel Status chart from `ChannelsStep`. Playlist playback settings now render as Figma-style read-only Play Order, Repeat, Transition, Duration, Audio, and Volume fields, with one button linking to the selected Playlist Editor. TypeScript, targeted ESLint, and `git diff --check` passed; authenticated browser verified the removed blocks are absent and the editor link resolves to the selected Playlist id.

## Notes

- Browser console retained a stale Turbopack client-render fallback error from the local dev session; the picker still rendered and interacted successfully after reload.
- No commit, push, deploy, migration, or publication save was performed.
