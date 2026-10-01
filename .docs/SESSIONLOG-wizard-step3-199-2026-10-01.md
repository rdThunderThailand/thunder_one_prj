# Session log — #199 wizard step 3 (2026-10-01, s16)

Continues `/tmp/HANDOFF-program-schedule-2026-10-01-s15.md`. Branch `fix/199-wizard-step3` (off `docs/sessionlog-schedule-wizard`, which is off `dev`). Nothing pushed.

## Done (4 local commits on the branch + the s15 SESSIONLOG commit underneath)
- **Bug 3, draft resume** (`CreatePublicationPage.tsx`, `next-transition.ts`): root cause was the `?id=` resume effect listing `publicationId` as a dependency while the load itself sets it, so the effect cancelled itself before choosing a step. The wizard then showed whatever step localStorage held (1, or 5 for a cached draft) — not a timing issue. Now `resumeStep()` lands on the first step the draft still fails, else Review (4), and `furthestStep` follows. Check added to `next-transition.check.mts`.
- **Bug 2, rail preview** (`ProgramSummaryRail.tsx`): the rail had preview code only for loose media and Playlist covers. It now uses the same `usePublicationStagePreview` + `PreviewStage` as step 2, so Layout / Playlist / Media all preview; Layout "Content" shows the Layout name.
- **Review content card** (`ReviewStep.tsx`): a Layout showed its first asset's resolution / size / uploader. It now shows Layout name, resolution, aspect ratio, zone count and longest zone.
- **"One time" label** (`schedule-describe.ts`): a one-off spanning days or open-ended was titled "One time". Now "Continuous" unless it ends on its start day (same split as `scheduleToDraft`, ADR 0082 §4). Check added.
- **Step 3 redesign, ADR 0083** (supersedes ADR 0082 §6; plan `docs/program/plan-wizard-step3-summary-modal.md`, reviewed twice):
  - 3 boxes + rail kept; boxes unequal (`1.4fr|1fr|1fr`), side by side only from 1400px, stacked below.
  - When is a read-only summary + **Edit schedule**, opening `EditScheduleModal` (new props `initialDraft`, `hidePlaybackPattern`); Apply goes back through `scheduleToDraft`, so a same-day Continuous reads One-time everywhere.
  - Playlist Playback Pattern editable in How to Play (`PlaylistPatternControl.tsx`): Apply re-counts active/scheduled Programs (`applyPlaybackPattern`, React-free, with `playback-pattern-apply.check.mts`), asks first when N > 0, writes the shared Playlist, then the rail reloads (`refreshKey`).
  - Rail shows "กำลังโหลดตัวอย่าง…" while loading.
- Rejected on the way: rows layout (built and shown, too long a scroll), tabs, no rail, per-Program play mode (Core change), draft-held pattern written at Publish.

## Verified (localhost:3000 → Core :3001 → develop DB; no draft saved, nothing published)
- Resume: `zz-fe-c-layout-draft` (`4152229e…`) lands on step 4 with 1–3 done; `tesr` (`65f1a36a…`, no channel) lands on step 3.
- Rail previews Layout (3 zones) and Playlist; Media draft built in localStorage only.
- Step 3 at 1440px (326/233/233, no overflow), 1280px (stacked 680 each) and 1024px (stacked 424 each). A first cut used `xl` (1280px): the When box was 186px and overflowed by 5px, so the breakpoint moved to 1400px.
- Modal: opens on Continuous with its values; Custom days → Apply updates box, rail, store; same-day Continuous → One time in box, store, re-opened modal; past One-time date shows "Pick today or a later date.", modal keeps the value with Apply disabled, fixing it re-enables Apply; no Playback Pattern section from the wizard, still present on the Edit page.
- Playback Pattern on Playlist `test` (`ba3b8962…`, 0 Programs): note shown, no dialog, "Saving…" with radios locked, request order = fresh `affected-programs` → read → PATCH → reload; Playlist went sequential → shuffle (rev 6) → sequential (rev 7).
- Playlist `test2` (`faac9b57…`, 2 Programs, draft faked in localStorage): dialog names 2; Cancel → no PATCH, rev still 1, selection kept.
- Gates: eslint on `publications/`, `tsc --noEmit` 0 errors, every `publications/*.check.mts` and `preview/playlist-preview` + `preview-clock` checks exit 0.

## Not verified
- Dialog **Apply** (confirm → write) on a Playlist other Programs use — deliberately not run; covered only by `playback-pattern-apply.check.mts`.
- That the rail actually *plays* the new order after Apply: only the reload request is observed (`test` has one item); `playMode` → order is covered by `preview-clock.check.mts`.
- Count-request failure and write failure paths in the UI (check-level only).
- Step 5 rail; mobile / tablet; no Lovable comparison (no source for this step).
- Step 3 at widths between 1280 and 1440 beyond the two measured.

## Findings, not fixed
- `PreviewStage` overlay controls are clipped in a narrow frame (rail, ~262px): the Side zone's controls overflow. Behaviour of the shared stage; proposed as a separate issue.
- Review step: summary rows read fine, but the Review Content card thumbnail for a Layout is the first zone's first asset, not a composite.
- Detail page Starts At / Ends At format mismatch (from s15) still open.

## Left on develop
- Playlist `test` (`ba3b8962…`): written twice, value back to sequential (revision 5 → 7). No other data changed; no Program or draft created, saved or deleted.
- Fixtures untouched: `a2b2c262…`, `zz-monthly-ui-19`, `zz-138-layout-a/b`.
- Browser localStorage `…create-draft.v14` cleared.

## Next
- Push + Draft PR → `dev` (R0; language to be asked). Then #201, then the release question (`dev` has 5 merged PRs since v0.5.2 plus this one).
