# Verify checklist — fetchMediaAssets pagination fix

Fix under test: `src/lib/api/media-api.ts` → `fetchMediaAssets()`
Bug: backend `GET /media/videos` returns `{items,total,page,page_size,stats}` (since Thunder_Core migration
`20260829040259_nested_feature_folders_and_trash.sql`), frontend expected a bare array → always `[]`.

Environment assumed already running:
- Thunder One (frontend): http://localhost:3000
- Thunder_Core (backend): http://localhost:3001

Report format: for every step write `PASS` / `FAIL` + the actual observed value (paste JSON / console output).
Do NOT fix anything. Only observe and report.

---

## Step 0 — confirm the frontend proxies to LOCAL core (blocking)

    curl -s http://localhost:3000/api/proxy/__config

Expected: a JSON body where the core/base URL is `http://localhost:3001`.
If it shows `https://thundercore.vercel.app` → STOP and report. The frontend is talking to deployed
develop, so nothing below tests the local backend. (Fix would be: set `CORE_API_URL=http://localhost:3001`
in thunder_one_prj `.env.local` and restart the dev server — but report first, don't do it.)

## Step 1 — raw backend shape (proves the root cause)

    curl -s "http://localhost:3000/api/proxy/media/videos?page=1&page_size=5" | head -c 800

Expected: object with keys `items`, `total`, `page`, `page_size`, `stats` (possibly wrapped in
`{"success":true,"data":{...}}`). Record `total` — call it **TOTAL**.
If it returns a top-level JSON array instead → report immediately, the diagnosis is wrong.
(A 401/redirect here is fine/expected if the proxy needs a browser session — note it and move to Step 2.)

## Step 2 — composition editor page renders assets

Open in a browser that is logged in:

    http://localhost:3000/media-workspace/layouts/877e2f92-80b4-41e6-96ae-8711c9dd9b38

Wait for the page to finish loading, then check:

2a. Zone cards / content picker show **image or video thumbnails**, not empty grey boxes.
2b. The playlist list shows cover thumbnails.
2c. DevTools → Network: there IS a `POST /api/proxy/media/videos/preview-urls` request,
    status 200, and its response body has a non-empty `urls` object.
    (Before the fix this request never fired at all — its absence = FAIL.)
2d. DevTools → Network: `GET /api/proxy/media/videos?page=1&page_size=200` returns 200.
2e. DevTools → Console: no red errors.

## Step 3 — preview modal (the reported symptom)

    http://localhost:3000/media-workspace/layouts/877e2f92-80b4-41e6-96ae-8711c9dd9b38?preview=1

3a. The "Layout preview" modal opens automatically.
3b. Each bound zone shows the real image/video — **no amber "Missing asset" placeholder**.
    - "Unbound Zone" is OK and expected for a zone with no playlist/asset bound.
    - "Missing asset" (amber text) = FAIL, report which zone.
3c. Press Play — video zones play, image zones advance between items.
3d. Console has no red errors while the modal is open.

## Step 4 — pagination loop terminates (only if TOTAL from Step 1 > 200)

If TOTAL <= 200: write "N/A, total=<TOTAL>" and skip.
If TOTAL > 200: on the page from Step 2, count the `GET /api/proxy/media/videos?page=...` requests in
Network. Expected: `ceil(TOTAL / 200)` requests, pages 1..N, then it stops. An endless stream of
requests = FAIL (infinite loop) — report immediately.

## Step 5 — no regression in the media library page

    http://localhost:3000/media-workspace  (or whichever route lists the asset library)

5a. The asset library grid still lists assets with thumbnails.
5b. Its pagination controls still work (page 2 loads different assets).
    This path uses `fetchMediaAssetPage`, which the fix did NOT touch — it must still work.

## Step 6 — typecheck

    npx tsc --noEmit

Expected: exits clean (no output). Paste any output verbatim.

---

## Final report template

    Step 0: PASS/FAIL — <core url observed>
    Step 1: PASS/FAIL — total=<TOTAL>, keys=<...>
    Step 2: 2a .. 2e each PASS/FAIL + notes
    Step 3: 3a .. 3d each PASS/FAIL + which zones showed what
    Step 4: PASS/FAIL/N-A — <n requests observed>
    Step 5: PASS/FAIL
    Step 6: PASS/FAIL — <tsc output>
    Screenshots: <paths, at least one of the open preview modal>
