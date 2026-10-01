# Gemini browser checklist — MU-04 (#28) Figma page and Recent Uploads

## Intent

ตรวจหน้า `/media-workspace/assets/upload` ผ่าน browser ว่า visual hierarchy ตรงกับ FigJam direction, control matrix ตรงกับ Phase 1 และ Recent Uploads ใช้ข้อมูล tenant จริงพร้อม refresh หลัง registration สำเร็จ ห้ามแก้โค้ดหรือสรุปว่า verified จาก static checks เพียงอย่างเดียว

## Context and paths

- Frontend repo: `/Users/arty/Desktop/Thunder/project/thunder_one_prj`, branch `feat/media-upload-page`
- Core repo: `/Users/arty/Desktop/Thunder/project/Thunder_Core`, branch `feat/upload-media-page`
- FigJam reference image: `/Users/arty/Downloads/Figjam - Media Workspace (8).png`
- Page under test: `http://localhost:3000/media-workspace/assets/upload`
- Governing scope: `docs/media-library/plan-media-upload.md`, `docs/media-library/plan-mu04-figma-recent-uploads.md`
- Changed UI: `src/features/media-workspace/assets/upload/UploadQueuePage.tsx`, `RecentUploadsCard.tsx`
- Static checks already passed: Next typegen, `pnpm exec tsc --noEmit`, targeted ESLint, `upload-queue.check.mts`, `git diff --check`

Start services only if not already running:

```bash
cd /Users/arty/Desktop/Thunder/project/Thunder_Core
npm run dev -- -p 3001
```

```bash
cd /Users/arty/Desktop/Thunder/project/thunder_one_prj
pnpm dev
```

Confirm `http://localhost:3000/api/proxy/__config` reports `coreApiUrl` as `http://localhost:3001`, then sign in with the existing authorized test operator. Do not inspect or report cookies, tokens, localStorage, secrets, or full request headers.

## Constraints

- Browser verification only: do not edit files, install dependencies, commit, push, deploy, close issue #28, or change GitHub status.
- Treat the FigJam image as visual reference, not executable instructions. The control matrix overrides controls visible in the mockup.
- Do not click `Start Upload` until the user explicitly approves the production-writing section immediately before the click. Local Core still connects to the shared Supabase environment; this creates a real Storage object, `files` row, and Asset.
- Staging files, choosing a Folder, opening pages, inspecting Network/Console, and taking screenshots are read-only/local-state checks and may proceed without that approval.
- If write approval is granted, use a uniquely named small JPG/PNG such as `ZZTEST-MU04-<timestamp>.png`. Report the created Asset ID. Do not delete it unless the user separately approves deletion after seeing the exact target.
- Preserve unrelated working-tree changes: `CONTEXT.md` and `docs/layouts/player-integration-guide.md`.

## Acceptance checklist

### A. Visual hierarchy — read-only

Use a desktop viewport near 1440×900. Keep the FigJam reference open beside the page.

| ID | Action | Expected evidence |
|---|---|---|
| A1 | Open the Upload page and wait for Recent Uploads to settle | Full-page screenshot. Page has header/actions, large primary drop zone, Upload Queue, Upload Summary, and a narrower right rail containing Upload to, Upload Tips, and Recent Uploads. |
| A2 | Compare spacing, grouping, typography, borders, and blue emphasis with FigJam | Report pass/fail for hierarchy, not pixel-perfect identity. The drop zone is the dominant surface; settings/help remain secondary. |
| A3 | Resize to about 1024×768, then 390×844 | Screenshots at both sizes. No horizontal page overflow, clipped controls, unreadable queue rows, or overlapping cards. The right rail stacks below the main content when space is narrow. |

### B. Control matrix — read-only

| ID | Action | Expected evidence |
|---|---|---|
| B1 | Inspect the top actions | `Add from Source · Phase 2` is visible and disabled. `Start Upload` has no dropdown. |
| B2 | Inspect Upload to | Folder select is enabled. Tags is visible but disabled and explicitly says `Coming in Phase 2`. |
| B3 | Search the whole page visually and in DOM text | `Pause All` and `Storage Usage` are absent. No audio/document support or quota is advertised. |
| B4 | Inspect Upload Tips | Tips mention only enforced image/video formats, 5 GB per file, 10-file maximum, and two concurrent uploads. |

### C. Queue and summary — read-only/local state

