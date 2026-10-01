# Browser checklist — MU-03 (#27) cancel, retry and recover

**What this covers:** the two acceptance criteria that only the browser can prove — AC 3 (retry resumes from the prior TUS offset; expired authorization restarts only that file) and AC 5 (canceling before registration leaves no Asset and invokes tenant-checked cleanup). AC 6 (the sweep) is already verified end-to-end over HTTP and SQL and does not need the browser.

## Preconditions

- `Thunder_Core` running locally on `:3001` (the frontend's `.env.local` has `CORE_API_URL=http://localhost:3001`). Confirm with `curl -s localhost:3001/api/proxy/__config` from the frontend, or just check the terminal running it.
- `thunder_one_prj` dev server running, signed in as an operator of tenant `THUNDER_001`.
- Page under test: `/media-workspace/assets/upload`.
- Have one **large MP4 (at least 60 MB)** ready. Anything smaller finishes inside a single 6 MB TUS chunk pair and there is no partial offset to resume from — the test cannot fail honestly with a small file.
- Have two or three small valid files (MP4/PNG/JPG) for the queue-continuity checks.

## A. Cancel an active upload leaves nothing behind (AC 5)

| # | Step | Expected |
|---|---|---|
| A1 | Stage the large MP4 plus two small files, pick a Folder, press `Start Upload` | Two rows go `uploading`, the third stays `waiting` |
| A2 | While the large file is mid-progress (say 20-60%), press `Cancel` on **its row only** | That row becomes `canceled`; the other uploading row keeps its progress and the `waiting` row starts |
| A3 | Open DevTools → Network, filter `cancel` | A `POST` to `/api/proxy/...media/uploads/cancel` returned **200** |
| A4 | Let the remaining files finish | They register normally; the canceled file does **not** appear in Media Library |
| A5 | Report the canceled file's name and size | Used to confirm at SQL level that its `files` row is `status='canceled'`, `is_deleted=true`, and its Storage object is gone |

**Fail if:** cancelling one row stops or resets another row; the cancel request 4xx/5xx; or the canceled file shows up as an Asset.

## B. Retry resumes rather than restarts (AC 3)

| # | Step | Expected |
|---|---|---|
| B1 | Stage the large MP4 alone, pick a Folder, `Start Upload`, let it reach roughly 40-70% | Progress climbing |
| B2 | In DevTools → Network, switch the throttling profile to **Offline** | Within a few seconds the row goes `failed` with an error message beside the filename |
| B3 | Note the percentage shown on the failed row | Needed for B5 |
| B4 | Switch throttling back to **No throttling**, then press `Retry` on that row | The row goes `waiting` then `uploading` |
| B5 | **Watch where the progress bar starts** | It resumes **near the percentage from B3**, not from 0% |
| B6 | In Network, look at the requests the retry made | There should be **no new** `media/videos/upload-url` call — the retry reuses the first attempt's authorization. Requests go straight to `…storage.supabase.co/storage/v1/upload/resumable/…` with a `PATCH` |
| B7 | Let it finish | The file registers and appears in Media Library once, in the chosen Folder |

**Fail if:** the bar restarts at 0%; a second `upload-url` request appears on retry; or two Assets appear for one file.

**This is the criterion MU-02 never actually exercised** — before this change every retry re-authorized and silently restarted from zero, so B5 and B6 are the real subject of this checklist.

## C. Expired authorization restarts only that file (AC 3, second half)

| # | Step | Expected |
|---|---|---|
| C1 | Repeat B1-B3 to get one large file into `failed` with a stored offset | A `failed` row |
| C2 | Before pressing Retry, press `Cancel` on that same row | The row's reservation is released server-side (a `cancel` request in Network, 200) |
| C3 | Press `Retry` on it | It restarts **from 0%** — its authorization is gone, so it re-authorizes: a fresh `media/videos/upload-url` call **does** appear this time |
| C4 | Stage a second file alongside it and start | Only the expired file restarted; nothing else in the queue was reset |
| C5 | Let both finish | Both register; Media Library shows each once |

**Fail if:** the retry tries to resume against the dead reservation and fails permanently; or another row is disturbed.

## D. Queue-wide actions still clean up (AC 5, aggregate)

| # | Step | Expected |
|---|---|---|
| D1 | Stage three files, `Start Upload`, then press `Cancel All` while two are uploading | Uploading rows go terminal, waiting rows go `canceled` |
| D2 | Check Network | One `media/uploads/cancel` request **per file that had started**, all 200 |
| D3 | Press `Clear All` | All terminal rows disappear; **no registered Asset is deleted** — reload Media Library and confirm earlier uploads are still there |

**Fail if:** `Clear All` removes anything from Media Library, or a cancel request returns 409/500.

## E. Navigation guard still holds (AC 4 regression)

| # | Step | Expected |
|---|---|---|
| E1 | With work `uploading`, try to close the tab or navigate away | The browser's leave-site confirmation appears |
| E2 | Cancel everything, then try again | No confirmation |

## What to send back

For each of A-E: pass/fail per row, plus
- the percentage pair from B3/B5 (this is the evidence for AC 3),
- whether a new `upload-url` request appeared in B6 and in C3,
- the canceled file's name/size from A5,
- any request that returned a non-2xx, with its status and response body,
- any console error.
