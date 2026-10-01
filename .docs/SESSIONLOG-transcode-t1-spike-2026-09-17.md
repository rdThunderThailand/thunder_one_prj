# SESSIONLOG — Transcode v1 T1 spike (ADR 0071) — 2026-09-17

Model: Sonnet 5 (setup) → Opus 5 (from the commit onward). Ticket: Thunder_Core#76.

## Outcome

T1 done. ADR 0071 flipped `proposed` → `accepted`, with a design change the benchmark forced:
the envelope is now **200 MB on intake + 360 s in the worker**, because encode cost is per second
(≈ 0.55 × realtime for 1080p30 on Vercel) not per byte. User chose this over "keep 200 MB only"
and over measuring `-preset veryfast` first.

## What was built (Thunder_Core, branch `spike/transcode-t1`, throwaway, pushed, no PR)

- `08e8383` route `src/app/api/core/v1/media/transcode/t1-spike/route.ts` + `ffmpeg-static` +
  `@ffprobe-installer/ffprobe` + `pnpm.onlyBuiltDependencies`
- `4faf3d5` `serverExternalPackages` for both packages (Turbopack parsed the ELF binary and failed)
- `8042dac` removed the `outputFileTracingIncludes` that double-counted ffmpeg

Vercel project changes made by the user in the dashboard: `VERCEL_SUPPORT_LARGE_FUNCTIONS=1`,
`VERCEL_ANALYZE_BUILD_OUTPUT=1`, `CRON_SECRET` added to Preview, Protection Bypass secret generated.

## Numbers (in the ADR "T1 results" table)

15 s → 28 s · 4K60 20 s → 66 s · 144 s → 257 s · 200 s → 363 s. Route-level `maxDuration = 800`
won over `vercel.json` 30 s (365 s call returned 200). First bundle 381.64 MB.

## Verified at which layer

HTTP GET on the deployed preview (`thundercore-git-spike-transcode-t1-…vercel.app`) with the
bypass header — the layer T2 will use. Local `node` check of the same recipe against all four
original fixtures also passed (Mac numbers are ≈ 15 × faster, not recorded in the ADR).

## Left open / pending R0

- Test objects `media/videos/t1-spike/{4k60,no_faststart,longest144s,over300s}.mp4` on **develop**
  Storage — delete is R0, not done.
- Develop project upload limit is 100 MB (dashboard Storage → Settings), blocks any > 100 MB fixture
  → affects T3 acceptance 5 and T6 rehearsal. User to raise it.
- Bundle size after the double-count fix: not read from the dashboard; still needed if anyone wants
  it, the "Large Functions required" answer does not depend on it.
- `.docs/` is gitignored; this file is local only.

## Next

T2 (Thunder_Core#77): worker route, single commit, no cron. Sonnet is fine for T2–T5.
