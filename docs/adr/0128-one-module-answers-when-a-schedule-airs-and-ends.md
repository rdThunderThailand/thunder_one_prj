# 0128 — One module answers when a Schedule airs and ends

Status: accepted (2026-11-25, owner decisions in a grilling session, revised after an outside review of
the end label in §6).
**Workspace:** media
**Extends:** ADR 0082 §7 (one summary formatter; this ADR makes the Program Detail page actually use it).
**Relates to:** GitHub #461 (this decision), #457 (Detail page raw values, closed), #464 (architecture
review round 2); ADR 0004 (status is derived, not recomputed on the client); ADR 0012 / 0014 in
Thunder_Core (`recurrence_matches`, the 23:59 rule, custom dates; Core migration
`20261111170000_daily_end_2359_through_midnight.sql`); ADR 0085 §2 (time-zone shortcuts stay out of scope);
ADR 0090 (Live Program start lock); ADR 0114 (publish errors name the cause); ADR 0126 (refusal wording).

## Context

"When does this Schedule air, when does it end, and how do we say it" is answered in two shapes and in
about a dozen places (`dev` @ cf6e195f, paths under `src/features/media-workspace/publications/`):

| Question | Draft shape (`ScheduleDraft`) | Wire shape (`PublicationSchedule`) |
|---|---|---|
| Does it air on day X? | `airsOn` (`schedule-preset.ts:266`) | `recurrenceAirsOn` (`schedule.ts:122`), reachable only from dead code |
| Next airing days | `upcomingDays` (`schedule-preset.ts:280`) | — |
| Any airing left? | `hasAiringLeft` (`schedule-preset.ts:170`) | `ends_at <= now` in `publishNow` |
| Last day / end label | 62-day scan in `publishNow` (`hooks/usePublishDraft.ts:341-360`) | `lastAiringDay` (`schedule-describe.ts:12`) |
| Summary text | `daysLine` + `windowLabel` (editor preview pane) | `describeSchedule`, `scheduleEdges`; Detail page formats its own (`PublicationDetailPage.tsx:505-547`) |

The rule "a daily end of 23:59 plays through the end of the day" and the rule "an end at midnight means the
day before" are written out separately in `schedule.ts`, `schedule-describe.ts` (4 places),
`schedule-preset.ts` (9 places) and `publishNow`. Two fixes on one day (2d0ee11e, 48bf0b22) each repaired
one copy. The copies already disagree: the Draft-side `hasAiringLeft` applies the 23:59 rule to weekly and
monthly only. Core applies it to every recurrence, custom dates included, but not to a one-off `{}`,
which stops at its stored `ends_at`.

`classifyPublicationAiring`, `formatScheduleStart` and `AiringState` (`schedule.ts`, re-exported from
`publications/index.ts:11-12`) have no production caller. Overview imports none of them.
`classifyPublicationAiring` also recomputes a Program's phase from `starts_at` / `ends_at`, which ADR 0004
forbids.

## Decision

1. **The wire shape is the one input.** A new module `publications/schedule-airing.ts` answers every
   "when does it air / end / how is it described" question. Every function there takes a
   `PublicationSchedule`, the shape Core and the Player evaluate, so the client reads the same truth with
   one copy of each rule. The module's interface:

   | Function | Answers |
   |---|---|
   | `describeSchedule(s)` | summary lines `{ title, hours, range, days }` (moved unchanged from `schedule-describe.ts`) |
   | `scheduleEdges(s)` | start / end date + time and the day-timeline window (moved; only its 23:59 literal becomes `END_OF_DAY`) |
   | `lastAiringDay(s)` | the inclusive last day, or null when open-ended (moved unchanged) |
   | `airsOn(s, ymd)` | does it air on this local day (day granularity) |
   | `upcomingDays(s, from, limit)` | the next `limit` airing days from `from`, looking at most 366 days ahead |
   | `hasAiringLeft(s, now: Date)` | does any airing window remain after `now` |
   | `lastAiring(s)` | the local date + time at which the last airing window that actually happens ends, or null when there is none or no end |

   No "on air at this minute" function: no screen asks it (YAGNI).
2. **The Draft enters through one adapter.** `toStoredSchedule(draft): PublicationSchedule | null` in
   `schedule-preset.ts` never throws. It returns null for the two inputs `draftToSchedule` cannot convert: a
   custom-dates draft with no dates, or any other draft with no start date. `draftToSchedule` keeps its
   contract (valid drafts only). `schedule-preset.ts` keeps the editing side only: presets, `validateDraft`
   (same signature), and the `scheduleToDraft` / `draftToSchedule` round trip. Its own `airsOn`,
   `upcomingDays` and `hasAiringLeft` go.
3. **One name for the 23:59 rule.** `schedule.ts` exports `END_OF_DAY = "23:59"`. Every 23:59 literal in the
   schedule modules (`schedule.ts`, `schedule-airing.ts`, `schedule-preset.ts`) that means "plays through the
   end of the day" uses it. The rule applies to weekly, monthly and custom-dates Schedules, as in Core. A
   one-off ends at its stored instant. 23:59 sentinels in components (all-day display values) stay as
   they are. `schedule.ts` keeps only primitives: time-zone conversion, `YYYY-MM-DD` helpers, `formatDmy`,
   `formatMonthDays`, `WEEKDAYS`, `TIMEZONES` and `getDayTimelinePlacement`.
4. **Day granularity for one-offs uses the inclusive last day.** `airsOn` for a one-off `{}` is
   "start day ≤ day ≤ last day". The last day is the end's local date, or the day before when the end is
   exactly 00:00 (what `lastAiringDay` computes). The Draft-side `airsOn` used the same rule
   (`schedule-preset.ts:269-272`).