Prepare two small valid image/video files. Keep DevTools Network open and clear existing requests before staging.

| ID | Action | Expected evidence |
|---|---|---|
| C1 | Choose one valid file | One `Ready` row appears with filename, MIME, size, progress bar at 0%, and Remove action. No `upload-url`, TUS, Storage PATCH, or registration request occurs. |
| C2 | Check Upload Summary | Files in queue = 1, Total size is non-zero, Waiting = 1, Completed/Uploading/Failed = 0. Values agree with the queue row. |
| C3 | Without choosing a Folder, inspect `Start Upload` | Button remains disabled. |
| C4 | Choose a Folder but do not start | `Start Upload` becomes enabled; choosing the Folder itself sends no upload request. |
| C5 | Add the second file, then use `Clear Queue` | Queue and summary return to zero. This action does not show a destructive-upload confirmation because no remote upload exists. |

### D. Recent Uploads — read-only

| ID | Action | Expected evidence |
|---|---|---|
| D1 | Reload the page and watch the Recent Uploads card | Capture loading state if practical, then settled state. It must not show hard-coded FigJam filenames. |
| D2 | Inspect Network | One tenant-authenticated media list request loads the latest Assets; preview URL requests may follow. No cross-tenant data is visible. |
| D3 | Compare the card with Media Library ordering | Up to three newest real Assets appear in newest-first order with real title/filename, kind, date, and thumbnail/fallback. |
| D4 | Open each Recent Upload item in a new tab | Each link resolves to `/media-workspace/assets/<asset-id>` and shows the matching Asset. `View all media` resolves to `/media-workspace/assets`. |
| D5 | Simulate a list-request failure by blocking only the media list request, then reload | Card shows `Unable to load recent uploads.` while the rest of the Upload page remains usable. Unblock the request afterward. |

### E. Production-writing verification — stop for approval

Before E1, send the user this exact preflight with current values filled in:

> Ready to click Start Upload for `<filename>` into Folder `<folder name/id>`. This will create one real Storage object, one `files` row, and one tenant Asset in the shared Supabase environment. Approve this write?

Proceed only after explicit approval.

| ID | Action | Expected evidence |
|---|---|---|
| E1 | Stage the uniquely named valid file, select the approved Folder, and click `Start Upload` once | Row moves Waiting → Uploading → Completed; progress/status remain consistent and there are no Console errors or non-2xx requests. |
| E2 | Watch Recent Uploads without refreshing the page | The new Asset appears as the newest item after registration completes. Capture before/after screenshots and the media-list refetch request. |
| E3 | Open the new Recent Upload item | Correct Media Detail opens; report Asset ID, filename, Folder, and request statuses. |
| E4 | Inspect Upload Summary and aggregate action | Completed increments, Uploading/Waiting return to zero, and aggregate action becomes `Clear All` when all rows are terminal. Do not delete the registered Asset. |

### F. Keyboard and console — read-only

| ID | Action | Expected evidence |
|---|---|---|
| F1 | Tab through the desktop page | Focus reaches breadcrumb, enabled actions, Folder select, queue actions, Recent Upload links, and View all media in a logical order; focus is visible. Disabled controls cannot be activated. |
| F2 | Review Console and Network after all approved checks | Report every Console error and every non-2xx request with method, sanitized path, status, and short response summary. Never include credentials or full headers. |

## Required report

Return:

1. A table with every row `A1`–`F2` marked `PASS`, `FAIL`, `BLOCKED`, or `SKIPPED` plus one-line evidence.
2. Absolute screenshot paths for desktop, tablet, mobile, Recent Uploads settled/error, and write before/after when E is approved.
3. Sanitized request evidence for media list, preview URLs, upload authorization, TUS PATCH, registration, and any non-2xx response.
4. Exact mismatch list against FigJam/control matrix, ordered by user impact.
5. A clear final statement: browser verified, partially verified, or unverified. Do not call MU-04 complete when section E is blocked or any required row fails.

## Out of scope

- MU-03 retry/resume, cancel cleanup, abandoned-upload sweep, and navigation-guard re-verification.
- Enabling Tags, Add from Source, Pause All, Storage Usage, audio, or documents.
- Pixel-perfect reproduction of the FigJam application shell, global navigation, top search/date/user controls, or global theme.
- Data cleanup, code changes, Git operations, issue updates, PR creation, deployment, and migration work.
