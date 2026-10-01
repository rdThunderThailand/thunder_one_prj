# SESSIONLOG — ver02 Create wizard, ticket #76 (step re-cut)

**Date:** 2026-09-10 · **Branch:** `feat/pubflow` · **Model:** Sonnet
**Ticket:** rdThunderThailand/thunder_one_prj#76 — re-cut the five steps + bump the draft persist key
**Docs read first:** ADR 0072, `docs/publications/ver02/plan-create-wizard.md`, tickets #76–#87, handoff at `/tmp/handoff-ver02-create-wizard-2026-09-10.md`

## What changed

Structural re-cut only — no visual work from the ver02 frames (that is #79+).

### Step boundaries (ADR 0072 §2)
`Basic Info → Content → Channels → Schedule → Review&Publish` → `Choose Content → Prepare Content → Program → Review → Publish`.

- `mock-data.ts` — `wizardSteps` relabelled to the five ver02 names.
- `step-validation.ts` — `WizardStepId` is now `1|2|3|4|5`. `validateStep`:
  - 1 = content selection (asset / playlist / composition) — was step 2
  - 2 = basic info (name, type, description limit) — was step 1
  - 3 = channels **and** schedule (Program combines old 3 + 4)
  - 4, 5 = no gate
  - `Step1Context` / `campaignIds` availability check removed.
- `next-transition.ts` — dropped the `ctx` param from `attemptNext`.
- `CreatePublicationPage.tsx` — step render blocks remapped; step 3 stacks `ChannelsStep` + `ScheduleStep` (the ver02 three-column layout is #84); steps 4 & 5 both render `ReviewPublishStep` (the visual split is #85/#86). Validation-error modal now keys on step 1 (content) / step 3 (program); inline field errors on step 2 / step 3.
- `publish-eligibility.ts` — checklist rows now read primitives (`isScheduleFormValid`, `channelIds.length`) instead of `validateStep(3|4)`, since step 3 now covers both; `basicInfoOk` reads `validateStep(2)`.

### Drop `campaignId` + `language` (ADR 0072 §2 — no API change; both optional in every payload type)
- `BasicInfoState` and `defaultBasicInfo` lose both fields.
- `BasicInfoForm` — Campaign select, Language select and the campaign-derived Brand field removed; no longer takes `campaigns`.
- `campaigns` fully removed from the wizard: `usePublishDraft` stops calling `fetchCampaigns`; `ContentStep`, `AssetLibraryStep`, `ContentSummaryPanel`, `PreviewPanel`, `ScheduleStep`, `ReviewPublishStep` lose the prop and the Campaign/Brand/Language summary rows.
- `draft-mapping.ts` / `detail-mapping.ts` / `resume-prompt.ts` / `publications-api.ts` stop reading or sending them; `BasicInfoForm`-shape type `BasicInfoForm` loses `campaign_id`/`language` (wire types `Publication*` keep them — the detail page still reads them).
- `mock-data.ts` — `languageOptions` / `languageCode` / `languageLabel` deleted (no remaining reader).

### Persist key
`thunderone.publications.create-draft.v9` → `v10` (drop-not-migrate: a v9 draft has `campaignId`/`language` and a `step` that indexes the old boundaries).

### Tests (`*.check.mts`, `node:assert`, repo style)
- `basic-info-limits.check.mts` — rewritten to the new step map; all pass.
- `next-transition.check.mts` — rewritten; all pass.
- `resume-prompt.check.mts`, `publish-eligibility.check.mts` — fixtures updated; pass.
- `publication-metadata.check.mts` — **deleted** (it only covered language normalisation, now gone).

## Bug found + fixed during browser verification
Step 1 is now Choose Content, but `persistDraft(false)` (run on every Next) always POSTs
basicInfo, and `media_publication_upsert` refuses an empty `name` → the first Next threw a 400
("Invalid input: Too small"). Fixed in `usePublishDraft.ts#persistDraft`: skip the server save
when `!forPublish && !name.trim()` and return the current `publicationId` — the selection is
held in the localStorage draft until step 2 supplies a name. Mirrors the existing `saveDraft`
guard. Re-verified: 400 gone, `POST → 201` happens on the first Next *after* step 2.

## Verified
- `npx tsc --noEmit` — **0 errors repo-wide** (before and after the guard fix).
- `npx eslint <changed files>` — clean.
- All 16 `publications/*.check.mts` — pass.
- **Browser (logged in, localhost:3000, dev)** — full flow driven end to end:
  - Stepper shows the five ver02 labels; step 1 renders `ContentStep`.
  - Step 1 Next with nothing selected → modal "ยังไม่ได้เลือกคอนเทนต์".
  - Select asset → Next → step 2 with no 400 (guard), no backend row yet.
  - Step 2 `BasicInfoForm` has **no Campaign / Language / Brand**; empty name → inline
    "กรุณากรอกชื่อ Program"; fill name → Next → `POST /media/publications → 201`.
  - Step 3 "Program" renders `ChannelsStep` **and** `ScheduleStep` stacked; no channel →
    modal "ข้อมูล Program ยังไม่ครบ"; select channel → Next → content + schedule PUT, all 200.
  - Steps 4 & 5 render; step 5 shows "Publish Now" + "Back: Review".
  - Injected a fake `…create-draft.v9` blob, reloaded → dropped clean (step 1, empty, no
    resume prompt, no v9 name) — the "v9 dropped not half-hydrated" acceptance criterion.
  - No console errors after the fix (the one 400 was the pre-fix attempt); all
    `/api/proxy/media/publications*` calls 200/201.
- Test draft `d116f0bf-…` created during the run was deleted (`DELETE → 200`); injected v9 key removed.

## Deliberately deferred (not scope creep)
- Priority control stays inside `BasicInfoForm` (renders on step 2). #84 relocates it to the Program step.
- Step/section headings still read "Basic Information", "Content" etc. — the ver02 frame visuals are #82/#84.
- `#77` (stepper ticks + click-to-return) and `#78` (pending seed resolver) are the rest of PR1, not done here.

## Not committed
Per CLAUDE.md §4, nothing staged or committed — waiting on the user.
