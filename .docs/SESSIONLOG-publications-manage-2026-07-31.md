# Session Log — Now & Next card on real data, and the publications management pages

**Date:** 2026-07-31
**Branch:** `feat/logic` — **not** `feat/publications-flow`. Everything below is committed as
`7db56ec` ("feat: implement comprehensive publication management dashboard…"), working tree clean.
**Backend:** `Thunder_Core` @ `feat/thunderOne` — read only, nothing changed there.

> Continues [`SESSIONLOG-publications-flow-2026-07-30.md`](./SESSIONLOG-publications-flow-2026-07-30.md).
> That log says its work is uncommitted on `feat/publications-flow`; that is **stale** — it landed on
> `feat/logic` as `14b8585` / `bdab851` / `a822462` before this session started.

---

## 1. What this session did

Two things, in order:

1. **`NowNextPublicationsCard` now reads the real API** instead of `mock-data`. Decided through a
   `/grill-me` pass — the ten decisions in §3 are settled, don't relitigate them.
2. **Built the publications management surface** — `/publications` (list) and `/publications/[id]`
   (detail), plus resuming a draft in the wizard via `?id=`. Delegated to `agy`
   (`gemini-3.1-pro-high`, spec at `/tmp/handoff-pub-manage.md`), then reviewed and corrected.

The user's framing for #2: **a config/utility surface, deliberately plain — a real designed UI will
replace it.** Don't invest in its visuals; do keep its behaviour honest.

---

## 2. Files

**New:**

- `src/features/publications/detail-mapping.ts` — `detailToDraft(detail, playlist)`, the inverse of
  `draft-mapping.ts`. Pure, no React, no fetching.
- `src/features/publications/schedule.check.mts` — runnable assertions, see §5.
- `src/features/publications/components/PublicationsListPage.tsx`
- `src/features/publications/components/PublicationDetailPage.tsx`
- `src/app/(dashboard)/publications/page.tsx`, `.../publications/[id]/page.tsx`

**Changed:**

- `schedule.ts` — added `classifyPublicationAiring` + `formatScheduleStart` (§4). The rest of the
  file is untouched and still byte-identical with `3d8d1cd`.
- `publications/index.ts` — the barrel grew a **read-side surface** so `overview` can consume it.
- `types/index.ts` — `PublicationDetail.targets` is `PublicationDeliveryTarget[]`, not `unknown[]`.
- `NowNextPublicationsCard.tsx`, `overview/mock-data.ts`, `CreatePublicationPage.tsx`,
  `publications/create/page.tsx`, `Sidebar.tsx`, `ui/Button.tsx`, `tsconfig.json`.

**Still off-limits** (kept byte-identical with `feat/publication` @ `3d8d1cd` so a merge stays cheap):
`services/publications-api.ts`, `hooks/usePublishDraft.ts`, `hooks/usePreviewUrls.ts`,
`draft-mapping.ts`, `components/MediaThumb.tsx`, `app/api/proxy/[...path]/route.ts`.

---

## 3. The ten decisions behind the Now & Next card

Settled by `/grill-me`. Each was chosen against a named alternative — reopening one means redoing
that argument.

1. **Channel and start time come from a 1+N read** (`fetchPublications("active")` then
   `fetchPublication` per row). They exist only on the detail payload. N is the number of active
   publications — a handful. The upgrade path, when it stops being a handful, is to return
   `next_start_at` + target names from `media_publications_list`; that's a Thunder_Core change.
2. **Liveness is evaluated at time-of-day granularity, not day.** `isScheduleActiveOn` (day-level,
   used by the calendar) is the wrong tool: a weekly 08:00–17:00 window is *not* live at 22:00.
3. The design's `version` column (`v.2`) **has no source anywhere** — not in the API, not in
   `CONTEXT.md`, not in any ADR. Replaced with `item_count`.
4. Multiple targets render as **first name + `+N`** with the full list in `title`. Not comma-joined
   (truncates mid-name), not one row per target (breaks the tab counts).
5. **Active publications whose window has ended are dropped silently.** See §6 — the backend never
   moves them off `active`, so this filter is load-bearing, not cosmetic.
