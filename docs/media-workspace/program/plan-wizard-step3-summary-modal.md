# Plan — #199 part 1: wizard step 3 as summary + Edit Schedule modal

Decision: ADR 0083. Issue: #199 (parts 2 and 3 already fixed on branch `fix/199-wizard-step3`, commit "fix(program): resume drafts at their step; describe Layouts in wizard"). Work on the same branch; base `dev`. Rev 2 — after review round 1 (fresh count at Apply, preview refresh, locking while saving, dialog text, a runnable check, same-day summary).

## 0. Facts already confirmed — do not re-derive

- The working tree has an **unwanted experiment** in `components/ProgramStep.tsx` and `components/ScheduleStep.tsx` (rows layout, ADR 0083 Rejected). **Run `git diff --stat` first**; if it still shows only those two files with the rows layout, discard them: `git checkout -- src/features/media-workspace/publications/components/ProgramStep.tsx src/features/media-workspace/publications/components/ScheduleStep.tsx`. If anything else changed, stop and report.
- All paths below are under `src/features/media-workspace/publications/`.
- `components/edit/EditScheduleModal.tsx` props: `schedule: PublicationSchedule | null`, `playlistId`, `programName`, `onClose`, `onApply(schedule: PublicationSchedule)` (required). It does **not** write the schedule to the server; it only calls `setPlaylistPlayMode` when the pattern changed. Initial state: `scheduleToDraft(schedule, today, timezone)`. Only importer today: the Edit page.
- Converters in `schedule-preset.ts`: `draftToSchedule` (valid drafts only), `scheduleToDraft(schedule, today, timezone)`, `isDraftValid`, `validateDraft(draft, today)`, `todayIn(timezone)`. Save → re-open round-trips all 8 presets (verified in #200); a same-day Continuous comes back as One-time by design (ADR 0082 §4).
- `validateDraft` lets weekly / monthly / Continuous with a past start pass while they can still air. A past **One-time** date is invalid ("Pick today or a later date.").
- `describeSchedule(stored)` (`schedule-describe.ts`) → `{ title, hours, range, days }`; `WEEKDAYS` (`schedule.ts`) labels days. Copy `ProgramSummaryRail.tsx`'s formatting; do not invent another.
- `components/edit/schedule/PlaybackPatternField.tsx` loads `play_mode` and the affected count with one `Promise.all` and calls `onChange({ original, selected })` only when both succeed; `programCount` is internal state. Radios have no external `disabled`. The header carries a numbered "3" badge; "Repeat single item" is disabled.
- `fetchAffectedPrograms("playlists", id)` (`publish-changes/publish-changes-api.ts`) → `{ programCount, … }`; counts **active or scheduled** Programs, including those reaching the Playlist through Layout Zones; drafts are not counted.
- `setPlaylistPlayMode(id, mode)` (`playlists/services/playlists-api.ts:109`) re-fetches the Playlist and upserts it with the new `playback.playMode`. It does not touch published snapshots; those change on Publish Changes.
- The rail's preview comes from `hooks/usePublicationStagePreview.ts`; its fetch effect depends on `[enabled, branch, key]` only, so a pattern change on the same Playlist id does not reload it. `preview/playlist-preview.ts` passes `playback.playMode` into the stage. The hook is also used by `PrepareContentStep`, `ReviewStep`, `ProgramSummaryRail`.
- The draft store has **no `partialize`** — any field added to it is persisted to localStorage. Do not put the refresh signal in the store.
- `ProgramStep` renders both `HowToPlayPanel` and `ProgramSummaryRail`, so it can own a local refresh counter.
- Primitives in `src/components/ui/lovable/`: `button` (variants `default`, `outline`, …), `dialog`, `alert-dialog` (`AlertDialogAction`, `AlertDialogCancel`, …). Tokens only (ADR 0075/0076).
- Precedent for a React-free decision function with a check: `next-transition.ts` + `next-transition.check.mts` (`attemptNext`).
- Checks run with `node <file>.check.mts` (no runner). Lint `npx eslint <files>`; types `npx tsc --noEmit -p .` (0 errors today). Files ≤ 300 lines; `ReviewStep.tsx` is at 300 — do not touch it.

## Task 1 — Modal: start from a draft, hide the pattern

File: `components/edit/EditScheduleModal.tsx`

- [ ] Optional `initialDraft?: ScheduleDraft`. When given, the initial `draft` state is `initialDraft`, and `today` is `todayIn(initialDraft.timezone)`; otherwise unchanged.
- [ ] Optional `hidePlaybackPattern?: boolean` (default `false`). When `true`, `PlaybackPatternField` is not rendered and `setPlaylistPlayMode` is never called.
- [ ] `onApply(schedule)` stays the only, required callback (Apply is already disabled while `validateDraft` has errors). The Edit page call site is untouched.

## Task 2 — When box becomes a summary

File: `components/ScheduleStep.tsx` (keep the export; `ProgramStep` imports it)

- [ ] Remove the inline `SchedulePresetList` / `ScheduleConfigFields` / `SchedulePreviewPane`.
- [ ] From the store's `schedule`:
  - valid → `describeSchedule(draftToSchedule(schedule))`: title, day labels (weekly), daily hours, range, timezone — same wording as the rail.
  - invalid → the `validateDraft(schedule, today)` messages as a list, `text-danger` when `showErrors`, else `text-muted-foreground`.
- [ ] **Edit** (`ui/lovable/button`; `variant="outline"`, `variant="default"` when invalid and `showErrors`) opens `EditScheduleModal` with `schedule={null}`, `initialDraft={schedule}`, `playlistId={null}`, `hidePlaybackPattern`, `programName={programName || "Your Program"}`, and `onApply={(stored) => { setSchedule(scheduleToDraft(stored, today, schedule.timezone)); close(); }}`. This is the Save → re-open normalisation (ADR 0083 §3): a same-day Continuous comes back as One-time, so summary, modal, rail and Review agree.
- [ ] Keep the conflict banner exactly as today.

## Task 3 — Step layout and refresh signal

File: `components/ProgramStep.tsx`

- [ ] Inner grid `lg:grid-cols-3` → `lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]`.
- [ ] `const [playlistRevision, setPlaylistRevision] = useState(0)`. Pass `onPlaylistChanged={() => setPlaylistRevision((n) => n + 1)}` to `HowToPlayPanel` and `refreshKey={playlistRevision}` to `ProgramSummaryRail`.

## Task 4 — Preview reload after a pattern change

Files: `hooks/usePublicationStagePreview.ts`, `components/ProgramSummaryRail.tsx`

- [ ] `usePublicationStagePreview(assets, enabled = true, refreshKey = 0)`; add `refreshKey` to the fetch effect's dependencies. Other callers pass nothing.
- [ ] `ProgramSummaryRail` takes `refreshKey?: number` and forwards it.
- [ ] While `loading`, the rail's placeholder reads "กำลังโหลดตัวอย่าง…" instead of "ตัวอย่างคอนเทนต์จะแสดงที่นี่".

## Task 5 — Apply decision as a checked function

Files: new `playback-pattern-apply.ts` + `playback-pattern-apply.check.mts` (beside `next-transition.ts`)

- [ ] React-free, injected I/O:
  ```ts
  export type PatternApplyOutcome =
    | { kind: "saved" }
    | { kind: "cancelled" }
    | { kind: "count-failed" }
    | { kind: "save-failed" };

  export async function applyPlaybackPattern(args: {
    fetchCount: () => Promise<number>;
    confirm: (count: number) => Promise<boolean>;
    write: () => Promise<void>;
  }): Promise<PatternApplyOutcome>
  ```
  `fetchCount` throws → `count-failed`, no write. Count 0 → write. Count > 0 → `confirm(count)`; false → `cancelled`, no write. `write` throws → `save-failed`.
- [ ] Check (node:assert, stubs that record calls): 0 → one write, `saved`; 3 + confirm true → write, `saved`; 3 + confirm false → no write, `cancelled`; count throws → no write, `count-failed`; write throws → `save-failed`; `confirm` receives the fresh count.

## Task 6 — Playback Pattern in How to Play (Playlist only)

Files: `components/edit/schedule/PlaybackPatternField.tsx`, `components/HowToPlayPanel.tsx`

- [ ] Field: optional `disabled?: boolean` (locks the radios), optional `showIndex?: boolean` (default `true`; wizard passes `false`), optional `note?: ReactNode` rendered in place of the current "This changes the Playlist itself…" paragraph when given. The Edit page passes none of them → unchanged.
- [ ] `HowToPlayPanel` takes `onPlaylistChanged?: () => void` and passes it to `PlaylistHowTo`.
- [ ] In `PlaylistHowTo`, replace the read-only **Play Order** field with the field (`playlistId`, `choice`, `onChange`, `showIndex={false}`, `disabled={saving}`), and under it, when `choice.selected !== choice.original`:
  - the note, always shown (also when no dialog will appear): "การเปลี่ยนนี้บันทึกลง Playlist ทันทีเมื่อกด Apply และจะไม่ย้อนกลับแม้ทิ้ง draft นี้"
  - **Apply** (`ui/lovable/button`), disabled while `saving`.
- [ ] Apply: capture `const id = playlistId, mode = choice.selected` first, set `saving`, then `applyPlaybackPattern({ fetchCount: () => fetchAffectedPrograms("playlists", id).then((a) => a.programCount), confirm, write: () => setPlaylistPlayMode(id, mode) })`, where `confirm` opens an `AlertDialog` and resolves on its buttons (closing the dialog = cancel; the action button is disabled after the first press).
  - Dialog title: "เปลี่ยนรูปแบบการเล่นของ Playlist?"
  - Body: "Playlist นี้ถูกใช้โดย {N} Program ที่ active หรือ scheduled อยู่ การกด Apply จะบันทึกรูปแบบใหม่ลง Playlist ทันที แม้ภายหลังจะทิ้ง draft นี้ ค่าที่บันทึกแล้วก็จะยังอยู่ Program ที่เผยแพร่แล้วจะใช้รูปแบบใหม่เมื่อมีการ Publish Changes ที่ครอบคลุม Program นั้น"
  - Actions: ยกเลิก / Apply.
- [ ] Outcomes: `saved` → `setChoice({ original: mode, selected: mode })`, call `onPlaylistChanged()`; `cancelled` → nothing; `count-failed` → `text-danger` "ตรวจสอบ Program ที่ใช้ Playlist นี้ไม่สำเร็จ — ยังไม่ได้บันทึก ลองอีกครั้ง"; `save-failed` → `text-danger` "บันทึกรูปแบบการเล่นไม่สำเร็จ — ลองอีกครั้ง". Keep the selection on every non-saved outcome. Clear `saving` in all cases.
- [ ] Keep Repeat / Transition / Duration / Audio / Volume read-only and the Playlist Editor link. `CompositionHowTo` and the media branch unchanged.

## Task 7 — Docs

- [ ] ADR 0082 status line: append "§6 superseded by ADR 0083." ADR 0083 status → accepted once the owner approves this plan.

## Gates (run, report output)

- `npx eslint` on every touched file; `npx tsc --noEmit -p .` = 0 errors; every `publications/*.check.mts` passes, including the new one.

## Browser verification — ask the owner first (CLAUDE.md §3)

Dev server `localhost:3000` (develop DB). Do not Save or Publish a real draft unless the owner agrees; use a `zz-199-*` name if a Save is needed and list it for cleanup. Playlist writes only on a Playlist the owner approves.

1. 1440px and 1024px: three boxes, Where widest, nothing overflows any box.
2. New Program: When reads "Every day …". Edit → modal on Every day; Custom days, pick dates, Apply → the box shows the dates summary; rail and Review agree.
3. Re-open `zz-fe-c-layout-draft` (`4152229e…`, Continuous from 2026-09-30, no end): the box reads Continuous; Edit opens on Continuous with its values.
4. Same-day Continuous: in the modal pick Continuous, set start and end on the same day, Apply → the box, a re-opened modal, the rail and Review all read One time.
5. Invalid draft: set a past One-time date in localStorage only (no Save) → the box lists "Pick today or a later date."; Edit opens with that error; fixing it and Apply clears it.
6. The wizard's modal shows no Playback Pattern section; the Edit page's modal still shows it.
7. Playlist Program, on an approved Playlist with **0** active/scheduled Programs: change Sequential → Shuffle; the "saved immediately" note shows; Apply writes with no dialog; the radios are locked while saving; afterwards the rail preview plays in shuffle order without leaving the step. Restore the original pattern the same way.
8. On a Playlist with N > 0: Apply opens the dialog with N; **press ยกเลิก** — no write (Network shows no upsert). Never confirm on a Playlist other Programs use.
9. Layout and Media Programs: How to Play unchanged. Rail shows "กำลังโหลดตัวอย่าง…" briefly, then the preview.

## Out of scope

- `PreviewStage` overlay controls clipped in narrow frames (rail) — propose a separate issue.
- Per-Program play mode override and an atomic count-and-write in Core (ADR 0083).