5. **Dead code goes:** `classifyPublicationAiring`, `formatScheduleStart`, `AiringState`,
   `recurrenceAirsOn`, `withinDailyWindow`, their re-export in `publications/index.ts`, and their check cases.
6. **Schedule-ended message (`publishNow`).** The label is `lastAiring(stored)`: the last day that actually
   airs plus the daily end as entered (23:59 stays 23:59). A one-off uses `scheduleEdges` end date + time.
   The message reads "this Program ended at <label>, which has passed", so the label must be a moment that
   has passed. The configured end date can still lie in the future (a Mon–Fri range ending on a Sunday,
   checked on the Friday evening), so it is not used. The 62-day scan in `publishNow` goes. The message
   text in `publish-cause.ts` does not change.
7. **Program Detail page uses the module.** Recurrence uses `describeSchedule`: `title · hours · range`, the
   same line as the wizard's "When to Play", with weekday names on a second line for a weekly Schedule.
   Starts At and Ends At use `scheduleEdges` (`formatDmy(date), time`; "No end date" when open-ended),
   read in the Schedule's own time zone. `formatDate` stays for `created_at` / `activated_at`.
8. **The editor preview keeps its own text.** `daysLine` and `windowLabel` describe what is being typed,
   including drafts that are not valid yet. `describeSchedule` describes what was saved. Only the 23:59
   literal in `windowLabel` changes, to `END_OF_DAY`. The preview's day list and week grid switch to the
   module (`airsOn` / `upcomingDays` over `toStoredSchedule(draft)`).
9. **Behaviour does not change except where this ADR says so.** The allowed changes:
   - (§6) The schedule-ended label of a Schedule whose day ends at midnight now reads the last airing day
     at 23:59 instead of the next day at 00:00. Examples: weekly or monthly ending 23:59 reads
     "18/12/2026 23:59", where it read "19/12/2026 00:00"; an all-day custom-dates or one-time Schedule
     likewise. Other labels are unchanged.
   - (§3) A custom-dates Schedule whose daily end is 23:59 has airing left during the last minute of its
     last date. Before, the client said it had ended while Core was still playing.
   - (§7) Detail page text.
   - (§8) The preview shows no airing days while the start date is blank. Before, a weekly, monthly or
     continuous draft with a blank start showed matching days. Without a start, no day can be said to air.

   Any other difference the executor finds is a question for the owner, never the executor's choice.

## Considered options

- **B: every function takes either shape and normalises it into an internal `AiringRule`.** It would read
  incomplete drafts directly. Rejected because the internal rule would be a near-copy of the wire shape,
  with two adapters to keep in step. That is today's drift under a new name: nothing varies across that seam.
- **C: keep the files and remove the duplicates in place.** Delete the dead code, move the 62-day scan
  into `schedule-preset.ts`, add an end-of-day constant. Smallest diff. Rejected because two rule sets
  (Draft and wire) stay, and that is the root cause of the double fix.
- **File layout.** Keeping the name `schedule-describe.ts` was rejected: the name would not say that the
  file also answers airs/ends. Moving all three files into `publications/schedule/` was rejected: about 25
  import edits, including `PublicationEditPage.tsx`, which #459 edits at the same time.
- **Schedule-ended label = the configured end (`scheduleEdges`).** Chosen first, then rejected after
  review. It can name a date that has not come yet ("ended 20/12, which has passed" on 18/12). It also
  does not match the End row it was meant to match: that row hides itself once the draft fails
  validation.
- **Configured end with a separate "last airing passed" message.** Rejected: new wording in the ADR 0126
  table for a case the true last-airing label already states correctly.
- **Keep today's labels exactly.** Rejected: three label rules (weekly/monthly scan, others raw `ends_at`)
  and a next-day 00:00 that no other screen prints.
- **Editor preview text from `describeSchedule(toStoredSchedule(draft))`.** Rejected: the wording changes,
  and the summary goes blank while the operator is still typing.
- **Keep a client-side "live / next / ended" classifier for Overview.** Rejected: it has no caller, and
  phase comes from `effective_status` (ADR 0004).

## Consequences

- The Draft-side rules compared strings. The module reads instants in the Schedule's zone, and each zone
  read builds an `Intl.DateTimeFormat`. The module therefore resolves a Schedule's first day, last day and
  zone once per call, then compares `YYYY-MM-DD` strings per day. A per-day zone read in a 367-day loop
  would cost tens of milliseconds per render of the Edit Schedule modal.
- Overnight daily windows (end before start) are not handled by the module. `validateDraft` and Core's
  `set_schedule` both refuse them (ADR 0085), so no Schedule saved through either has one; stored data was
  not queried. The deleted `withinDailyWindow` was the only code that handled them.
- `publications/index.ts` no longer exports any schedule helper. A future Overview need goes through
  `effective_status` or a new interface function, not the old classifier.
- Left for follow-ups:
  - The Programs list row prints the raw `ends_at` date (`publication-list-display.ts:37-41`), so an
    all-day range reads one day late. The list row carries no recurrence, so the fix needs Core to send more.
  - `windowLabel` counts a one-time 11:00–23:59 as 13 hours, though Core stops at 23:59 (12 h 59 min).
    This is a bug from before this ADR.
  - The duplicate `FALLBACK_TIMEZONE` in `overview/todays-schedule.ts` (ADR 0085 §2).
  - The Calendar's occurrence labels (`calendar-day.ts`). They work on occurrences, not Schedules.
- Glossary: `CONTEXT.md` **Schedule** now defines its inclusive last day and the 23:59 rule.
- Delivery plan: `docs/media-workspace/plan-schedule-airing-461.md`.