6. `overview` reaches `publications` **through the barrel**, not by deep import. This is the repo's
   first cross-feature import; before it, `src/features/*` were completely siloed and only
   `src/app/*` imported them. Lifting the service into `src/lib/` was rejected — it would move two
   of the files that are deliberately byte-identical with the other branch.
7. `View all` and the per-row `MoreIcon` started inert. `View all` is now a real link (§7 of the
   agy work); **`MoreIcon` is still deliberately disabled** — wiring it means either building a
   dropdown this repo has no component for, or putting a one-click destructive prod action on the
   dashboard with no confirm step.
8. **The card re-derives liveness every 60s** from data it already holds. No refetch: the *set* of
   publications changes only when a human publishes, but the clock crossing a boundary is
   guaranteed to happen on its own.
9. When a detail fetch fails, that row **is not guessed into a bucket** — it is counted and reported
   ("N รายการไม่ทราบสถานะการออกอากาศ"). Placing it in "Now Live" would assert the exact thing we just
   failed to determine.
10. The classifier has **one runnable check**, not a test framework. See §5.

---

## 4. New public contract

```ts
// src/features/publications/schedule.ts
export type AiringState = "live" | "next" | "ended";
export function classifyPublicationAiring(
  schedule: PublicationSchedule | null | undefined,
  now?: Date
): AiringState | null;          // null = cannot tell; callers must not guess
export function formatScheduleStart(
  schedule: PublicationSchedule | null | undefined,
  now?: Date
): string;                      // "08:00–17:00" when weekly, else "วันนี้ 12:00" / "31 ก.ค. 12:00"
```

`classifyPublicationAiring` handles the weekly case fully: overall window, then weekday membership,
then the daily time window — the last two read in the publication's own timezone. A daily window
whose end is at or before its start is treated as wrapping past midnight.

The barrel now exports `fetchPublications`, `fetchPublication`, both helpers above, `AiringState`,
`PublicationListItem`, `PublicationDetail`, and the three page components. **Keep that list short** —
it is the only sanctioned way into this feature from outside.

---

## 5. Testing, in a repo with no test runner

`node src/features/publications/schedule.check.mts` — 17 assertions, prints
`schedule.check.mts — all assertions passed`.

- Node here is **v24.13.0, which runs `.ts`/`.mts` directly**, no flags and no dependency. Combined
  with `node:assert/strict` that gives a real check without adding vitest to a repo whose devDeps
  are eight build-essential packages.
- `.mts` (not `.ts`) so Node treats it as ESM without a `"type": "module"` in `package.json` — which
  would break the Next build. Node still prints a `MODULE_TYPELESS_PACKAGE_JSON` warning when it
  loads `schedule.ts`; that is cosmetic, ignore it.
- Node's ESM resolver does **no extension guessing**, so the imports are written `./schedule.ts`.
  That is why `tsconfig.json` gained `"allowImportingTsExtensions": true` — legal because `noEmit`
  is already true, and it only permits, never changes output.
- Nothing imports the file, so it never reaches a bundle. If vitest ever lands, it converts to a
  `*.test.ts` almost verbatim.

---

## 6. The recurring anti-pattern (worth naming)

**A stored status column that no writer ever updates.** Three instances now:

| Where | Symptom |
| --- | --- |
| `public.assets.connection_status` | reads "online" on screens that are plainly offline; fixed in the UI yesterday by showing `last_heartbeat_at` instead |
| `media_core.publications.status` | `'expired'` is in the CHECK constraint (`055`) but **no code path ever writes it** — grep of `Thunder_Core/supabase/migrations` + `src/` finds it only in `booking_core`, and pg_cron covers only `046`/`050`. A publication whose `ends_at` passed stays `active` forever |
| (the class itself) | anything derived from a clock or a heartbeat should be computed, not stored |

`status_level` on screens is the counter-example done right: computed live in `media_screens_list`
from heartbeat timing, so it cannot go stale.

**A background task is filed for the publications half** — `task_c8cf9472`, "Expire media
publications past their window", cwd `Thunder_Core`. It carries the evidence and both options
(pg_cron job vs. derive it and drop the stored value; option 2 recommended). Right now the
dashboard's §3.5 filter is *hiding* this bug rather than fixing it.

