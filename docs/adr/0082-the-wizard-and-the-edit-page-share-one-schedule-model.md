# 0082 — The Create wizard and the Edit page share one schedule model

Status: accepted (2026-10-01, grilling session after v0.5.2). **§6 superseded by ADR 0083.** Amends ADR 0072 (wizard step 3 "When to Play") and `docs/program/plan-program-redesign.md` FE-E ("Wizard `ScheduleStep` is untouched").

## Context

Two schedule UIs author the same stored `PublicationSchedule` through two models:

| | Create wizard | Edit Schedule modal |
|---|---|---|
| Model | `ScheduleForm` (`types/index.ts`) | `ScheduleDraft` (`schedule-preset.ts`) |
| Converters | `scheduleFormToPayload` / `scheduleToForm` / `validateScheduleForm` (`schedule.ts`) | `draftToSchedule` / `scheduleToDraft` / `validateDraft` |
| Weekly (any weekdays) | yes | yes |
| Custom dates (`freq: "dates"`) | **no** | yes |
| Monthly | read-only | **locked** |
| One-off spanning days at set times | yes (`later`, `range`) | **locked** ("Continuous") |

So no UI can author a monthly schedule, a custom-dates Program cannot be created directly, and a monthly or multi-day one-off Program cannot have its schedule edited. Two more defects come from the split:

- `scheduleToForm` maps a stored `freq: "dates"` schedule to `recurring` with `days = []`, so resuming such a draft in the wizard (`/create?id=`) drops its dates.
- Every schedule summary formats on its own. The Edit page `ScheduleCard` (`ProgramSummaryCards.tsx` `describe()`) and `PublicationDetailPage` "Ends At" print `ends_at`, which for all-day schedules is the midnight after the last day, so "15, 16, 22 Jun" reads "15 Jun – 23 Jun".

## Decision

1. **One model.** The wizard stores and edits a `ScheduleDraft` and renders the same `ScheduleConfigFields` / `SchedulePreviewPane` as the Edit Schedule modal. `ScheduleForm` and every form-side helper go: `scheduleFormToPayload`, `scheduleToForm`, `validateScheduleForm`, `isScheduleFormValid`, `buildCalendarMonth`, `makeDefaultScheduleForm`, `SCHEDULE_TYPES`, the Play Mode card mapping in `draft-mapping.ts`, the whole `components/schedule-fields.tsx` (only `ScheduleStep` imports it), `components/MiniCalendar.tsx` (no importer today), and their checks. Callers move to `draftToSchedule` / `scheduleToDraft` / `validateDraft` (`usePublishDraft`, `publish-eligibility`, `step-validation`, `detail-mapping`, `resume-prompt`, `CreatePublicationPage`).
2. **Eight presets, the same list in both places.** The wizard's four Play Mode cards (Figma frame 3) are replaced by the preset list. Each preset is a shortcut onto one of four stored shapes:

   | Preset | Main use | Stored as | End | Daily window |
   |---|---|---|---|---|
   | Every day | always-on content; **default for a new Program** | `weekly`, all 7 days | optional | yes / all day |
   | Weekdays | office / lobby content | `weekly`, Mon–Fri | optional | yes |
   | Weekends | weekend content | `weekly`, Sat–Sun | optional | yes |
   | Date range | a campaign between two dates, same hours each day | `weekly`, all 7 days | **required** | yes |
   | Custom days | scattered calendar dates | `dates` (≤ 366) | last date | yes |
   | Monthly *(new)* | the same day(s) every month | `monthly`, `month_days` 1–31 | optional | yes |
   | One-time only | a single day | one-off `{}` within one day | same day | yes / all day |
   | Continuous *(new)* | nonstop from a set moment, e.g. a 14:00 launch, or 3 Oct 10:00 → 5 Oct 18:00 | one-off `{}` across days | optional date + time | **none** — plays through midnight |

   Day chips stay editable on the weekly presets; a day set that matches no preset highlights none.
3. **Monthly preset:** a 1–31 grid, several days allowed, start date, optional end, daily window. A month without a chosen day is skipped (Core's existing rule); picking 29–31 shows that hint. No "last day of month" — Core has no such rule.
4. **Continuous preset:** start date + time, optional end date + time, no daily window. With Monthly and Continuous every stored shape is editable, so `ScheduleDraft`'s `locked` state is removed. One-time and Continuous share the stored one-off shape `{}`, so reading it back is a rule: **within one day, or exactly 00:00 → next 00:00 = One-time; anything else = Continuous.** A Continuous entered as 14:00–18:00 on one day therefore re-opens as One-time — same stored data, same airing.
5. **Default for a new Program:** Every day, from today, no end, all day. It airs from activation like the old "Now".
6. **Playback Pattern stays out of the wizard.** `PlaybackPatternField` writes the shared Playlist's `play_mode` immediately; an unpublished draft must not change other Programs. It stays on the Edit page (ADR 0080 §6).
7. **One summary formatter.** `describeSchedule(schedule)` turns a stored schedule into the summary lines (title, hours, range with an inclusive last day, day chips). The wizard `ReviewStep` and `ProgramSummaryRail`, the Edit `ScheduleCard` and `PublicationDetailPage` "Ends At" all use it.

## Rejected

- **Keep two models, add `dates` to `ScheduleForm`** — smaller diff, but two converter pairs keep drifting; the dates-drop bug is exactly that drift.
- **Do nothing; set dates on the Edit page after creating** — leaves monthly unauthorable and multi-day one-offs uneditable.
- **Keep the four Play Mode cards as an outer layer over the presets** — a second mapping layer and a wizard that looks different from the modal. Where Figma frame 3 and the design system disagree, the design system wins.
- **Monthly stays locked / API-only** — the owner chose to author it in the UI.
- **Drop multi-day one-offs (map `later` / `range` onto Every day / Date range)** — a timed launch would air from 00:00 and a nonstop range would go dark outside a daily window: wrong on screen.
- **Playback Pattern in the wizard** — side effect on a shared Playlist before Publish.

## Consequences

- The draft's localStorage shape changes: key `thunderone.publications.create-draft.v13` → `v14`. Unfinished local v13 drafts are dropped (no migration, as at every earlier bump). Server-side drafts are unaffected — they resume through `detailToDraft` → `scheduleToDraft`.
- Wizard step 3 no longer matches Figma frame 3 (four cards → preset list).
- Existing Programs whose schedule was `locked` (monthly, multi-day one-off) open on the matching preset and become editable.
- The Edit-page and Detail-page "last day + 1" display is fixed by item 7.
- No Core change: all four stored shapes already exist (`weekly`, `dates`, `monthly`, `{}`).
- Delivery plan: `docs/program/plan-schedule-shared-model.md`.
