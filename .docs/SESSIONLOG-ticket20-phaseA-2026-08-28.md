# SESSIONLOG — Ticket 20 Phase A (controls + geometry selector) — 2026-08-28 (afternoon)

Continues the morning session (Step 1 extraction, see conversation transcript / prior handoff).

## What shipped

**Ticket 20 Phase A complete** — plan: `docs/layouts/plan-ticket-20-full-preview-tab.md`.

Merged into `feat/layout` as `638b0b3` (merge of `bd88005`). The `worktree-ticket-20-preview`
worktree was removed; its branch ref is kept until push.

### `bd88005` — host-free preview stage + geometry selector

- **PreviewStage.tsx** (new, ~310 lines): the playback engine extracted from PlaybackPreviewModal
  in the morning, now carrying its own controls. PlaybackPreviewModal is a thin wrapper (−212 lines).
- **Controls (Step 2):** Play/Pause, scrubber, 1×/2×/4× (pre-existing) + **Fit-to-window ⇄ Actual
  size** + **Full screen**.
  - Actual size = 1:1 at reference pixels (`resolveFramePixels`), button labels itself
    `Actual size (1920×1080)`, wrapper scrolls. Hidden entirely when nothing reports pixels.
  - Fit = `width: min(100%, calc(<82vh|70vh> * ratioW / ratioH))` — width derived from the height
    budget so the aspect ratio survives the clamp. **This is also the full-screen fix:** the frame's
    only in-flow child is `absolute`, so in the full-screen flex column it collapsed to a ~2px dot
    when width leaned on layout context.
- **preview-geometry.ts** (new, pure) + **preview-geometry.check.mts** (17 assertions):
  - `groupDeviceGeometries` — group selected Devices by `WxH` string (orientation = `width>height`,
    not a 3rd key), count each, unparsed/`null` → single `Unknown (n)` trailing group.
  - `defaultGeometry` — largest group wins (ties → earlier).
  - `editorGeometryOptions` — Reference Resolution only; legacy Layout (`reference_resolution` null)
    → `[]` → no selector renders, frame keeps stored aspect ratio.
  - `resolveFrameAspectRatio` — target `WxH` → `reference_resolution` → valid `aspect_ratio` → `16:9`.
  - `resolveFramePixels` — target `WxH` → `reference_resolution` → `null`.
- **Selector wiring:** Composition editor passes `editorGeometryOptions(layout.reference_resolution)`;
  wizard step 5 (`ReviewPublishStep` → `PublicationPlaybackPreviewButton`) passes the selected
  Devices' resolutions; Playlist `ReviewStep` passes only `referenceResolution` (no options → no
  selector, unchanged behaviour).
- **Advisory (ADR 0055):** on `deviceFit` = orientation/aspect-mismatch → amber "different shape
  from the Layout (X)" note; on `unknown` → "targets report no screen geometry, previewing at X".
  Blocks neither preview nor publish.
- **Selection is derived, not an effect** — `options.find(...) ?? defaultGeometry(options)` — because
  the option list arrives async in every host and resetting from an effect flashes the wrong frame
  and trips `react-hooks/set-state-in-effect`.

## Verification (layer the user uses — real browser, signed in, prod-pointed backend via local
Thunder_Core on :3001)

10 of 11 checklist points passed. Full table in the conversation transcript. Highlights:

- **#2 Actual/Fit** — measured: Actual `1920px` frame 1920×1080, scrolls; Fit `407×229` ratio 1.778,
  no scrollbar. Distinct.
- **#3 Full screen** — frame fills screen, 70/30 zones correct, **no longer collapses to a dot**;
  Escape restores.
- **#5 editor selector** — portrait Layout + `reference_resolution` → `1080x1920 · Authoring
  reference`, frame 9:16, no advisory (editor has no target — correct).
- **#6 legacy Layout** — no selector, no Actual-size button, frame keeps stored 16:9.
- **#9 mismatch** — portrait Composition (9:16) + landscape targets → **frame flips to 16:9 (target
  shape)**, % zone stretches to fill, no letterbox, amber advisory shown, Publish still enabled.
  This is the core ticket outcome.
- No console errors anywhere.

**#10 (`Unknown (n)` fallback) — UNVERIFIED.** Needs a Device that reports no resolution; can't be
created through the UI (it's a physical screen row). Covered only by pure-function check
(`groupDeviceGeometries([null,null]) → ["unknown"]`). Reported to the user.

### Static

- `tsc --noEmit` clean on changed files (repo-wide tsc is never clean — pre-existing).
- eslint on changed files: 3 errors / 4 warnings, **all pre-existing** (3× `set-state-in-effect` +
  `no-img-element` carried verbatim from PlaybackPreviewModal; 1 unrelated `ReviewStep` useMemo
  warning confirmed at HEAD via stash). Zero new.
- `preview-geometry.check.mts`, `preview-clock.check.mts`, `geometry.check.mts` pass.

## Environment traps hit (recorded to memory)

- The dev server proxies to the **deployed** Thunder_Core (`develop` branch) unless
  `CORE_API_URL` is set in `.env.local` **and the Next dev server is restarted** — Next does not
  hot-reload `.env.local`. `media/compositions` and `media/layouts` are `feat/layout`-only on the
  backend, so they 404 (HTML) through the proxy against the deployed backend. Fixed by running
  Thunder_Core locally on :3001. Verify with `GET /api/proxy/__config`.
- UI routing: `/media-workspace/layouts` = **Compositions** (content-binding editor);
  `/media-workspace/layouts/templates` = **Layouts** (the editor with the resolution field).
- Auto-mode classifier blocks Supabase MCP `execute_sql` even for SELECT — could not inspect
  `media_screens` for an existing no-geometry Device.

## Left in prod (ZZTEST- prefix, safe to delete — R0, needs user)

| type | id | name |
|---|---|---|
| Layout | `fa9e7913-44e4-487b-a5e5-7aaaa8558579` | `ZZTEST-ticket20-portrait` (9:16, ref `1080x1920`) |
| Composition | `afd5f18e-63d2-4bc9-87c4-98708dea9e3c` | `ZZTEST-ticket20-portrait-comp` (bound to "Boss test" playlist) |

No publication was created (wizard cancelled, nothing published/drafted).

## Not done / next

- **Phase B** — `src/app/(preview)/layout.tsx` route group, Composition-preview-loader extraction
  from `PublicationPlaybackPreviewButton`, `BroadcastChannel` session reducer with heartbeat/expiry.
  Materially riskier; check in before starting. Plan doc lines 46–61 + acceptance checks.
- Push `feat/layout` / open PR — **not done**. If PR: Draft (#10 unverified), ask Thai/English.
- Delete the 2 ZZTEST prod rows.
- Dev servers: :3001 Thunder_Core still running; :3002 frontend stopped (its worktree was removed).
  Restart frontend from the main worktree: `pnpm dev` (its `.env.local` already points at :3001).