---

## 7. The agy delegation, and what came back wrong

Spec: `/tmp/handoff-pub-manage.md` (7 steps). Model `gemini-3.1-pro-high`. All acceptance criteria
passed on its first run and it touched no forbidden file. Three failure modes were pre-empted in the
spec and none of them bit: `useSearchParams` needing a Suspense boundary, `params` being a Promise
in this Next version, and this repo's lint rejecting a synchronous `setState` in an effect body.

Review found four real defects, all fixed inline rather than re-delegated:

1. **A failed list load rendered as an empty list.** `error` was set only when *both*
   `fetchPublications` calls rejected, so one failing tab showed "ไม่มี publication ดราฟต์". Split
   into `draftError` / `activeError`. This is §3.9's principle again — a failure must not be
   displayed as a fact.
2. **`<Link>` wrapping `<Button>` in five places** → `<a><button>`, which is invalid HTML and breaks
   keyboard navigation. `ui/Button.tsx` now exports `buttonClasses(variant, className)` for elements
   that must not be a `<button>`; the five call sites use it on `Link` directly.
3. **`alert()` in four handlers**, on pages that already have an inline error slot. Replaced with
   `actionError` state.
4. **Resuming a draft painted the previous draft for one frame.** `resumeLoading` started `false`
   and flipped inside the effect, so the wizard rendered stale values before the fetch began. Now a
   derived `resumePending` — which also avoids setState in an effect body (defect 4's naive fix
   would have tripped the lint rule from §7's preamble).

---

## 8. Verification actually performed

- `npx tsc --noEmit` → 0 errors · `pnpm lint` → 0 errors (4 pre-existing `<img>` warnings) ·
  `pnpm build` → success, routes include `/publications` (static) and `/publications/[id]` (dynamic).
- `node src/features/publications/schedule.check.mts` → all assertions passed.
- The Now & Next card was **loaded in a browser against prod** and rendered real data:
  Now Live (2) — `test mp4` on ThunderOne Screen 02, `KFC Wednesday Special - 199 Baht` on
  ThunderOne Screen 01 — and Next Up (1), with no "unknown status" line.

**Never exercised:**

- `/publications` and `/publications/[id]` **have not been opened in a browser at all.**
- `deletePublication` and `cancelPublication` have never been called. `CORE_API_URL` points at
  **production**; these buttons destroy real rows.
- Resuming a draft via `?id=` has not been run end-to-end.
- The `+N` target badge has no real data behind it yet — every publication on prod targets one device.

---

## 9. Gotchas carried forward

- `.env.local` needs `CORE_API_URL` + `CORE_API_KEY` or every fetch 500s with "CORE_API_URL is not
  set". `NEXT_PUBLIC_API_BASE_URL` stays empty — the proxy is same-origin, which is also **why
  `publications-api.ts` is client-only**: `apiClient` has an empty `baseURL` and requests the
  relative `/api/proxy/...`, which only resolves in a browser. A server component cannot use it.
- `CORE_API_URL` points at production. Any publish/delete/cancel test writes real rows.
- `.claude/launch.json` is committed now (`pnpm dev`, port 3000) — it went missing between sessions.
- `.docs/` is gitignored, so this file is local only.
- `AGENTS.md` still applies: read `node_modules/next/dist/docs/` before writing Next-specific code.

---

## 10. Suggested next steps

1. **Open `/publications` and `/publications/[id]` in a browser.** Neither has ever been rendered.
   The list page's two-step confirm and the detail page's six sections are unverified by eye.
2. **Exercise the destructive path once, deliberately.** Create a throwaway draft, delete it, and
   watch the request — `deletePublication` and `cancelPublication` have never run.
3. **Resume a draft** via the list page's Edit button and confirm all four store slices restore
   (basic info, asset, channels, schedule).
4. Pick up `task_c8cf9472` so the dashboard stops papering over the never-expiring publications.
5. `MoreIcon` on the dashboard card is still disabled by design (§3.7). If it should do something,
   the honest home for cancel/delete is the detail page that now exists — link to it rather than
   building a dropdown.
